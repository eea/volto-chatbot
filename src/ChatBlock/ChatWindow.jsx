import React from 'react';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable';
import { Button, Form, Segment, Checkbox, Popup } from 'semantic-ui-react';
import { trackEvent } from '@eeacms/volto-matomo/utils';

import AutoResizeTextarea from './AutoResizeTextarea';
import { ChatMessageBubble } from './ChatMessageBubble';
import EmptyState from './EmptyState';
import { useScrollonStream, wakeApi } from "./lib";
import { useBackendChat, ChatState } from './useBackendChat';
import { SVGIcon } from './utils';
import PenIcon from './../icons/square-pen.svg';

import './style.less';

import config from "@plone/registry";

function ChatWindow({
  persona,
  rehypePrism,
  remarkGfm,
  placeholderPrompt = 'Ask a question',
  isEditMode,
  ...data
}) {
  const {
    height,
    qgenAsistantId,
    enableQgen,
    enableFeedback = true,
    scrollToInput,
    showToolCalls,
    feedbackReasons,
    qualityCheck = 'disabled',
    qualityCheckStages = [],
    qualityCheckContext = 'citations',
    noSupportDocumentsMessage,
    totalFailMessage,
    enableShowTotalFailMessage,
    showAssistantTitle,
    showAssistantDescription,
    starterPromptsPosition = 'top',
    enableMatomoTracking,
  } = data;
  const [qualityCheckEnabled, setQualityCheckEnabled] = React.useState(true);
  const libs = {rehypePrism, remarkGfm}; // rehypePrism, remarkGfm
  const abortController = React.useRef(new AbortController());
  const {
    onSubmit,
    messages,
    chatState,
    clearChat,
    error,
    wake,
  } = useBackendChat({
    persona,
    qgenAsistantId,
    enableQgen,
    signal: abortController.current.signal,
  });
  const [showLandingPage, setShowLandingPage] = React.useState(false);
  const isStreaming = chatState === ChatState.STREAMING;
  const isAwake = chatState !== ChatState.ASLEEP;
  const isFetchingRelatedQuestions = chatState === ChatState.FETCHING_RELATED;

  const textareaRef = React.useRef(null);
  const conversationRef = React.useRef(null);
  const endDivRef = React.useRef(null);
  const scrollDist = React.useRef(0); // Keep track of scroll distance

  React.useEffect(() => {
    if (!textareaRef.current || isEditMode) return;

    if (isStreaming || scrollToInput) {
      textareaRef.current.focus();
    }
  }, [isStreaming, scrollToInput, isEditMode]);

  const handleClearChat = () => {
    clearChat();
    setShowLandingPage(true);
  };

  React.useEffect(() => {
    setShowLandingPage(messages.length === 0);
  }, [messages]);

  useScrollonStream({
    isStreaming,
    scrollableDivRef: conversationRef,
    scrollDist,
    endDivRef,
    distance: 500, // distance that should "engage" the scroll
    debounce: 100, // time for debouncing
  });

  const handleStarterPromptChoice = (message) => {
    if (enableMatomoTracking) {
      trackEvent({
        category: persona?.name ? `Chatbot - ${persona.name}` : 'Chatbot',
        action: 'Chatbot: Starter prompt click',
        name: 'Message submitted',
      });
    }
    onSubmit({ message });
    setShowLandingPage(false);
  };

  return (
    <div className="chat-window">
      <div className="messages">
        {showLandingPage ? (
          <>
            {showAssistantTitle && <h2>{persona.name}</h2>}
            {showAssistantDescription && <p>{persona.description}</p>}

            {starterPromptsPosition === 'top' && (
              <EmptyState
                {...data}
                persona={persona}
                onChoice={handleStarterPromptChoice}
              />
            )}
          </>
        ) : (
          <>
            <Segment clearing basic>
              <Button
                disabled={isStreaming}
                onClick={handleClearChat}
                className="right floated clear-chat"
                aria-label="Clear chat"
              >
                <SVGIcon name={PenIcon} /> New chat
              </Button>
            </Segment>
            <div
              ref={conversationRef}
              className={`conversation ${height ? 'include-scrollbar' : ''}`}
              style={{ maxHeight: height }}
            >
              {messages?.map((m, index) => (
                <ChatMessageBubble
                  key={m.messageId}
                  message={m}
                  isMostRecent={index === 0}
                  isLoading={isStreaming}
                  enableFeedback={enableFeedback}
                  feedbackReasons={feedbackReasons}
                  libs={libs}
                  qualityCheck={qualityCheck}
                  qualityCheckStages={qualityCheckStages}
                  qualityCheckEnabled={qualityCheckEnabled}
                  onChoice={(message) => {
                    onSubmit({ message });
                  }}
                  qualityCheckContext={qualityCheckContext}
                  noSupportDocumentsMessage={noSupportDocumentsMessage}
                  enableShowTotalFailMessage={enableShowTotalFailMessage}
                  totalFailMessage={totalFailMessage}
                  showToolCalls={showToolCalls}
                  isFetchingRelatedQuestions={isFetchingRelatedQuestions}
                  enableMatomoTracking={enableMatomoTracking}
                  persona={persona}
                />
              ))}
              <div ref={endDivRef} /> {/* End div to mark the bottom */}
            </div>
          </>
        )}
        {[ChatState.ASLEEP || ChatState.STREAMING].includes(chatState) && (
          <div className="loader" />
        )}
      </div>

      <div className="chat-form">
        <Form>
          {error ? (
            <p
              id="chat-wake-error-message"
              aria-live="polite"
              className="ui red basic label form-error-label"
            >
              AbortError: {error}
            </p>
          ) : null}
          <div className="textarea-wrapper">
            <AutoResizeTextarea
              maxRows={8}
              minRows={1}
              ref={textareaRef}
              placeholder={
                messages.length > 0 ? "Ask follow-up..." : placeholderPrompt
              }
              disableSubmit={chatState !== ChatState.READY}
              enableMatomoTracking={enableMatomoTracking}
              persona={persona}
              onSubmit={onSubmit}
              onFocus={wake}
              onChange={wake}
            />
          </div>
        </Form>

        {qualityCheck === 'ondemand_toggle' && (
          <div className="quality-check-toggle">
            <Popup
              wide
              basic
              className="quality-check-popup"
              content="Checks the AI's statements against cited sources to highlight possible inaccuracies and hallucinations."
              trigger={
                <Checkbox
                  id="fact-check-toggle"
                  toggle
                  label={{
                    children: 'Fact-check AI answer',
                    htmlFor: 'fact-check-toggle',
                  }}
                  checked={qualityCheckEnabled}
                  onChange={() => setQualityCheckEnabled((v) => !v)}
                />
              }
            />
          </div>
        )}
      </div>

      {showLandingPage && starterPromptsPosition === 'bottom' && (
        <EmptyState
          {...data}
          persona={persona}
          onChoice={handleStarterPromptChoice}
        />
      )}
    </div>
  );
}

export default injectLazyLibs(['rehypePrism', 'remarkGfm'])(ChatWindow);
