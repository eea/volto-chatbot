import { renderHook, act } from '@testing-library/react-hooks';
import { useToolDisplayTiming } from '../hooks/useToolDisplayTiming';

describe('useToolDisplayTiming', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with first tool visible when not complete', () => {
    const toolGroups = [
      { ind: 1, packets: [] },
      { ind: 2, packets: [] },
    ];

    const { result } = renderHook(() =>
      useToolDisplayTiming(toolGroups, false, false),
    );

    expect(result.current.visibleTools).toEqual(new Set([1]));
    expect(result.current.allToolsDisplayed).toBe(false);
  });

  it('should initialize with all tools visible when complete', () => {
    const toolGroups = [
      { ind: 1, packets: [] },
      { ind: 2, packets: [] },
    ];

    const { result } = renderHook(() =>
      useToolDisplayTiming(toolGroups, false, true),
    );

    expect(result.current.visibleTools).toEqual(new Set([1, 2]));
    expect(result.current.allToolsDisplayed).toBe(false);
  });

  it('should show first tool immediately', () => {
    const toolGroups = [{ ind: 1, packets: [] }];

    const { result } = renderHook(() =>
      useToolDisplayTiming(toolGroups, false, false),
    );

    expect(result.current.visibleTools.has(1)).toBe(true);
  });

  it('should handle tool completion without errors', () => {
    const toolGroups = [
      { ind: 1, packets: [] },
      { ind: 2, packets: [] },
    ];

    const { result } = renderHook(() =>
      useToolDisplayTiming(toolGroups, false, false),
    );

    // First tool should be visible
    expect(result.current.visibleTools.has(1)).toBe(true);
    expect(result.current.visibleTools.has(2)).toBe(false);

    // Complete first tool - should not throw errors
    expect(() => {
      act(() => {
        result.current.handleToolComplete(1);
      });
    }).not.toThrow();
  });

  it('should handle tool completion with timeout', () => {
    const toolGroups = [{ ind: 1, packets: [] }];

    const { result } = renderHook(() =>
      useToolDisplayTiming(toolGroups, false, false),
    );

    // Complete tool - should schedule timeout if not enough time passed
    act(() => {
      result.current.handleToolComplete(1);
    });

    // Should not throw and tool should still be visible
    expect(result.current.visibleTools.has(1)).toBe(true);
  });

  it('should mark all tools as displayed when complete and final message coming', () => {
    const toolGroups = [{ ind: 1, packets: [] }];

    const { result } = renderHook(() =>
      useToolDisplayTiming(toolGroups, true, true),
    );

    expect(result.current.allToolsDisplayed).toBe(true);
  });

  it('should not mark all tools as displayed when final message not coming', () => {
    const toolGroups = [{ ind: 1, packets: [] }];

    const { result } = renderHook(() =>
      useToolDisplayTiming(toolGroups, false, true),
    );

    expect(result.current.allToolsDisplayed).toBe(false);
  });

  it('should handle empty tool groups', () => {
    const { result } = renderHook(() => useToolDisplayTiming([], false, false));

    expect(result.current.visibleTools).toEqual(new Set());
    expect(result.current.allToolsDisplayed).toBe(true);
  });

  it('should not complete tool twice', () => {
    const toolGroups = [{ ind: 1, packets: [] }];

    const { result } = renderHook(() =>
      useToolDisplayTiming(toolGroups, false, false),
    );

    act(() => {
      result.current.handleToolComplete(1);
      result.current.handleToolComplete(1);
    });

    // Should still work without errors
    expect(result.current.visibleTools.has(1)).toBe(true);
  });

  it('should clean up timeouts on unmount', () => {
    const toolGroups = [{ ind: 1, packets: [] }];

    const { result, unmount } = renderHook(() =>
      useToolDisplayTiming(toolGroups, false, false),
    );

    act(() => {
      result.current.handleToolComplete(1);
    });

    // Unmount should not throw errors
    expect(() => unmount()).not.toThrow();
  });
});
