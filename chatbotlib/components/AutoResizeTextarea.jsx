import TextareaAutosize from 'react-textarea-autosize';
import { Button } from 'semantic-ui-react';

import React from 'react';

import { default as SVGIcon } from './SVGIcon';
import SendIcon from './../icons/send.svg';

export default React.forwardRef(function AutoResizeTextarea(props, ref) {
  const { onSubmit, isStreaming, ...rest } = props;
  const [input, setInput] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
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
    </>
  );
});
