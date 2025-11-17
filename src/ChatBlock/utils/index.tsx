import type { ReactNode, MutableRefObject } from 'react';
import { useState, useCallback, useEffect } from 'react';

export const EMAIL_REGEX = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

// Convert text with email addresses to mailto links
export function transformEmailsToLinks(text: string): (string | ReactNode)[] {
  return text.split(EMAIL_REGEX).map((part, index) => {
    if (EMAIL_REGEX.test(part)) {
      return (
        <a key={index} href={`mailto:${part}`} className="text-email">
          {part}
        </a>
      );
    }
    return part;
  });
}

export function debounce(
  callable: () => void,
  click_signal: MutableRefObject<boolean | null>,
): void {
  if (!click_signal.current) {
    click_signal.current = true;
    setTimeout(() => {
      click_signal.current = null;
    }, 1000);
    callable();
  }
}

export const useCopyToClipboard = (text: string): [boolean, () => void] => {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  }, [text]);

  useEffect(() => {
    if (!copied) return;

    const timeout = setTimeout(() => setCopied(false), 2000);

    return () => clearTimeout(timeout);
  }, [copied]);

  return [copied, copy];
};

export function convertToPercentage(
  floatValue: number,
  digits: number = 2,
): string {
  if (floatValue < 0 || floatValue > 1) {
    return '0%';
  }
  return (floatValue * 100).toFixed(digits) + '%';
}
