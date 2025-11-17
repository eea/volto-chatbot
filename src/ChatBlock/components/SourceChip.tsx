import { useEffect, useState } from 'react';

interface SourceChipProps {
  icon?: React.ReactNode;
  title: string;
  onRemove?: () => void;
  onClick?: () => void;
  includeAnimation?: boolean;
}

export function SourceChip({
  icon,
  title,
  onRemove,
  onClick,
  includeAnimation,
}: SourceChipProps) {
  const [isNew, setIsNew] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsNew(false), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <button
      onClick={onClick}
      className={`source-chip ${includeAnimation && isNew ? 'animate-in' : ''}`}
    >
      {icon && <div className="source-chip-icon">{icon}</div>}
      <span>{title}</span>
      {onRemove && (
        <span
          className="source-chip-remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          ✕
        </span>
      )}
    </button>
  );
}
