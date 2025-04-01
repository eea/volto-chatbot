import React, { useState } from 'react';
import {
  buildLatestMessageChain,
  // createChatSession,
  // CurrentMessageFIFO,
  // delay,
  // fetchRelatedQuestions,
  // getLastSuccessfulMessageId,
  // removeMessage,
  // updateCurrentMessageFIFO,
  // updateParentChildren,
  // constructSubQuestions,
} from './lib';
import { SubmitHandler } from './submitHandler';

export function useBackendChat({ persona, qgenAsistantId, enableQgen }) {
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [isCancelled, setIsCancelled] = React.useState(false);
  const isCancelledRef = React.useRef(isCancelled); // scroll is cancelled
  const [currChatSessionId, setCurrChatSessionId] = React.useState(null);

  const [chatState, setChatState] = useState(new Map([[null, 'input']]));

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

  const currentChatState = () => {
    return chatState.get(currChatSessionId()) || 'input';
  };

  // const [chatState, setChatState] = useState(
  //   new Map([[chatSessionIdRef.current, firstMessage ? "loading" : "input"]])
  // );

  // TODO: tweak is scrolling enabled if agentic generating
  const [agenticGenerating, setAgenticGenerating] = React.useState(false);

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
    setAgenticGenerating,
    updateChatState,
  });

  const clearChat = () => {
    setCompleteMessageDetail({
      sessionId: null,
      messageMap: new Map(),
    });
    setCurrChatSessionId(null);
  };

  // console.log('history', messageHistory);

  return {
    messages: messageHistory,
    onSubmit: submitHandler.onSubmit,
    isStreaming,
    isCancelled,
    clearChat,
  };
}
