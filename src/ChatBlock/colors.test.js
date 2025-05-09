import { getSupportedTextColor, getSupportedBgColor } from './colors';

describe('getSupportedTextColor', () => {
  it('should return "text-red-500" for scores between 0 and 0.5', () => {
    expect(getSupportedTextColor(0)).toBe('text-red-500');
    expect(getSupportedTextColor(0.4)).toBe('text-red-500');
    expect(getSupportedTextColor(0.499)).toBe('text-red-500');
  });

  it('should return "text-green-500" for scores between 0.5 and 1', () => {
    expect(getSupportedTextColor(0.5)).toBe('text-green-500');
    expect(getSupportedTextColor(0.75)).toBe('text-green-500');
    expect(getSupportedTextColor(1)).toBe('text-green-500');
  });

  it('should return "text-gray-500" for invalid scores', () => {
    expect(getSupportedTextColor(-1)).toBe('text-gray-500');
    expect(getSupportedTextColor(1.5)).toBe('text-gray-500');
  });
});

describe('getSupportedBgColor', () => {
  it('should return correct background colors based on score', () => {
    // Test for scores in the range [0, 0.125)
    expect(getSupportedBgColor(0)).toBe('bg-red-500');
    expect(getSupportedBgColor(0.1)).toBe('bg-red-500');
    expect(getSupportedBgColor(0.124)).toBe('bg-red-500');

    // Test for scores in the range [0.125, 0.25)
    expect(getSupportedBgColor(0.125)).toBe('bg-red-400');
    expect(getSupportedBgColor(0.2)).toBe('bg-red-400');
    expect(getSupportedBgColor(0.249)).toBe('bg-red-400');

    // Test for scores in the range [0.25, 0.375)
    expect(getSupportedBgColor(0.25)).toBe('bg-red-300');
    expect(getSupportedBgColor(0.3)).toBe('bg-red-300');
    expect(getSupportedBgColor(0.374)).toBe('bg-red-300');

    // Test for scores in the range [0.375, 0.5)
    expect(getSupportedBgColor(0.375)).toBe('bg-red-200');
    expect(getSupportedBgColor(0.45)).toBe('bg-red-200');
    expect(getSupportedBgColor(0.499)).toBe('bg-red-200');

    // Test for scores in the range [0.5, 0.625)
    expect(getSupportedBgColor(0.5)).toBe('bg-green-200');
    expect(getSupportedBgColor(0.55)).toBe('bg-green-200');
    expect(getSupportedBgColor(0.624)).toBe('bg-green-200');

    // Test for scores in the range [0.625, 0.75)
    expect(getSupportedBgColor(0.625)).toBe('bg-green-300');
    expect(getSupportedBgColor(0.7)).toBe('bg-green-300');
    expect(getSupportedBgColor(0.749)).toBe('bg-green-300');

    // Test for scores in the range [0.75, 0.875)
    expect(getSupportedBgColor(0.75)).toBe('bg-green-400');
    expect(getSupportedBgColor(0.8)).toBe('bg-green-400');
    expect(getSupportedBgColor(0.874)).toBe('bg-green-400');

    // Test for scores in the range [0.875, 1]
    expect(getSupportedBgColor(0.875)).toBe('bg-green-500');
    expect(getSupportedBgColor(0.9)).toBe('bg-green-500');
    expect(getSupportedBgColor(1)).toBe('bg-green-500');
  });

  it('should return "bg-gray-500" for invalid scores', () => {
    expect(getSupportedBgColor(-1)).toBe('bg-gray-500');
    expect(getSupportedBgColor(1.1)).toBe('bg-gray-500');
  });
});
