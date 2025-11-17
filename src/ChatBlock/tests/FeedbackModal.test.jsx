import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import FeedbackModal from '../components/FeedbackModal';
import * as lib from '../old/lib';

jest.mock('./lib');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('FeedbackModal', () => {
  const baseProps = {
    modalOpen: true,
    onClose: jest.fn(),
    setToast: jest.fn(),
    onToast: jest.fn(),
    setIsToastActive: jest.fn(),
    message: { messageId: '1234' },
    feedbackReasons: ['Reason 1', 'Reason 2'],
  };

  it('submits positive feedback successfully', async () => {
    lib.createChatMessageFeedback.mockResolvedValue({});

    render(<FeedbackModal {...baseProps} isPositive={true} />);

    fireEvent.change(
      screen.getByPlaceholderText(/What did you like about this response/i),
      { target: { value: 'Great response!' } },
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Submit Feedback'));
    });

    expect(lib.createChatMessageFeedback).toHaveBeenCalledWith({
      chat_message_id: '1234',
      feedback_text: 'Great response!',
      is_positive: true,
      predefined_feedback: '',
    });
    expect(baseProps.onToast).toHaveBeenCalledWith(
      'Thanks for your feedback!',
      'success',
    );
    expect(baseProps.setIsToastActive).toHaveBeenCalledWith(true);
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it('submits negative feedback with selected reason', async () => {
    lib.createChatMessageFeedback.mockResolvedValue({});

    render(<FeedbackModal {...baseProps} isPositive={false} />);

    const reasonBtn = screen.getByRole('button', { name: 'Reason 1' });
    fireEvent.click(reasonBtn);
    expect(reasonBtn.classList.contains('primary')).toBe(true);

    fireEvent.change(screen.getByPlaceholderText(/What could be improved/i), {
      target: { value: 'Needs more details' },
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Submit Feedback'));
    });

    expect(lib.createChatMessageFeedback).toHaveBeenCalledWith({
      chat_message_id: '1234',
      feedback_text: 'Needs more details',
      is_positive: false,
      predefined_feedback: 'Reason 1',
    });
    expect(baseProps.onToast).toHaveBeenCalledWith(
      'Thanks for your feedback!',
      'success',
    );
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it('handles submission failure', async () => {
    lib.createChatMessageFeedback.mockRejectedValue(new Error('fail'));

    render(<FeedbackModal {...baseProps} isPositive={true} />);

    await act(async () => {
      fireEvent.click(screen.getByText('Submit Feedback'));
    });

    expect(baseProps.onToast).toHaveBeenCalledWith(
      'Failed to submit feedback.',
      'error',
    );
    expect(baseProps.setIsToastActive).toHaveBeenCalledWith(true);
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it('resets and closes modal on Cancel click', () => {
    render(<FeedbackModal {...baseProps} isPositive={true} />);

    const textarea = screen.getByPlaceholderText(
      /What did you like about this response/i,
    );
    fireEvent.change(textarea, { target: { value: 'Some feedback' } });
    expect(textarea.value).toBe('Some feedback');

    fireEvent.click(screen.getByText('Cancel'));
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it('toggles reason button selected state on click', () => {
    render(<FeedbackModal {...baseProps} isPositive={false} />);

    const reason1 = screen.getByRole('button', { name: 'Reason 1' });
    const reason2 = screen.getByRole('button', { name: 'Reason 2' });

    expect(reason1.classList.contains('inverted')).toBe(true);
    expect(reason2.classList.contains('inverted')).toBe(true);

    fireEvent.click(reason1);
    expect(reason1.classList.contains('inverted')).toBe(false);
    expect(reason2.classList.contains('inverted')).toBe(true);

    fireEvent.click(reason2);
    expect(reason1.classList.contains('inverted')).toBe(true);
    expect(reason2.classList.contains('inverted')).toBe(false);
  });

  it('updates textarea value on user input', () => {
    render(<FeedbackModal {...baseProps} isPositive={true} />);

    const textarea = screen.getByPlaceholderText(
      /What did you like about this response/i,
    );
    fireEvent.change(textarea, { target: { value: 'Awesome!' } });
    expect(textarea.value).toBe('Awesome!');
  });
});
