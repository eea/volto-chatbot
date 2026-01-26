import { renderHook } from '@testing-library/react-hooks';
import '@testing-library/jest-dom/extend-expect';
import { useDeepCompareMemoize } from '../hooks/useDeepCompareMemoize';

describe('useDeepCompareMemoize', () => {
  it('returns the same reference for equal objects', () => {
    const deps1 = { a: 1, b: 2 };
    const deps2 = { a: 1, b: 2 };

    const { result, rerender } = renderHook(
      ({ deps }) => useDeepCompareMemoize(deps),
      { initialProps: { deps: deps1 } },
    );

    const firstResult = result.current;

    rerender({ deps: deps2 });

    expect(result.current).toBe(firstResult);
  });

  it('returns new reference for different objects', () => {
    const deps1 = { a: 1, b: 2 };
    const deps2 = { a: 1, b: 3 };

    const { result, rerender } = renderHook(
      ({ deps }) => useDeepCompareMemoize(deps),
      { initialProps: { deps: deps1 } },
    );

    const firstResult = result.current;

    rerender({ deps: deps2 });

    expect(result.current).not.toBe(firstResult);
    expect(result.current).toEqual(deps2);
  });

  it('handles arrays correctly', () => {
    const deps1 = [1, 2, 3];
    const deps2 = [1, 2, 3];
    const deps3 = [1, 2, 4];

    const { result, rerender } = renderHook(
      ({ deps }) => useDeepCompareMemoize(deps),
      { initialProps: { deps: deps1 } },
    );

    const firstResult = result.current;

    rerender({ deps: deps2 });
    expect(result.current).toBe(firstResult);

    rerender({ deps: deps3 });
    expect(result.current).not.toBe(firstResult);
    expect(result.current).toEqual(deps3);
  });

  it('handles nested objects', () => {
    const deps1 = { a: { b: { c: 1 } } };
    const deps2 = { a: { b: { c: 1 } } };
    const deps3 = { a: { b: { c: 2 } } };

    const { result, rerender } = renderHook(
      ({ deps }) => useDeepCompareMemoize(deps),
      { initialProps: { deps: deps1 } },
    );

    const firstResult = result.current;

    rerender({ deps: deps2 });
    expect(result.current).toBe(firstResult);

    rerender({ deps: deps3 });
    expect(result.current).not.toBe(firstResult);
  });

  it('handles primitive values', () => {
    const { result, rerender } = renderHook(
      ({ deps }) => useDeepCompareMemoize(deps),
      { initialProps: { deps: 'test' } },
    );

    const firstResult = result.current;

    rerender({ deps: 'test' });
    expect(result.current).toBe(firstResult);

    rerender({ deps: 'different' });
    expect(result.current).not.toBe(firstResult);
  });

  it('handles null and undefined', () => {
    const { result, rerender } = renderHook(
      ({ deps }) => useDeepCompareMemoize(deps),
      { initialProps: { deps: null } },
    );

    const firstResult = result.current;

    rerender({ deps: null });
    expect(result.current).toBe(firstResult);

    rerender({ deps: undefined });
    expect(result.current).not.toBe(firstResult);
  });
});
