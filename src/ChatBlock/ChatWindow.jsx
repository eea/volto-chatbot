import { injectLazyLibs } from '@plone/volto/helpers/Loadable';
import React from 'react';
import { Button, Form } from 'semantic-ui-react';

import AutoResizeTextarea from './AutoResizeTextarea';
import { ChatMessageBubble } from './ChatMessageBubble';
import EmptyState from './EmptyState';
import { useBackendChat } from './useBackendChat';

function ChatWindow({ persona, rehypePrism, remarkGfm }) {
  const libs = { rehypePrism, remarkGfm }; // rehypePrism, remarkGfm
  const { onSubmit, messages, isStreaming } = useBackendChat({
    persona,
  });
  const [input, setInput] = React.useState('');

  const textareaRef = React.useRef(null);
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  //eslint-disable-next-line
  console.log(messages);

  return (
    <div>
      <div className="flex flex-col-reverse w-full mb-2 overflow-auto">
        {messages.length > 0 ? (
          messages.map((m, index) => (
            <ChatMessageBubble
              key={m.messageId}
              message={m}
              isMostRecent={index === 0}
              isLoading={isStreaming}
              libs={libs}
            />
          ))
        ) : (
          <EmptyState
            onChoice={(message) => onSubmit({ message })}
            persona={persona}
          />
        )}
        <Form>
          <AutoResizeTextarea
            ref={textareaRef}
            value={input}
            placeholder={
              messages.length > 0 ? 'Ask follow-up...' : 'Placeholder text'
            }
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit({ message: input });
              } else if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                setInput(input + '\n');
              }
            }}
            trigger={
              <Button
                variant="ghost"
                disabled={isStreaming}
                type="submit"
                aria-label="Send"
                onKeyDown={(e) => {
                  e.preventDefault();
                  onSubmit({ message: input });
                }}
                onClick={(e) => {
                  e.preventDefault();
                  onSubmit({ message: input });
                }}
              >
                Send
              </Button>
            }
          />
        </Form>
      </div>
    </div>
  );
}

export default injectLazyLibs(['rehypePrism', 'remarkGfm'])(ChatWindow);
