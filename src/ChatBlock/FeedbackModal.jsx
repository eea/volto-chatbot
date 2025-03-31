import React, { useState } from 'react';
import { Modal, Button, TextArea, Form, Icon } from 'semantic-ui-react';

const feedbackReasons = [
  'Retrieved documents were not relevant',
  'AI misread the documents',
  'Cited source had incorrect information',
];

const FeedbackModal = ({ modalOpen, onClose, onSubmit, feedbackType }) => {
  const [feedback, setFeedback] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const isPositiveFeedback = feedbackType === 'up';

  const handleSubmit = () => {
    onSubmit({ feedback, selectedReason });
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFeedback('');
    setSelectedReason('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
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
            {feedbackReasons.map((reason) => (
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
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </Form>
      </Modal.Content>

      <Modal.Actions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button primary onClick={handleSubmit}>
          Submit Feedback
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

export default FeedbackModal;
