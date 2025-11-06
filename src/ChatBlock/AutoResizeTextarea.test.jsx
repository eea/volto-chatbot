import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AutoResizeTextarea from './AutoResizeTextarea';

jest.mock('@eeacms/volto-matomo/utils', () => ({
  trackEvent: jest.fn(),
}));

describe('AutoResizeTextarea', () => {
  it('renders textarea and button', () => {
    const { getByRole, getByLabelText } = render(
      <AutoResizeTextarea onSubmit={jest.fn()} />,
    );

    expect(getByRole('textbox')).toBeInTheDocument();
    expect(getByLabelText('Send')).toBeInTheDocument();
  });

  it('calls onSubmit with input text on Enter key press', () => {
    const mockSubmit = jest.fn();
    const { getByRole } = render(<AutoResizeTextarea onSubmit={mockSubmit} />);
    const textarea = getByRole('textbox');

    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

    expect(mockSubmit).toHaveBeenCalledWith({ message: 'Hello' });
  });

  it('does not call onSubmit if input is empty', () => {
    const mockSubmit = jest.fn();
    const { getByRole } = render(<AutoResizeTextarea onSubmit={mockSubmit} />);
    const textarea = getByRole('textbox');

    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('adds newline on Shift+Enter', () => {
    const { getByRole } = render(<AutoResizeTextarea onSubmit={jest.fn()} />);
    const textarea = getByRole('textbox');

    fireEvent.change(textarea, { target: { value: 'Line 1' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    expect(textarea.value).toBe('Line 1\n');
  });
});
