import React from 'react';
import { Button, Checkbox } from 'semantic-ui-react';
import { trackEvent } from '@eeacms/volto-matomo/utils';
import TextareaAutosize from 'react-textarea-autosize';

import SVGIcon from './Icon';
import SendIcon from '../../icons/send.svg';

export default React.forwardRef(function AutoResizeTextarea(props, ref) {
  const { onSubmit, isStreaming, enableMatomoTracking, persona, ...rest } =
    props;
  const [input, setInput] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (trimmedInput) {
      if (enableMatomoTracking) {
        trackEvent({
          category: persona?.name ? `Chatbot - ${persona.name}` : 'Chatbot',
          action: 'Chatbot: Type a question',
          name: 'Message submitted',
        });
      }
      onSubmit({ message: input });
      setInput('');
    }
  };

  return (
    <>
      <TextareaAutosize
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            handleSubmit(e);
          } else if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            setInput(input + '\n');
          }
        }}
        {...rest}
        ref={ref}
      />

      <div className="chat-right-actions">
        <Button
          className="submit-btn"
          type="submit"
          aria-label="Send"
          onKeyDown={(e) => {
            handleSubmit(e);
          }}
          disabled={isStreaming}
          onClick={(e) => {
            handleSubmit(e);
          }}
        >
          <div className="btn-icon">
            <SVGIcon name={SendIcon} size="28" />
          </div>
        </Button>
      </div>
    </>
  );
});
