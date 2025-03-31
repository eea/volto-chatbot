import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import FeedbackModal from './FeedbackModal';

test('renders the FeedbackModal with positive feedback prompt', () => {
  const onClose = jest.fn();
  const onSubmit = jest.fn();
  const modalOpen = true;
  const feedbackType = 'up';

  render(
    <FeedbackModal
      modalOpen={modalOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      feedbackType={feedbackType}
    />,
  );

  expect(screen.getByText(/Share your positive feedback/i)).toBeInTheDocument();
  expect(
    screen.getByPlaceholderText(/What did you like about this response/i),
  ).toBeInTheDocument();

  fireEvent.change(
    screen.getByPlaceholderText(/What did you like about this response/i),
    {
      target: { value: 'Great response!' },
    },
  );
  fireEvent.click(screen.getByText('Submit Feedback'));

  expect(onSubmit).toHaveBeenCalledWith({
    feedback: 'Great response!',
    selectedReason: '',
  });
});

test('renders the FeedbackModal with negative feedback prompt and allows reason selection', () => {
  const onClose = jest.fn();
  const onSubmit = jest.fn();
  const modalOpen = true;
  const feedbackType = 'down';

  render(
    <FeedbackModal
      modalOpen={modalOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      feedbackType={feedbackType}
    />,
  );

  expect(screen.getByText(/Tell us how we can improve/i)).toBeInTheDocument();
  expect(
    screen.getByPlaceholderText(/What could be improved/i),
  ).toBeInTheDocument();

  const reasonButton = screen.getByText(
    /Retrieved documents were not relevant/i,
  );
  fireEvent.click(reasonButton);
  expect(reasonButton).toHaveClass('primary');

  fireEvent.change(screen.getByPlaceholderText(/What could be improved/i), {
    target: { value: 'Provide more detailed responses.' },
  });
  fireEvent.click(screen.getByText('Submit Feedback'));

  expect(onSubmit).toHaveBeenCalledWith({
    feedback: 'Provide more detailed responses.',
    selectedReason: 'Retrieved documents were not relevant',
  });
});

test('should call onClose when the cancel button is clicked', () => {
  const onClose = jest.fn();
  const onSubmit = jest.fn();
  const modalOpen = true;
  const feedbackType = 'up';

  render(
    <FeedbackModal
      modalOpen={modalOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      feedbackType={feedbackType}
    />,
  );

  fireEvent.click(screen.getByText('Cancel'));
  expect(onClose).toHaveBeenCalled();
});
