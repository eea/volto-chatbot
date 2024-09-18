import React, { useState } from 'react';
import {
  buildLatestMessageChain,
  createChatSession,
  CurrentMessageFIFO,
  delay,
  fetchRelatedQuestions,
  getLastSuccessfulMessageId,
  removeMessage,
  updateCurrentMessageFIFO,
  updateParentChildren,
} from './lib';

const TEMP_USER_MESSAGE_ID = -1;
const TEMP_ASSISTANT_MESSAGE_ID = -2;
const SYSTEM_MESSAGE_ID = -3;

export const RetrievalType = {
  None: 'none',
  Search: 'search',
  SelectedDocs: 'selectedDocs',
};

export const ChatFileType = {
  IMAGE: 'image',
  DOCUMENT: 'document',
  PLAIN_TEXT: 'plain_text',
};

function upsertToCompleteMessageMap({
  chatSessionId,
  completeMessageDetail,
  completeMessageMapOverride,
  makeLatestChildMessage = false,
  messages,
  replacementsMap = null,
  setCompleteMessageDetail,
}) {
  // deep copy
  const frozenCompleteMessageMap =
    completeMessageMapOverride || completeMessageDetail.messageMap;

  // eslint is old, structuredClone is builtin
  // eslint-disable-next-line no-undef
  const newCompleteMessageMap = structuredClone(frozenCompleteMessageMap);

  if (newCompleteMessageMap.size === 0) {
    const systemMessageId = messages[0].parentMessageId || SYSTEM_MESSAGE_ID;
    const firstMessageId = messages[0].messageId;
    const dummySystemMessage = {
      messageId: systemMessageId,
      message: '',
      type: 'system',
      files: [],
      toolCalls: [],
      parentMessageId: null,
      childrenMessageIds: [firstMessageId],
      latestChildMessageId: firstMessageId,
    };
    newCompleteMessageMap.set(dummySystemMessage.messageId, dummySystemMessage);
    messages[0].parentMessageId = systemMessageId;
  }
  messages.forEach((message) => {
    const idToReplace = replacementsMap?.get(message.messageId);
    if (idToReplace) {
      removeMessage(idToReplace, newCompleteMessageMap);
    }

    // update childrenMessageIds for the parent
    if (
      !newCompleteMessageMap.has(message.messageId) &&
      message.parentMessageId !== null
    ) {
      updateParentChildren(message, newCompleteMessageMap, true);
    }
    newCompleteMessageMap.set(message.messageId, message);
  });

  // if specified, make these new message the latest of the current message chain
  if (makeLatestChildMessage) {
    const currentMessageChain = buildLatestMessageChain(
      frozenCompleteMessageMap,
    );
    const latestMessage = currentMessageChain[currentMessageChain.length - 1];
    if (latestMessage) {
      newCompleteMessageMap.get(latestMessage.messageId).latestChildMessageId =
        messages[0].messageId;
    }
  }
  const newCompleteMessageDetail = {
    sessionId: chatSessionId || completeMessageDetail.sessionId,
    messageMap: newCompleteMessageMap,
  };
  setCompleteMessageDetail(newCompleteMessageDetail);
  return newCompleteMessageDetail;
}

class SubmitHandler {
  constructor({
    persona,
    setIsStreaming,
    isCancelledRef,
    setIsCancelled,
    messageHistory,
    completeMessageDetail,
    currChatSessionId,
    setCurrChatSessionId,
    setCompleteMessageDetail,
    chatTitle,
    qgenAsistantId,
    enableQgen,
  }) {
    this.persona = persona;
    this.chatTitle = chatTitle;
    this.setIsStreaming = setIsStreaming;
    this.isCancelledRef = isCancelledRef;
    this.setIsCancelled = setIsCancelled;
    this.messageHistory = messageHistory;
    this.completeMessageDetail = completeMessageDetail;
    this.currChatSessionId = currChatSessionId;
    this.setCurrChatSessionId = setCurrChatSessionId;
    this.setCompleteMessageDetail = setCompleteMessageDetail;
    this.qgenAsistantId = qgenAsistantId;
    this.enableQgen = enableQgen;

    this.onSubmit = this.onSubmit.bind(this);
  }

  async onSubmit({
    messageIdToResend,
    messageOverride,
    queryOverride,
    forceSearch,
    isSeededChat,
    message,
  } = {}) {
    if (this.currChatSessionId === null) {
      this.currChatSessionId = await createChatSession(
        this.persona.id,
        this.chatTitle,
      );
      this.setCurrChatSessionId(this.currChatSessionId);
    }

    let newCompleteMessageDetail = {};

    const messageToResend = this.messageHistory.find(
      (message) => message.messageId === messageIdToResend,
    );

    const messageMap = this.completeMessageDetail.messageMap;
    const messageToResendParent =
      messageToResend?.parentMessageId !== null &&
      messageToResend?.parentMessageId !== undefined
        ? messageMap.get(messageToResend.parentMessageId)
        : null;
    const messageToResendIndex = messageToResend
      ? this.messageHistory.indexOf(messageToResend)
      : null;
    if (!messageToResend && messageIdToResend !== undefined) {
      // eslint-disable-next-line no-console
      console.log({
        message:
          'Failed to re-send message - please refresh the page and try again.',
        type: 'error',
      });
      return;
    }

    let currMessage = messageToResend ? messageToResend.message : message;
    if (messageOverride) {
      currMessage = messageOverride;
    }
    const currMessageHistory =
      messageToResendIndex !== null
        ? this.messageHistory.slice(0, messageToResendIndex)
        : this.messageHistory;
    let parentMessage =
      messageToResendParent ||
      (currMessageHistory.length > 0
        ? currMessageHistory[currMessageHistory.length - 1]
        : null) ||
      (messageMap.size === 1 ? Array.from(messageMap.values())[0] : null);

    // if we're resending, set the parent's child to null
    // we will use tempMessages until the regenerated message is complete
    const messageUpdates = [
      {
        messageId: TEMP_USER_MESSAGE_ID,
        message: currMessage,
        type: 'user',
        files: [], // currentMessageFiles,
        toolCalls: [],
        parentMessageId: parentMessage?.messageId || null,
      },
    ];
    if (parentMessage) {
      messageUpdates.push({
        ...parentMessage,
        childrenMessageIds: (parentMessage.childrenMessageIds || []).concat([
          TEMP_USER_MESSAGE_ID,
        ]),
        latestChildMessageId: TEMP_USER_MESSAGE_ID,
      });
    }

    const info = {
      messages: messageUpdates,
      chatSessionId: this.currChatSessionId,
      completeMessageDetail: this.completeMessageDetail,
      setCompleteMessageDetail: this.setCompleteMessageDetail,
    };

    const _res = upsertToCompleteMessageMap(info);
    const { messageMap: frozenMessageMap, sessionId: frozenSessionId } = _res;

    // on initial message send, we insert a dummy system message
    // set this as the parent here if no parent is set
    if (!parentMessage && frozenMessageMap.size === 2) {
      parentMessage = frozenMessageMap.get(SYSTEM_MESSAGE_ID) || null;
    }

    const currentAssistantId = this.persona.id;

    this.setIsStreaming(true);

    let answer = '';
    let query = null;
    let retrievalType = RetrievalType.None;
    let documents = []; // selectedDocuments;
    let aiMessageImages = null;
    let error = null;
    let finalMessage = null;
    let toolCalls = [];

    const glsm = getLastSuccessfulMessageId;
    const lastSuccessfulMessageId = glsm(currMessageHistory);

    const stack = new CurrentMessageFIFO();
    // here is the problem
    const params = {
      message: currMessage,
      alternateAssistantId: currentAssistantId,
      fileDescriptors: [],
      parentMessageId: lastSuccessfulMessageId,
      chatSessionId: this.currChatSessionId,
      promptId: 0,
      filters: [],
      selectedDocumentIds: [],
      queryOverride,
      forceSearch,
      useExistingUserMessage: isSeededChat,
    };
    const promise = updateCurrentMessageFIFO(
      params,
      this.isCancelledRef,
      this.setIsCancelled,
    );

    await delay(50);

    for await (const bit of promise) {
      if (bit.error) {
        stack.error = bit.error;
      } else if (bit.isComplete) {
        stack.isComplete = true;
      } else {
        stack.push(bit.packet);
      }

      if (stack.isComplete || stack.isEmpty()) {
        break;
      }

      await delay(2);

      if (!stack.isEmpty()) {
        const packet = stack.nextPacket();

        if (packet) {
          if (Object.hasOwn(packet, 'answer_piece')) {
            answer += packet.answer_piece;
          } else if (Object.hasOwn(packet, 'top_documents')) {
            documents = packet.top_documents;
            query = packet.rephrased_query;
            retrievalType = RetrievalType.Search;
            if (documents && documents.length > 0) {
              // point to the latest message (we don't know the messageId yet, which is why
              // we have to use -1)
              // setSelectedMessageForDocDisplay(TEMP_USER_MESSAGE_ID);
            }
          } else if (Object.hasOwn(packet, 'tool_name')) {
            toolCalls = [
              {
                tool_name: packet.tool_name,
                tool_args: packet.tool_args,
                tool_result: packet.tool_result,
              },
            ];
          } else if (Object.hasOwn(packet, 'file_ids')) {
            aiMessageImages = packet.file_ids.map((fileId) => {
              return {
                id: fileId,
                type: ChatFileType.IMAGE,
              };
            });
          } else if (Object.hasOwn(packet, 'error')) {
            error = packet.error;
          } else if (Object.hasOwn(packet, 'message_id')) {
            finalMessage = packet;
          }

          const newUserMessageId =
            finalMessage?.parent_message || TEMP_USER_MESSAGE_ID;
          const newAssistantMessageId =
            finalMessage?.message_id || TEMP_ASSISTANT_MESSAGE_ID;

          const localMessages = [
            {
              messageId: newUserMessageId,
              message: currMessage,
              type: 'user',
              files: [],
              toolCalls: [],
              parentMessageId: parentMessage?.messageId || null,
              childrenMessageIds: [newAssistantMessageId],
              latestChildMessageId: newAssistantMessageId,
            },
            {
              messageId: newAssistantMessageId,
              message: error || answer,
              type: error ? 'error' : 'assistant',
              retrievalType,
              query: finalMessage?.rephrased_query || query,
              documents: finalMessage?.context_docs?.top_documents || documents,
              citations: finalMessage?.citations || {},
              files: finalMessage?.files || aiMessageImages || [],
              toolCalls: finalMessage?.tool_calls || toolCalls,
              parentMessageId: newUserMessageId,
              alternateAssistantID: null, // alternativeAssistant?.id,
            },
          ];
          const replacementsMap = finalMessage
            ? new Map([
                [localMessages[0].messageId, TEMP_USER_MESSAGE_ID],
                [localMessages[1].messageId, TEMP_ASSISTANT_MESSAGE_ID],
              ])
            : null;
          const info = {
            chatSessionId: frozenSessionId,
            completeMessageMapOverride: frozenMessageMap,
            messages: localMessages,
            replacementsMap: replacementsMap,
            setCompleteMessageDetail: this.setCompleteMessageDetail,
          };
          newCompleteMessageDetail = upsertToCompleteMessageMap(info);
        }

        if (this.isCancelledRef.current) {
          this.setIsCancelled(false);
          break;
        }
      }
    }

    if (
      newCompleteMessageDetail.messageMap &&
      this.enableQgen &&
      typeof this.qgenAsistantId !== 'undefined'
    ) {
      // check if last message comes from assistant
      const { messageMap } = newCompleteMessageDetail;
      const messageList = buildLatestMessageChain(messageMap).reverse();

      const lastMessage = messageList.find((m) => m.type === 'assistant');
      const userMessage = messageList.find((m) => m.type === 'user');
      if (lastMessage && userMessage) {
        const query = userMessage.message;
        const answer = lastMessage.message;
        const relatedQuestionsText = await fetchRelatedQuestions(
          { query, answer },
          this.qgenAsistantId,
        );

        lastMessage.relatedQuestions = extractJSON(relatedQuestionsText);

        this.setCompleteMessageDetail({
          ...newCompleteMessageDetail,
          messageMap,
        });
      }
    }
    this.setIsStreaming(false);
  }
}

function extractJSON(str) {
  const regex = /\[([\s\S]*?)\]/;
  const match = str.match(regex);

  if (match) {
    const jsonText = match[0];
    // TODO: do we need safety here?
    return JSON.parse(jsonText);
  }
}

export function useBackendChat({ persona, qgenAsistantId, enableQgen }) {
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [isCancelled, setIsCancelled] = React.useState(false);
  const isCancelledRef = React.useRef(isCancelled); // scroll is cancelled
  const [currChatSessionId, setCurrChatSessionId] = React.useState(null);

  React.useEffect(() => {
    isCancelledRef.current = isCancelled;
  }, [isCancelled]);

  const [completeMessageDetail, setCompleteMessageDetail] = useState({
    sessionId: null,
    messageMap: new Map(),
  });

  const messageHistory = buildLatestMessageChain(
    completeMessageDetail.messageMap,
  );
  const submitHandler = new SubmitHandler({
    completeMessageDetail,
    currChatSessionId,
    isCancelledRef,
    messageHistory,
    persona,
    setCompleteMessageDetail,
    setCurrChatSessionId,
    setIsCancelled,
    setIsStreaming,
    qgenAsistantId,
    enableQgen,
  });

  const clearChat = () => {
    setCompleteMessageDetail({
      sessionId: null,
      messageMap: new Map(),
    });
    setCurrChatSessionId(null);
  };

  return {
    messages: messageHistory,
    onSubmit: submitHandler.onSubmit,
    isStreaming,
    isCancelled,
    clearChat,
  };
}
