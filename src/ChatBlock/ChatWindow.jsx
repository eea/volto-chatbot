import { injectLazyLibs } from '@plone/volto/helpers/Loadable';
import React from 'react';
import { Button, Form, Icon, Segment } from 'semantic-ui-react';

import AutoResizeTextarea from './AutoResizeTextarea';
import { ChatMessageBubble } from './ChatMessageBubble';
import EmptyState from './EmptyState';
import { useScrollonStream } from './lib';
import { useBackendChat } from './useBackendChat';

import './style.less';

function ChatWindow({
  persona,
  rehypePrism,
  remarkGfm,
  placeholderPrompt = 'Ask a question',
  isEditMode,
  ...data
}) {
  const { height, qgenAsistantId, enableQgen, scrollToInput, showToolCalls } =
    data;
  const libs = { rehypePrism, remarkGfm }; // rehypePrism, remarkGfm
  const { onSubmit, messages, isStreaming, clearChat } = useBackendChat({
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

  return (
    <div className="chat-window">
      <div className="messages">
        {showLandingPage ? (
          <EmptyState
            onChoice={(message) => {
              onSubmit({ message });
              setShowLandingPage(false);
            }}
            persona={persona}
            {...data}
          />
        ) : (
          <>
            <Segment clearing basic>
              <Button
                disabled={isStreaming}
                onClick={handleClearChat}
                className="right floated"
              >
                <Icon name="edit outline" /> New chat
              </Button>
            </Segment>
            <div
              ref={conversationRef}
              className={`conversation ${height ? 'include-scrollbar' : ''}`}
              style={{ maxHeight: height }}
            >
              {messages.map((m, index) => (
                <ChatMessageBubble
                  key={m.messageId}
                  message={m}
                  isMostRecent={index === 0}
                  isLoading={isStreaming}
                  libs={libs}
                  onChoice={(message) => {
                    onSubmit({ message });
                  }}
                  showToolCalls={showToolCalls}
                />
              ))}
              <div ref={endDivRef} /> {/* End div to mark the bottom */}
            </div>
          </>
        )}
        {isStreaming && <div className="loader"></div>}
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
            />
          </div>
        </Form>
      </div>
    </div>
  );
}

export default injectLazyLibs(['rehypePrism', 'remarkGfm'])(ChatWindow);
