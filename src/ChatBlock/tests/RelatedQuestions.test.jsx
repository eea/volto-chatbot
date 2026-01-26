import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import RelatedQuestions from '../components/RelatedQuestions';

// Mock @eeacms/volto-matomo/utils
jest.mock('@eeacms/volto-matomo/utils', () => ({
  trackEvent: jest.fn(),
}));

import { trackEvent } from '@eeacms/volto-matomo/utils';

describe('RelatedQuestions', () => {
  const mockOnChoice = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when no related questions', () => {
    const { container } = render(
      <RelatedQuestions
        message={{ relatedQuestions: [] }}
        onChoice={mockOnChoice}
        isLoading={false}
      />,
    );
    expect(container.querySelector('.chat-related-questions')).toBeNull();
  });

  it('renders nothing when relatedQuestions is undefined', () => {
    const { container } = render(
      <RelatedQuestions
        message={{}}
        onChoice={mockOnChoice}
        isLoading={false}
      />,
    );
    expect(container.querySelector('.chat-related-questions')).toBeNull();
  });

  it('renders related questions when available', () => {
    const message = {
      relatedQuestions: [
        { question: 'Question 1' },
        { question: 'Question 2' },
      ],
    };

    const { getByText } = render(
      <RelatedQuestions
        message={message}
        onChoice={mockOnChoice}
        isLoading={false}
      />,
    );

    expect(getByText('Related questions:')).toBeInTheDocument();
    expect(getByText('Question 1')).toBeInTheDocument();
    expect(getByText('Question 2')).toBeInTheDocument();
  });

  it('calls onChoice when question is clicked', () => {
    const message = {
      relatedQuestions: [{ question: 'Test Question' }],
    };

    const { getByText } = render(
      <RelatedQuestions
        message={message}
        onChoice={mockOnChoice}
        isLoading={false}
      />,
    );

    fireEvent.click(getByText('Test Question'));
    expect(mockOnChoice).toHaveBeenCalledWith('Test Question');
  });

  it('does not call onChoice when loading', () => {
    const message = {
      relatedQuestions: [{ question: 'Test Question' }],
    };

    const { getByText } = render(
      <RelatedQuestions
        message={message}
        onChoice={mockOnChoice}
        isLoading={true}
      />,
    );

    fireEvent.click(getByText('Test Question'));
    expect(mockOnChoice).not.toHaveBeenCalled();
  });

  it('tracks event when enableMatomoTracking is true', () => {
    const message = {
      relatedQuestions: [{ question: 'Tracked Question' }],
    };
    const persona = { name: 'Test Persona' };

    const { getByText } = render(
      <RelatedQuestions
        message={message}
        onChoice={mockOnChoice}
        isLoading={false}
        enableMatomoTracking={true}
        persona={persona}
      />,
    );

    fireEvent.click(getByText('Tracked Question'));

    expect(trackEvent).toHaveBeenCalledWith({
      category: 'Chatbot - Test Persona',
      action: 'Chatbot: Related question click',
      name: 'Message submitted',
    });
  });

  it('tracks event with default category when no persona name', () => {
    const message = {
      relatedQuestions: [{ question: 'Tracked Question' }],
    };

    const { getByText } = render(
      <RelatedQuestions
        message={message}
        onChoice={mockOnChoice}
        isLoading={false}
        enableMatomoTracking={true}
        persona={{}}
      />,
    );

    fireEvent.click(getByText('Tracked Question'));

    expect(trackEvent).toHaveBeenCalledWith({
      category: 'Chatbot',
      action: 'Chatbot: Related question click',
      name: 'Message submitted',
    });
  });

  it('does not track event when enableMatomoTracking is false', () => {
    const message = {
      relatedQuestions: [{ question: 'Untracked Question' }],
    };

    const { getByText } = render(
      <RelatedQuestions
        message={message}
        onChoice={mockOnChoice}
        isLoading={false}
        enableMatomoTracking={false}
      />,
    );

    fireEvent.click(getByText('Untracked Question'));

    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('handles keyboard Enter key', () => {
    const message = {
      relatedQuestions: [{ question: 'Keyboard Question' }],
    };

    const { getByText } = render(
      <RelatedQuestions
        message={message}
        onChoice={mockOnChoice}
        isLoading={false}
      />,
    );

    fireEvent.keyDown(getByText('Keyboard Question'), { key: 'Enter' });
    expect(mockOnChoice).toHaveBeenCalledWith('Keyboard Question');
  });

  it('handles keyboard Space key', () => {
    const message = {
      relatedQuestions: [{ question: 'Space Question' }],
    };

    const { getByText } = render(
      <RelatedQuestions
        message={message}
        onChoice={mockOnChoice}
        isLoading={false}
      />,
    );

    fireEvent.keyDown(getByText('Space Question'), { key: ' ' });
    expect(mockOnChoice).toHaveBeenCalledWith('Space Question');
  });

  it('ignores other keyboard keys', () => {
    const message = {
      relatedQuestions: [{ question: 'Other Key Question' }],
    };

    const { getByText } = render(
      <RelatedQuestions
        message={message}
        onChoice={mockOnChoice}
        isLoading={false}
      />,
    );

    fireEvent.keyDown(getByText('Other Key Question'), { key: 'Tab' });
    expect(mockOnChoice).not.toHaveBeenCalled();
  });
});
