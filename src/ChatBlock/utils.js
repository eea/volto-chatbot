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
