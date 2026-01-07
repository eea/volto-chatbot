import cx from 'classnames';
import { Button } from 'semantic-ui-react';
import { useCopyToClipboard } from '../utils';
import SVGIcon from './Icon';
import ChatMessageFeedback from './ChatMessageFeedback';

import CopyIcon from '../../icons/copy.svg';
import CheckIcon from '../../icons/check.svg';

const UserActionsToolbar = ({
  className,
  message,
  enableFeedback,
  feedbackReasons,
  enableMatomoTracking,
  persona,
}) => {
  const [copied, handleCopy] = useCopyToClipboard(message?.message || '');

  return (
    <div className={cx('message-actions', className)}>
      <Button
        basic
        onClick={() => handleCopy()}
        title="Copy"
        aria-label="Copy"
        disabled={copied}
      >
        {copied ? <SVGIcon name={CheckIcon} /> : <SVGIcon name={CopyIcon} />}
      </Button>

      {enableFeedback && (
        <ChatMessageFeedback
          message={message}
          feedbackReasons={feedbackReasons}
          enableMatomoTracking={enableMatomoTracking}
          persona={persona}
        />
      )}
    </div>
  );
};

export default UserActionsToolbar;
