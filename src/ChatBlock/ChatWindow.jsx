import React from 'react';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable';
import { Icon, Form, Button, Segment } from 'semantic-ui-react';

import AutoResizeTextarea from './AutoResizeTextarea';
import { ChatMessageBubble } from './ChatMessageBubble';
import EmptyState from './EmptyState';
import { useBackendChat } from './useBackendChat';
import { useScrollonStream } from './lib';

import { SVGIcon } from './utils';
import SendIcon from './../icons/send.svg';

import './style.less';

function ChatWindow({
  persona,
  rehypePrism,
  remarkGfm,
  placeholderPrompt = 'Ask a question',
  isEditMode,
  ...data
}) {
  const { height, qgenAsistantId, enableQgen, scrollToInput } = data;
  const libs = { rehypePrism, remarkGfm }; // rehypePrism, remarkGfm
  const { onSubmit, messages, isStreaming, clearChat } = useBackendChat({
    persona,
    qgenAsistantId,
    enableQgen,
  });
  const [input, setInput] = React.useState('');
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit({ message: input });
      setInput('');
    }
  };

  React.useEffect(() => {
    setShowLandingPage(messages.length === 0);
  }, [messages]);

  //eslint-disable-next-line
  console.log(messages);

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
              <Button onClick={handleClearChat} className="right floated">
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
              value={input}
              placeholder={
                messages.length > 0 ? 'Ask follow-up...' : placeholderPrompt
              }
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  handleSubmit(e);
                } else if (e.key === 'Enter' && e.shiftKey) {
                  e.preventDefault();
                  setInput(input + '\n');
                }
              }}
              trigger={
                <Button
                  className="submit-btn"
                  disabled={isStreaming}
                  type="submit"
                  aria-label="Send"
                  onKeyDown={(e) => {
                    handleSubmit(e);
                  }}
                  onClick={(e) => {
                    handleSubmit(e);
                  }}
                >
                  <div className="btn-icon">
                    <SVGIcon name={SendIcon} size="28" />
                  </div>
                </Button>
              }
            />
          </div>
        </Form>
      </div>
    </div>
  );
}

export default injectLazyLibs(['rehypePrism', 'remarkGfm'])(ChatWindow);
