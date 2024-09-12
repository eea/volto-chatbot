import { DateTime } from 'luxon';
import { SVGIcon } from './utils';

import FileIcon from './../icons/file.svg';

export const SourceDetails = ({ source, index }) => {
  const { semantic_identifier, updated_at, blurb, source_type } = source;
  const parsedDate = DateTime.fromISO(updated_at);
  const relativeTime = parsedDate.toRelative();

  return (
    <div className="source">
      <div className="source-header">
        {index && <span className="chat-citation">{index}</span>}{' '}
        <div className="source-title">
          {semantic_identifier || 'untitled document'}
        </div>
        {source_type === 'file' && <SVGIcon name={FileIcon} size="18" />}
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
