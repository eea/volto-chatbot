import React from 'react';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable';
import { Button, Form, Segment } from 'semantic-ui-react';

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
    deepResearch,
    showAssistantTitle,
    showAssistantDescription,
    starterPromptsPosition = 'top',
  } = data;
  const libs = { rehypePrism, remarkGfm }; // rehypePrism, remarkGfm
  const {
    onSubmit,
    messages,
    isStreaming,
    isFetchingRelatedQuestions,
    clearChat,
    setIsDeepResearchEnabled,
    isDeepResearchEnabled,
  } = useBackendChat({
    persona,
    qgenAsistantId,
    enableQgen,
    deepResearch,
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
                onChoice={(message) => {
                  onSubmit({ message });
                  setShowLandingPage(false);
                }}
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
                  onChoice={(message) => {
                    onSubmit({ message });
                  }}
                  qualityCheckContext={qualityCheckContext}
                  noSupportDocumentsMessage={noSupportDocumentsMessage}
                  enableShowTotalFailMessage={enableShowTotalFailMessage}
                  totalFailMessage={totalFailMessage}
                  showToolCalls={showToolCalls}
                  isFetchingRelatedQuestions={isFetchingRelatedQuestions}
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
              onSubmit={onSubmit}
              deepResearch={deepResearch}
              setIsDeepResearchEnabled={setIsDeepResearchEnabled}
              isDeepResearchEnabled={isDeepResearchEnabled}
            />
          </div>
        </Form>
      </div>

      {showLandingPage && starterPromptsPosition === 'bottom' && (
        <EmptyState
          {...data}
          persona={persona}
          onChoice={(message) => {
            onSubmit({ message });
            setShowLandingPage(false);
          }}
        />
      )}
    </div>
  );
}

export default injectLazyLibs(['rehypePrism', 'remarkGfm'])(ChatWindow);
