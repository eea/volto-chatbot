import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatMessageFeedback from '../components/ChatMessageFeedback';

jest.mock('./FeedbackModal', () => (props) => {
  const { modalOpen, onClose, onToast } = props;

  return modalOpen ? (
    <div data-testid="feedback-modal">
      Modal Open
      <button
        onClick={() => {
          onToast('Thank you for your feedback!', 'success');
          onClose();
        }}
      >
        Submit Feedback
      </button>
    </div>
  ) : null;
});

jest.mock('./utils', () => ({
  SVGIcon: ({ name }) => <img src={name} alt="icon" />,
}));

jest.mock('./../icons/thumbs-up.svg', () => 'thumbs-up.svg');
jest.mock('./../icons/thumbs-down.svg', () => 'thumbs-down.svg');

describe('ChatMessageFeedback', () => {
  const defaultProps = {
    message: 'Test message',
    feedbackReasons: ['Reason 1', 'Reason 2'],
  };

  it('renders Like and Dislike buttons', () => {
    render(<ChatMessageFeedback {...defaultProps} />);
    expect(screen.getByLabelText('Like')).toBeInTheDocument();
    expect(screen.getByLabelText('Dislike')).toBeInTheDocument();
  });

  it('opens modal when Like is clicked', () => {
    render(<ChatMessageFeedback {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Like'));
    expect(screen.getByTestId('feedback-modal')).toBeInTheDocument();
  });

  it('opens modal when Dislike is clicked', () => {
    render(<ChatMessageFeedback {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Dislike'));
    expect(screen.getByTestId('feedback-modal')).toBeInTheDocument();
  });

  it('shows toast after submitting feedback in modal', () => {
    render(<ChatMessageFeedback {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Like'));

    const submitButton = screen.getByText('Submit Feedback');
    fireEvent.click(submitButton);

    expect(
      screen.getByText('Thank you for your feedback!'),
    ).toBeInTheDocument();
  });
});
