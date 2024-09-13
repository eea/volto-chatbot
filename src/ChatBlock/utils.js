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
