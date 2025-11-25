import React, { useState } from 'react';
import { trackEvent } from '@eeacms/volto-matomo/utils';
import { Modal, Button, TextArea, Form, Icon } from 'semantic-ui-react';
import { createChatMessageFeedback } from '../utils';

const FeedbackModal = ({
  modalOpen,
  onClose,
  setToast,
  onToast,
  isPositive,
  message,
  setIsToastActive,
  feedbackReasons,
  enableMatomoTracking,
  persona,
}) => {
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const isPositiveFeedback = isPositive;

  const resetForm = () => {
    setFeedbackText('');
    setSelectedReason('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const submitFeedback = async () => {
    try {
      await createChatMessageFeedback({
        chat_message_id: message.messageId,
        feedback_text: feedbackText,
        is_positive: isPositive,
        predefined_feedback: selectedReason,
      });
      if (enableMatomoTracking) {
        trackEvent({
          category: persona?.name ? `Chatbot - ${persona.name}` : 'Chatbot',
          action: isPositive
            ? 'Chatbot: Positive feedback submitted'
            : 'Chatbot: Negative feedback submitted',
          name: 'Feedback submitted',
        });
      }
      setIsToastActive(true);
      onToast('Thanks for your feedback!', 'success');
    } catch (error) {
      setIsToastActive(true);
      onToast('Failed to submit feedback.', 'error');
    } finally {
      setTimeout(() => setIsToastActive(false), 5000);
      setTimeout(() => setToast(null), 3500);
      resetForm();
      onClose();
    }
  };

  return (
    <Modal
      open={modalOpen}
      onClose={handleClose}
      className="feedback-modal"
      size="small"
    >
      <Modal.Header>
        <h3>
          {isPositiveFeedback ? (
            <>
              <Icon name="thumbs up outline" />
              Share your positive feedback
            </>
          ) : (
            <>
              <Icon name="thumbs down outline" />
              Tell us how we can improve
            </>
          )}
        </h3>
      </Modal.Header>

      <Modal.Content>
        {!isPositiveFeedback && (
          <div className="reason-buttons">
            {feedbackReasons?.map((reason) => (
              <Button
                primary
                size="small"
                key={reason}
                onClick={() => setSelectedReason(reason)}
                inverted={selectedReason !== reason}
              >
                {reason}
              </Button>
            ))}
          </div>
        )}

        <Form>
          <TextArea
            placeholder={
              isPositiveFeedback
                ? 'What did you like about this response? (Optional)'
                : 'What could be improved? (Optional)'
            }
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
          />
        </Form>
      </Modal.Content>

      <Modal.Actions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button primary onClick={submitFeedback}>
          Submit Feedback
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

export default FeedbackModal;
