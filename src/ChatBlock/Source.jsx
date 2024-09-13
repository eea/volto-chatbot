import { DateTime } from 'luxon';
import { SVGIcon } from './utils';

import FileIcon from './../icons/file.svg';
import GlobeIcon from './../icons/globe.svg';

export const SourceDetails = ({
  source: {
    semantic_identifier = 'untitled document',
    updated_at,
    blurb,
    source_type,
  } = {},
  index,
}) => {
  const parsedDate = updated_at ? DateTime.fromISO(updated_at) : null;
  const relativeTime = parsedDate?.toRelative();

  const renderIcon = () => {
    if (source_type === 'file')
      return <SVGIcon name={FileIcon} size="18" alt="File icon" />;
    if (source_type === 'web')
      return <SVGIcon name={GlobeIcon} size="18" alt="Web icon" />;
    return null;
  };

  return (
    <div className="source">
      <div className="source-header">
        {index && <span className="chat-citation">{index}</span>}{' '}
        <div className="source-title">{semantic_identifier}</div>
        {renderIcon()}
      </div>
      {updated_at && (
        <div className="source-date">
          <span>{relativeTime}</span>
        </div>
      )}
      {blurb && (
        <div className="source-desc">
          <span>{blurb}</span>
        </div>
      )}
    </div>
  );
};
