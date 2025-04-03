import React from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Button, Checkbox } from 'semantic-ui-react';

import { SVGIcon } from './utils';
import SendIcon from './../icons/send.svg';

export default React.forwardRef(function AutoResizeTextarea(props, ref) {
  const { onSubmit, isStreaming, deepResearch, ...rest } = props;
  const showDeepResearchToggle =
    deepResearch === 'user_on' || deepResearch === 'user_off';
  const [input, setInput] = React.useState('');
  const [isDeepResearchEnabled, setIsDeepResearchEnabled] =
    React.useState(false);

  React.useEffect(() => {
    if (deepResearch === 'user_on') {
      setIsDeepResearchEnabled(true);
    } else if (deepResearch === 'user_off') {
      setIsDeepResearchEnabled(false);
    }
  }, [deepResearch]);

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

      <div className="chat-right-actions">
        {showDeepResearchToggle && (
          <div className="deep-research-toggle">
            <Checkbox
              toggle
              checked={isDeepResearchEnabled}
              onChange={(e, { checked }) => setIsDeepResearchEnabled(checked)}
            />
            Deep research
          </div>
        )}

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
      </div>
    </>
  );
});
