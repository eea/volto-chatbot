import React from 'react';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable';
import { Button, Form, Segment, Checkbox, Popup } from 'semantic-ui-react';
import { trackEvent } from '@eeacms/volto-matomo/utils';

import AutoResizeTextarea from './AutoResizeTextarea';
import { ChatMessageBubble } from './ChatMessageBubble';
import EmptyState from './EmptyState';
import { useScrollonStream } from './lib';
import { useBackendChat } from './useBackendChat';
import { SVGIcon } from './utils';
import PenIcon from './../icons/square-pen.svg';

import './style.less';

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
  const libs = { rehypePrism, remarkGfm }; // rehypePrism, remarkGfm
  const {
    onSubmit,
    messages,
    isStreaming,
    isFetchingRelatedQuestions,
    clearChat,
  } = useBackendChat({
    persona,
    qgenAsistantId,
    enableQgen,
  });
  const [showLandingPage, setShowLandingPage] = React.useState(false);

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
        {isStreaming && !isFetchingRelatedQuestions && (
          <div className="loader" />
        )}
      </div>

      <div className="chat-form">
        <Form>
          <div className="textarea-wrapper">
            <AutoResizeTextarea
              maxRows={8}
              minRows={1}
              ref={textareaRef}
              placeholder={
                messages.length > 0 ? 'Ask follow-up...' : placeholderPrompt
              }
              isStreaming={isStreaming}
              enableMatomoTracking={enableMatomoTracking}
              persona={persona}
              onSubmit={onSubmit}
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
