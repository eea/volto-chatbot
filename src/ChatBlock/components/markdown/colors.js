export function getSupportedTextColor(score) {
  if (0 <= score && score < 0.5) {
    return 'text-red-500';
  } else if (0.5 <= score && score <= 1) {
    return 'text-green-500';
  }
  return 'text-gray-500';
}

export function getSupportedBgColor(score, prefix = 'bg') {
  if (0 <= score && score < 0.125) {
    return `${prefix}-red-500`;
  } else if (0.125 <= score && score < 0.25) {
    return `${prefix}-red-400`;
  } else if (0.25 <= score && score < 0.375) {
    return `${prefix}-red-300`;
  } else if (0.375 <= score && score < 0.5) {
    return `${prefix}-red-200`;
  } else if (0.5 <= score && score < 0.625) {
    return `${prefix}-green-200`;
  } else if (0.625 <= score && score < 0.75) {
    return `${prefix}-green-300`;
  } else if (0.75 <= score && score < 0.875) {
    return `${prefix}-green-400`;
  } else if (0.875 <= score && score <= 1) {
    return `${prefix}-green-500`;
  }
  return `${prefix}-gray-500`;
}
