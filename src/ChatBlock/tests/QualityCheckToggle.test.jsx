import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import QualityCheckToggle from '../components/QualityCheckToggle';

describe('QualityCheckToggle', () => {
  const mockSetEnabled = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { container } = render(
      <QualityCheckToggle
        isEditMode={false}
        enabled={true}
        setEnabled={mockSetEnabled}
      />,
    );

    expect(container.querySelector('.quality-check-toggle')).toBeInTheDocument();
  });

  it('renders checkbox with correct label', () => {
    const { getByText } = render(
      <QualityCheckToggle
        isEditMode={false}
        enabled={true}
        setEnabled={mockSetEnabled}
      />,
    );

    expect(getByText('Fact-check AI answer')).toBeInTheDocument();
  });

  it('checkbox is checked when enabled is true', () => {
    const { container } = render(
      <QualityCheckToggle
        isEditMode={false}
        enabled={true}
        setEnabled={mockSetEnabled}
      />,
    );

    const checkbox = container.querySelector('input[type="checkbox"]');
    expect(checkbox.checked).toBe(true);
  });

  it('checkbox is unchecked when enabled is false', () => {
    const { container } = render(
      <QualityCheckToggle
        isEditMode={false}
        enabled={false}
        setEnabled={mockSetEnabled}
      />,
    );

    const checkbox = container.querySelector('input[type="checkbox"]');
    expect(checkbox.checked).toBe(false);
  });

  it('checkbox is disabled in edit mode', () => {
    const { container } = render(
      <QualityCheckToggle
        isEditMode={true}
        enabled={true}
        setEnabled={mockSetEnabled}
      />,
    );

    const checkbox = container.querySelector('input[type="checkbox"]');
    expect(checkbox.disabled).toBe(true);
  });

  it('checkbox is enabled when not in edit mode', () => {
    const { container } = render(
      <QualityCheckToggle
        isEditMode={false}
        enabled={true}
        setEnabled={mockSetEnabled}
      />,
    );

    const checkbox = container.querySelector('input[type="checkbox"]');
    expect(checkbox.disabled).toBe(false);
  });

  it('calls setEnabled when checkbox is changed', () => {
    const { container } = render(
      <QualityCheckToggle
        isEditMode={false}
        enabled={true}
        setEnabled={mockSetEnabled}
      />,
    );

    const checkbox = container.querySelector('input[type="checkbox"]');
    fireEvent.click(checkbox);

    expect(mockSetEnabled).toHaveBeenCalled();
  });
});
