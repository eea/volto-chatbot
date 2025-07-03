import React, { useState } from 'react';
import { buildLatestMessageChain } from './lib';
import { SubmitHandler } from './submitHandler';
import useWhyDidYouUpdate from './useWhyDidYouUpdate';

export function useBackendChat({
  persona,
  qgenAsistantId,
  enableQgen,
  deepResearch,
}) {
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [isFetchingRelatedQuestions] = React.useState(false); // , setIsFetchingRelatedQuestions
  const [isCancelled, setIsCancelled] = React.useState(false);
  const isCancelledRef = React.useRef(isCancelled); // scroll is cancelled
  const [currChatSessionId, setCurrChatSessionId] = React.useState(null);

  const [, setChatState] = useState(new Map([[null, 'input']])); // chatState

  const [isDeepResearchEnabled, setIsDeepResearchEnabled] = React.useState(
    deepResearch === 'always_on' || deepResearch === 'user_on',
  );

  const updateChatState = (newState, sessionId) => {
    setChatState((prevState) => {
      const newChatState = new Map(prevState);
      newChatState.set(
        sessionId !== undefined ? sessionId : currChatSessionId,
        newState,
      );
      return newChatState;
    });
  };

  // const currentChatState = () => {
  //   return chatState.get(currChatSessionId()) || 'input';
  // };

  // const [chatState, setChatState] = useState(
  //   new Map([[chatSessionIdRef.current, firstMessage ? "loading" : "input"]])
  // );

  // TODO: tweak is scrolling enabled if agentic generating
  const [, setAgenticGenerating] = React.useState(false); // agenticGenerating

  React.useEffect(() => {
    isCancelledRef.current = isCancelled;
  }, [isCancelled]);

  // TODO: use debounced state
  const [messageStore, setMessageStore] = useState({
    sessionId: null,
    messageMap: new Map(),
  });

  const messageHistory = buildLatestMessageChain(messageStore.messageMap);
  const submitHandler = React.useMemo(
    () =>
      new SubmitHandler({
        messageStore,
        setMessageStore,
        currChatSessionId,
        isCancelledRef,
        messageHistory, // needed to resend last message. Should be parrentMessage.messageId, also currMessage
        persona,
        setCurrChatSessionId,
        setIsCancelled,
        setIsStreaming,
        qgenAsistantId,
        enableQgen,
        setAgenticGenerating,
        updateChatState,
        isDeepResearchEnabled,
      }),
    // eslint-disable-next-line
    [
      persona,
      qgenAsistantId,
      enableQgen,
      currChatSessionId,
      isDeepResearchEnabled,
    ],
  );

  const clearChat = () => {
    setMessageStore({
      sessionId: null,
      messageMap: new Map(),
    });
    setCurrChatSessionId(null);
  };

  useWhyDidYouUpdate('Chatblock', [persona]);

  // console.log('history', messageHistory);

  return {
    messages: messageHistory,
    onSubmit: submitHandler.onSubmit,
    isStreaming,
    isCancelled,
    clearChat,
    isFetchingRelatedQuestions,
    isDeepResearchEnabled,
    setIsDeepResearchEnabled,
  };
}
