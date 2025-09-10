import { Popup } from 'semantic-ui-react';
import { SVGIcon } from './utils';

import FileIcon from './../icons/file.svg';
import GlobeIcon from './../icons/globe.svg';

import { injectLazyLibs } from '@plone/volto/helpers/Loadable/Loadable';

const SourceDetails_ = ({ source, index, luxon }) => {
  const {
    link,
    blurb,
    updated_at,
    source_type,
    semantic_identifier = 'untitled document',
  } = source || {};
  const parsedDate = updated_at ? luxon.DateTime.fromISO(updated_at) : null;
  const relativeTime = parsedDate?.toRelative();
  const isLinkType = source_type === 'web';
  const isDocumentType = source_type === 'file';

  const renderIcon = () => {
    if (isLinkType) {
      return <SVGIcon name={GlobeIcon} size="15" alt="Web icon" />;
    }
    if (isDocumentType) {
      return <SVGIcon name={FileIcon} size="15" alt="File icon" />;
    }
    return null;
  };

  const sourceContent = (
    <>
      {blurb && (
        <div className="source-desc">
          <span>{blurb}</span>
        </div>
      )}
      {updated_at && (
        <div className="source-date">
          <span>{relativeTime}</span>
        </div>
      )}
    </>
  );

  return (
    <>
      {isLinkType ? (
        <a
          href={link}
          rel="noreferrer"
          target="_blank"
          className="source source-link"
        >
          <div className="source-header">
            <span className="chat-citation">{index}</span>
            <div className="source-title" title={semantic_identifier}>
              {semantic_identifier}
            </div>
            {renderIcon()}
          </div>
          {sourceContent}
        </a>
      ) : (
        <div className="source">
          <div className="source-header">
            <Popup
              on="click"
              wide="very"
              content="This doc doesn't have a link."
              trigger={<span className="chat-citation">{index}</span>}
              popper={{ id: 'chat-citation-popup' }}
            />
            <div className="source-title" title={semantic_identifier}>
              {semantic_identifier}
            </div>
            {renderIcon()}
          </div>
          {sourceContent}
        </div>
      )}
    </>
  );
};

export const SourceDetails = injectLazyLibs(['luxon'])(SourceDetails_);
