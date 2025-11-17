import React from 'react';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useCopyToClipboard, SVGIcon } from './utils';

describe('SVGIcon', () => {
  it('should render an SVG with the given props', () => {
    const name = {
      attributes: {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 24 24',
        fill: 'red',
      },
      content: '<path d="M12 2L2 12h10L12 2z"/>',
    };

    const { container } = render(
      <SVGIcon name={name} size="50" color="blue" title="Test Icon" />,
    );

    const svg = container.querySelector('svg');

    // Ensure the SVG element exists
    expect(svg).not.toBeNull();

    expect(svg).toHaveAttribute('width', '50');
    expect(svg).toHaveAttribute('height', '50');
    expect(svg).toHaveAttribute('fill', 'red');
    expect(svg).toHaveAttribute('stroke', 'blue');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');

    expect(svg).toContainHTML('<title>Test Icon</title>');

    expect(svg).toContainHTML('<path d="M12 2L2 12h10L12 2z"/>');
  });
});

describe('useCopyToClipboard', () => {
  beforeEach(() => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(true),
      },
    });
  });

  it('should copy text and set copied state to true', async () => {
    const { result } = renderHook(() => useCopyToClipboard('Hello World'));

    await act(async () => {
      result.current[1]();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Hello World');

    expect(result.current[0]).toBe(true);
  });
});
