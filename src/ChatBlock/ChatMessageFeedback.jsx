import React, { useState } from 'react';
import { Button, Icon } from 'semantic-ui-react';
import FeedbackModal from './FeedbackModal';

const Toast = ({ message, type, isActive }) => (
  <div className={`feedback-toast ${type} ${isActive ? 'active' : ''}`}>
    <Icon name={type === 'success' ? 'check circle' : 'warning circle'} />
    {message}
  </div>
);

const ChatMessageFeedback = (props) => {
  const { message, feedbackReasons } = props;
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [isPositive, setIsPositive] = useState(null);
  const [isToastActive, setIsToastActive] = useState(false);

  const handleFeedback = (boolean) => {
    setIsPositive(boolean);
    setModalOpen(true);
  };

  const handleToast = (message, type) => {
    setToast({
      message: message,
      type: type,
    });
  };

  return (
    <>
      <Button
        basic
        onClick={() => handleFeedback(true)}
        title="Like"
        aria-label="Like"
      >
        <Icon name="thumbs up outline" />
      </Button>
      <Button
        basic
        onClick={() => handleFeedback(false)}
        title="Dislike"
        aria-label="Dislike"
      >
        <Icon name="thumbs down outline" />
      </Button>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isActive={isToastActive}
        />
      )}

      <FeedbackModal
        modalOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        setToast={setToast}
        onToast={handleToast}
        isPositive={isPositive}
        message={message}
        setIsToastActive={setIsToastActive}
        feedbackReasons={feedbackReasons}
      />
    </>
  );
};

export default ChatMessageFeedback;
