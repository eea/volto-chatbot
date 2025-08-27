import React from 'react';
import { Button } from 'semantic-ui-react';
import { trackEvent } from '@eeacms/volto-matomo/utils';
import TextareaAutosize from 'react-textarea-autosize';

import { SVGIcon } from './utils';
import SendIcon from './../icons/send.svg';

export default React.forwardRef(function AutoResizeTextarea(props, ref) {
  const [input, setInput] = React.useState('');
  const {
    onSubmit,
    onFocus,
    onChange = () => {},
    disableSubmit,
    enableMatomoTracking,
    persona,
    ...rest
  } = props;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disableSubmit) {
      return
    }
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
        aria-describedby="chat-wake-error-message"
        value={input}
        onFocus={onFocus}
        onChange={(e) => {
          onChange(e);
          setInput(e.target.value);
        }}
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

      <Button
        className="submit-btn"
        disabled={disableSubmit}
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
    </>
  );
});
