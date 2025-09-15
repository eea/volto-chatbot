import React from 'react';
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
  wakeApi,
} from './lib';

import config from "@plone/registry";

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

export const ChatState = Object.freeze({
  AWAITING_START: 'awaitingStart',
  ASLEEP: 'asleep',
  WAKING: 'waking',
  READY: 'ready',
  SUBMITTING: 'submitting',
  STREAMING: 'awake',
  FETCHING_RELATED: 'fetchingRelated',
  ERRORED: 'error',
});

function upsertToCompleteMessageMap({
  chatSessionId,
  completeMessageDetail,
  completeMessageMapOverride,
  makeLatestChildMessage = false,
  messages,
  replacementsMap = null,
  // setCompleteMessageDetail,
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
    sessionId: chatSessionId || completeMessageDetail?.sessionId || null,  // TODO: sessionid can be null because it was an initial error. what should happen?
    messageMap: newCompleteMessageMap,
  };
  // setCompleteMessageDetail(newCompleteMessageDetail);
  return newCompleteMessageDetail;
}

class SubmitHandler {
  /**
   * @param {Object} options
   * @param {AbortSignal=} options.signal  Optional parameter for additional control of the abort signal. E.g. stopping the fetch from a button press.
   */
  constructor({
    persona,
    setChatState,
    onMessageHistoryChange,
    chatTitle,
    qgenAsistantId,
    enableQgen,
    setError,
    signal,
  }) {
    this.persona = persona;
    this.chatTitle = chatTitle;
    this.setChatState = setChatState;
    this.onMessageHistoryChange = onMessageHistoryChange;
    this.qgenAsistantId = qgenAsistantId;
    this.enableQgen = enableQgen;
    this.setError = setError;

    this.onSubmit = this.onSubmit.bind(this);
    this.abortSignal = signal || null;
  }

  set messageHistory(history) {
    this._messageHistory = history;
    this.onMessageHistoryChange(history);

    if (history.length === 0) {
      this.completeMessageDetail = ({
        sessionId: null,
        messageMap: new Map(),
      });
    }
  }
  get messageHistory() {
    return this._messageHistory || [];
  }

  currChatSessionId = null;
  completeMessageDetail = {
      sessionId: null,
      messageMap: new Map(),
  }
    
  // Resets error if no message is passed
  handlePacketTimeout(message, promise) {
    this.setError(message || '');
    if (promise) {
      promise.return();
    }
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
    };

    const _res = upsertToCompleteMessageMap(info);
    const { messageMap: frozenMessageMap, sessionId: frozenSessionId } = _res;

    // on initial message send, we insert a dummy system message
    // set this as the parent here if no parent is set
    if (!parentMessage && frozenMessageMap.size === 2) {
      parentMessage = frozenMessageMap.get(SYSTEM_MESSAGE_ID) || null;
    }

    const currentAssistantId = this.persona.id;

    this.setChatState(ChatState.STREAMING);

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
      filters: {},
      selectedDocumentIds: [],
      queryOverride,
      forceSearch,
      useExistingUserMessage: isSeededChat,
      signal: this.abortSignal,
    };
    const promise = updateCurrentMessageFIFO(params);

    await delay(50);

    const packetWarningTime = 10000;
    const packetErrorTime = 15000;
    let warningTimeout = setTimeout(() => {
      this.handlePacketTimeout(promise);
    }, packetWarningTime);
    let errorTimeout = setTimeout(() => {
      this.handlePacketTimeout(promise);
    }, packetErrorTime);

    for await (const bit of promise) {
      clearTimeout(warningTimeout);
      clearTimeout(errorTimeout);
      this.handlePacketTimeout()
      
      if (bit.error) {
        stack.error = bit.error;
        throw bit.error
      } else if (bit.isComplete) {
        stack.isComplete = true;
      } else {
        warningTimeout = setTimeout(() => {this.handlePacketTimeout("Chat is taking a long time to reply.") }, packetWarningTime);
        errorTimeout = setTimeout(() => {this.handlePacketTimeout("No response was received from the chat, stopping", promise) }, packetErrorTime);
        stack.push(bit.packet);
      }

      if (stack.isComplete || stack.isEmpty()) {
        // console.log('breaking', stack.isComplete, stack.isEmpty(), stack.stack);
        break;
      }

      await delay(2);

      if (!stack.isEmpty()) {
        const packet = stack.nextPacket();

        if (packet) {
          // console.log('inside packagt', packet, {
          //   has_message_id: Object.hasOwn(packet, 'message_id'),
          //   has_answer_piece: Object.hasOwn(packet, 'answer_piece'),
          //   has_top_docs: Object.hasOwn(packet, 'top_documents'),
          //   has_tool_name: Object.hasOwn(packet, 'tool_name'),
          //   has_file_ids: Object.hasOwn(packet, 'file_ids'),
          //   has_error: Object.hasOwn(packet, 'error'),
          // });

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
          } else if (packet.error) {
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
              documents:
                finalMessage?.context_docs?.top_documents ||
                finalMessage?.final_context_docs ||
                documents,
              citations: finalMessage?.citations || {},
              files: finalMessage?.files || aiMessageImages || [],
              toolCalls: finalMessage?.tool_calls || toolCalls,
              parentMessageId: newUserMessageId,
              alternateAssistantID: null, // alternativeAssistant?.id,
            },
          ];
          // if (finalMessage) {
          //   console.log({ finalMessage });
          // }
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
          };
          newCompleteMessageDetail = upsertToCompleteMessageMap(info);
          this.messageHistory = buildLatestMessageChain(
            newCompleteMessageDetail.messageMap,
          );
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
        this.setChatState(ChatState.FETCHING_RELATED);
        const relatedQuestionsText = await fetchRelatedQuestions(
          { query, answer },
          { qgenAsistantId: this.qgenAsistantId }
        );

        lastMessage.relatedQuestions = extractJSON(relatedQuestionsText);

        this.completeMessageDetail({
          ...newCompleteMessageDetail,
          messageMap,
        });
      }
    }

    // Update internal state ready for follow up messages.
    this.messageHistory = buildLatestMessageChain(
      newCompleteMessageDetail.messageMap,
    );
    this.completeMessageDetail = newCompleteMessageDetail;
    this.setChatState(ChatState.READY);
  }
}

function extractJSON(str) {
  const regex = /\[([\s\S]*?)\]/;
  const match = str.match(regex);

  if (match) {
    const jsonText = match[0];
    // TODO: do we need safety here?
    return JSON.parse(jsonText);
  } else {
    return str.split('\n').map((question) => ({ question }));
  }
}

export function useBackendChat({
  persona,
  qgenAsistantId,
  enableQgen,
  signal,
}) {
  const [error, _setError] = React.useState('');
  const [chatState, setChatState] = React.useState(ChatState.AWAITING_START);
  const [messageHistory, setMessageHistory] = React.useState([]);

  const rewakeDelayInMs =
    config.settings["volto-chatbot"].rewakeDelay * 60 * 1000;
  
  function setError(error) {
    _setError(error);
    if (error) {
      setChatState(ChatState.ERRORED);
    }
  }

  /** Try to wake up the API. Will early return if already awake */
  async function wake() {
    const readyForWaking =
      Date.now() - rewakeDelayInMs < localStorage.getItem("chat-last-awake");
    
    if (readyForWaking) {
      localStorage.setItem("chat-last-awake", Date.now());
    }
    if (chatState === ChatState.WAKING) {
      return false;
    }
    if (![ChatState.ASLEEP, ChatState.AWAITING_START].includes(chatState)) {
      return true;
    }

    if (chatState !== ChatState.SUBMITTING) {
      setChatState(ChatState.WAKING);
    }

    try {
      const wakeResult = await wakeApi();
      if (!!wakeResult) {
        setChatState(ChatState.READY);
        localStorage.setItem("chat-last-awake", Date.now());
        return true
      }
    } catch (err) {
      setError(err.message);
    }
    return false
  }
  React.useEffect(() => {
    if (chatState === ChatState.ASLEEP) {
      return;
    }
    const timeout = setTimeout(() => {
      if (chatState === ChatState.READY) {
        setChatState(ChatState.ASLEEP);
      }
    }, rewakeDelayInMs);
    return () => clearTimeout(timeout);
  }, [chatState]);

  // Hold the submit handler to efficiently keep message history across re-renders
  const submitHandler = React.useRef(null);
  React.useEffect(() => {
    // Handle persona being both a full persona call or just an assistant ID if we didn't make the call
    const currentPersona = submitHandler.current?.persona?.id || submitHandler.current?.persona;
    const newPersona = persona?.id || persona;

    if (currentPersona === newPersona) {
      return
    }
    clearChat()
    submitHandler.current = new SubmitHandler({
      messageHistory,
      persona,
      setChatState,
      setError,
      qgenAsistantId,
      enableQgen,
      onMessageHistoryChange: setMessageHistory
    })
  }, [chatState, persona])

  const clearChat = () => {
    if (submitHandler.current) {
      submitHandler.current.currChatSessionId = null;
      submitHandler.current.messageHistory = [];  // Will trigger `setMessageHistory`
    }
  };

  // wakeApi
  const handleSubmit = React.useCallback(function handleSubmit(input) {
    const onSubmit = submitHandler.current?.onSubmit;

    if (!onSubmit) {
      throw new Error("TESTING: NO SUBMISSION HANDLER")
    }

    setChatState(ChatState.SUBMITTING);

    wake().then((isAwake) => {
      if (isAwake) {
        onSubmit(input)
      }
    }).catch((errorReason) => {
      setChatState(ChatState.ERRORED);
      setError(errorReason);
    })
  }, [chatState])

  return {
    messages: messageHistory,
    // onSubmit: submitHandler.current?.onSubmit,
    onSubmit: handleSubmit,
    chatState,
    error,
    clearChat,
    wake,
  };
}
