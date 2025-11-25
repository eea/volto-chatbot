import { Popup } from 'semantic-ui-react';
import SVGIcon from './Icon';

import FileIcon from '../../icons/file.svg';
import GlobeIcon from '../../icons/globe.svg';

import { injectLazyLibs } from '@plone/volto/helpers/Loadable/Loadable';

const SourceDetails_ = ({ source, index, luxon }) => {
  // Ensure source is an object
  if (!source || typeof source !== 'object') {
    return null;
  }

  const { link, blurb, updated_at, source_type, semantic_identifier } = source;
  const parsedDate = updated_at ? luxon.DateTime.fromISO(updated_at) : null;
  const relativeTime = parsedDate?.toRelative();
  const isLinkType = source_type === 'web';
  const isDocumentType = source_type === 'file';

  const renderIcon = () => {
    if (isLinkType) {
      return <SVGIcon name={GlobeIcon} size="16" alt="Web icon" />;
    }
    if (isDocumentType) {
      return <SVGIcon name={FileIcon} size="16" alt="File icon" />;
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

  // Ensure we have valid data before rendering
  if (!semantic_identifier) {
    return null;
  }

  return (
    <>
      {isLinkType && link ? (
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

const SourceDetails = injectLazyLibs(['luxon'])(SourceDetails_);

export default SourceDetails;
