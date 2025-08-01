import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import FeedbackModal from './FeedbackModal';
import * as lib from './lib';

jest.mock('./lib');

jest.mock('@eeacms/volto-matomo/utils', () => ({
  trackEvent: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test('submits positive feedback successfully', async () => {
  const onClose = jest.fn();
  const fakeSubmit = lib.createChatMessageFeedback.mockResolvedValue({});

  render(
    <FeedbackModal
      modalOpen={true}
      onClose={onClose}
      setToast={() => {}}
      onToast={() => {}}
      isPositive={true}
      message={{ messageId: '1234' }}
      setIsToastActive={() => {}}
    />,
  );

  fireEvent.change(
    screen.getByPlaceholderText(/What did you like about this response/i),
    { target: { value: 'Great response!' } },
  );

  await act(async () => {
    fireEvent.click(screen.getByText('Submit Feedback'));
  });

  expect(fakeSubmit).toHaveBeenCalledWith({
    chat_message_id: '1234',
    is_positive: true,
    feedback_text: 'Great response!',
    predefined_feedback: '',
  });
  expect(onClose).toHaveBeenCalled();
});
