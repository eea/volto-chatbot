type IconProps = {
  name: any;
  size?: number;
  color?: string;
  className?: string;
  title?: string;
};

const Icon = ({
  name,
  size = 25,
  color = 'currentColor',
  className = '',
  title = '',
}: IconProps) => {
  return (
    <svg
      xmlns={name?.attributes && name?.attributes?.xmlns}
      width={size}
      height={size}
      viewBox={name?.attributes && name?.attributes?.viewBox}
      fill={name?.attributes?.fill || 'currentColor'}
      stroke={color}
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

export default Icon;
