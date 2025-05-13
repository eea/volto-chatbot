import { useState, useCallback, useEffect } from 'react';

export const EMAIL_REGEX = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

// Convert text with email addresses to mailto links
export function transformEmailsToLinks(text) {
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

export const SVGIcon = ({ name, size, color, className, title }) => {
  return (
    <svg
      xmlns={name?.attributes && name?.attributes?.xmlns}
      width={size || '25'}
      height={size || '25'}
      viewBox={name?.attributes && name?.attributes?.viewBox}
      fill={name?.attributes?.fill || 'currentColor'}
      stroke={color || 'currentColor'}
      strokeWidth={name?.attributes['stroke-width']}
      strokeLinecap={name?.attributes['stroke-linecap']}
      strokeLinejoin={name?.attributes[' stroke-linejoin']}
      className={className ? `icon ${className}` : 'icon'}
      dangerouslySetInnerHTML={{
        __html: title ? `<title>${title}</title>${name.content}` : name.content,
      }}
    />
  );
};

export function debounce(callable, click_signal) {
  if (!click_signal.current) {
    click_signal.current = true;
    setTimeout(() => {
      click_signal.current = null;
    }, 1000);
    callable();
  }
}

export const useCopyToClipboard = (text) => {
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

export function convertToPercentage(floatValue, digits = 2) {
  if (floatValue < 0 || floatValue > 1) {
    return 0;
  }
  return (floatValue * 100).toFixed(digits) + '%';
}
