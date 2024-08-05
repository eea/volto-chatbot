import React from 'react';
import { Button, Form } from 'semantic-ui-react';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable';

import { useBackendChat } from './useBackendChat';
// import EmptyState from './EmptyState';
// import { ChatMessageBubble } from './ChatMessageBubble';
import AutoResizeTextarea from './AutoResizeTextarea';

function ChatWindow({ persona }) {
  const { onSubmit, messages, isLoading } = useBackendChat({
    persona,
  });
  // input, setInput,
  const textareaRef = React.useRef(null);

  React.useEffect(() => {
    if (textareaRef.current) textareaRef.current.focus();
  }, []);

  console.log(messages);

  // {messages.length > 0 ? (
  //   [...messages]
  //     .reverse()
  //     .map((m, index) => (
  //       <ChatMessageBubble
  //         sources={[]}
  //         key={m.id}
  //         message={m}
  //         aiEmoji="🦜"
  //         isMostRecent={index === 0}
  //         isLoading={isLoading}
  //       />
  //     ))
  // ) : (
  //   <EmptyState onChoice={sendMessage} persona={persona} />
  // )}
  //
  // <AutoResizeTextarea
  //   ref={textareaRef}
  //   value={input}
  //   maxRows={20}
  //   placeholder={
  //     messages.length > 0 ? 'Ask follow-up...' : 'Placeholder text'
  //   }
  //   onChange={(e) => setInput(e.target.value)}
  //   onKeyDown={(e) => {
  //     if (e.key === 'Enter' && !e.shiftKey) {
  //       e.preventDefault();
  //       sendMessage();
  //     } else if (e.key === 'Enter' && e.shiftKey) {
  //       e.preventDefault();
  //       setInput(input + '\n');
  //     }
  //   }}
  //   trigger={
  //     <Button
  //       variant="ghost"
  //       size="sm"
  //       disabled={isLoading}
  //       type="submit"
  //       aria-label="Send"
  //       onKeyDown={(e) => {
  //         e.preventDefault();
  //         sendMessage();
  //       }}
  //       onClick={(e) => {
  //         e.preventDefault();
  //         sendMessage();
  //       }}
  //     >
  //       Send
  //     </Button>
  //   }
  // />

  return (
    <div>
      <div className="flex flex-col-reverse w-full mb-2 overflow-auto">
        <Form></Form>
      </div>
    </div>
  );
}

export default injectLazyLibs([
  'highlightJs',
  'marked',
  'fastJsonPatch',
  'fetchEventSource',
])(ChatWindow);
