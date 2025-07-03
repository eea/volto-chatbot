import {
  CurrentMessageFIFO,
  buildLatestMessageChain,
  createChatSession,
  // delay,
  extractJSON,
  fetchRelatedQuestions,
  getLastSuccessfulMessageId,
  updateCurrentMessageFIFO,
} from './lib';
import { SYSTEM_MESSAGE_ID, TEMP_USER_MESSAGE_ID } from './constants';
import { upsertToMessageStore } from './upsetToCompleteMessageMap';
import { FeedParser } from './feedparser';

const gLSM = getLastSuccessfulMessageId;

export class SubmitHandler {
  constructor({
    persona,
    setIsStreaming,
    isCancelledRef,
    setIsCancelled,
    messageStore,
    currChatSessionId,
    setCurrChatSessionId,
    messageHistory, // used for interacting with useBackendChat
    setMessageStore, // used for interacting with useBackendChat
    chatTitle,
    qgenAsistantId,
    enableQgen,
    setAgenticGenerating,
    updateChatState,
    isDeepResearchEnabled,
  }) {
    this.persona = persona;
    this.chatTitle = chatTitle;
    this.setIsStreaming = setIsStreaming;
    this.isCancelledRef = isCancelledRef;
    this.setIsCancelled = setIsCancelled;
    this.messageHistory = messageHistory;
    this.messageStore = messageStore;
    this.currChatSessionId = currChatSessionId;
    this.setCurrChatSessionId = setCurrChatSessionId;
    this.setMessageStore = setMessageStore;
    this.qgenAsistantId = qgenAsistantId;
    this.enableQgen = enableQgen;
    this.isDeepResearchEnabled = isDeepResearchEnabled;

    this.agenticDocs = null;
    this.secondLevelMessageId = null;
    this.includeAgentic = true;
    this.second_level_generating = false;
    this.isImprovement = false;
    this.is_generating = false;
    this.isStreamingQuestions = false;
    this.setAgenticGenerating = setAgenticGenerating;
    this.sub_questions = [];
    this.updateChatState = updateChatState;

    this.isAgentic = false; // declared here because of scoping

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

    let newMessageStore = {};

    const messageToResend = this.messageHistory.find(
      (message) => message.messageId === messageIdToResend,
    );

    const messageMap = this.messageStore.messageMap;
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

    const _store = upsertToMessageStore({
      messages: messageUpdates,
      chatSessionId: this.currChatSessionId,
      messageStore: this.messageStore,
      setMessageStore: this.setMessageStore,
    });
    const { messageMap: frozenMessageMap, sessionId: frozenSessionId } = _store;

    // on initial message send, we insert a dummy system message
    // set this as the parent here if no parent is set
    if (!parentMessage && frozenMessageMap.size === 2) {
      parentMessage = frozenMessageMap.get(SYSTEM_MESSAGE_ID) || null;
    }

    const currentAssistantId = this.persona.id;

    const stack = new CurrentMessageFIFO();

    const promise = updateCurrentMessageFIFO(
      {
        message: currMessage,
        alternateAssistantId: currentAssistantId,
        fileDescriptors: [],
        parentMessageId: gLSM(currMessageHistory),
        chatSessionId: this.currChatSessionId,
        promptId: 0,
        filters: {},
        selectedDocumentIds: [],
        queryOverride,
        forceSearch,
        useExistingUserMessage: isSeededChat,
        use_agentic_search: !!this.isDeepResearchEnabled,
      },
      this.isCancelledRef,
      this.setIsCancelled,
    );

    const parser = new FeedParser({
      frozenSessionId,
      frozenMessageMap,
      parentMessage,
      currMessage,
      setMessageStore: this.setMessageStore,
    });

    this.setIsStreaming(true);
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

      if (!stack.isEmpty()) {
        const packet = stack.nextPacket();

        if (packet) {
          parser.read(packet);
          newMessageStore = parser.getCompleteMessageStore();
        }

        if (this.isCancelledRef.current) {
          this.setIsCancelled(false);
          break;
        }
      }
    }

    if (
      this.enableQgen &&
      typeof this.qgenAsistantId !== 'undefined' &&
      newMessageStore.messageMap
    ) {
      // check if last message comes from assistant
      const { messageMap } = newMessageStore;
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

        this.setMessageStore({
          ...newMessageStore,
          messageMap,
        });
      }
    }

    this.setIsStreaming(false);
  }
}
