import { injectLazyLibs } from '@plone/volto/helpers/Loadable';
import React from 'react';
import { Button, Form } from 'semantic-ui-react';

import AutoResizeTextarea from './AutoResizeTextarea';
import { ChatMessageBubble } from './ChatMessageBubble';
import EmptyState from './EmptyState';
import { useBackendChat } from './useBackendChat';

function ChatWindow({ persona, marked, highlightJs }) {
  const libs = { marked, highlightJs }; // rehypePrism, remarkGfm
  const { onSubmit, messages, isLoading } = useBackendChat({
    persona,
  });
  const [input, setInput] = React.useState('');

  const textareaRef = React.useRef(null);
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  console.log(messages);

  return (
    <div>
      <div className="flex flex-col-reverse w-full mb-2 overflow-auto">
        {messages.length > 0 ? (
          messages.map((m, index) => (
            <ChatMessageBubble
              sources={[]}
              key={m.messageId}
              message={m}
              isMostRecent={index === 0}
              isLoading={isLoading}
              libs={libs}
            />
          ))
        ) : (
          <EmptyState onChoice={onSubmit} persona={persona} />
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
                disabled={isLoading}
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

export default injectLazyLibs([
  // 'rehypePrism', 'remarkGfm'
  'marked',
  'highlightJs',
])(ChatWindow);
