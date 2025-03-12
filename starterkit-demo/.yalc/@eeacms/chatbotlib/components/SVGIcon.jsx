export default function SVGIcon({ name, size, color, className, title }) {
  return (
    <svg
      xmlns={name?.attributes && name?.attributes?.xmlns}
      width={size || '25'}
      height={size || '25'}
      viewBox={name?.attributes && name?.attributes?.viewBox}
      fill={name?.attributes?.fill || 'currentColor'}
      stroke={color || 'currentColor'}
      strokeWidth={name?.attributes?.['stroke-width']}
      strokeLinecap={name?.attributes?.['stroke-linecap']}
      strokeLinejoin={name?.attributes?.[' stroke-linejoin']}
      className={className ? `icon ${className}` : 'icon'}
      dangerouslySetInnerHTML={{
        __html: title ? `<title>${title}</title>${name.content}` : name.content,
      }}
    />
  );
}
