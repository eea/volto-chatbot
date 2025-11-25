import { useState } from 'react';
import SVGIcon from './Icon';
import FileIcon from '../../icons/file.svg';
import GlobeIcon from '../../icons/globe.svg';

interface WebResultIconProps {
  url: string;
  size?: number;
}

export function WebResultIcon({ url, size = 10 }: WebResultIconProps) {
  const [error, setError] = useState(false);

  let hostname;
  try {
    hostname = new URL(url).hostname;
  } catch (e) {
    // If URL parsing fails, fall back to FileIcon
    return <SVGIcon name={FileIcon} size={size} />;
  }

  // If favicon failed to load, show GlobeIcon
  if (error) {
    return <SVGIcon name={GlobeIcon} size={size} />;
  }

  // Use Google's advanced favicon service
  return (
    <img
      src={`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${hostname}&size=128`}
      alt="favicon"
      height={size}
      width={size}
      onError={() => setError(true)}
      style={{
        height: `${size}px`,
        width: `${size}px`,
        objectFit: 'contain',
      }}
    />
  );
}
