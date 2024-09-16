import { Popup } from 'semantic-ui-react';
import { DateTime } from 'luxon';
import { SVGIcon } from './utils';

import FileIcon from './../icons/file.svg';
import GlobeIcon from './../icons/globe.svg';

export const SourceDetails = ({ source, index }) => {
  const {
    link,
    blurb,
    updated_at,
    source_type,
    // match_highlights,
    semantic_identifier = 'untitled document',
  } = source || {};
  const parsedDate = updated_at ? DateTime.fromISO(updated_at) : null;
  const relativeTime = parsedDate?.toRelative();
  const isLinkType = source_type === 'web';
  const isDocumentType = source_type === 'file';

  const renderIcon = () => {
    if (isLinkType) {
      return <SVGIcon name={GlobeIcon} size="18" alt="Web icon" />;
    }
    if (isDocumentType) {
      return <SVGIcon name={FileIcon} size="18" alt="File icon" />;
    }
    return null;
  };

  return (
    <div className="source">
      <div className="source-header">
        {isLinkType ? (
          <a href={link} rel="noreferrer" target="_blank">
            <span className="chat-citation">{index}</span>
            <div className="source-title">{semantic_identifier}</div>
            {renderIcon()}
          </a>
        ) : (
          <>
            <Popup
              on="click"
              wide="very"
              content="This doc doesn't have a link."
              trigger={<span className="chat-citation">{index}</span>}
              popper={{ id: 'chat-citation-popup' }}
            />
            {renderIcon()}
          </>
        )}
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
