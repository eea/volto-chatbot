import React from 'react';
import { Tab, TabPane } from 'semantic-ui-react';
import SVGIcon from '../Icon';
import { RenderClaimView } from './RenderClaimView';
import LinkIcon from '../../../icons/external-link.svg';
import FileIcon from '../../../icons/file.svg';
import GlobeIcon from '../../../icons/globe.svg';

const VISIBLE_SEGMENTS = 50; // Number of citations to show by default

export function ClaimSegments({ segmentIds, segments, citedSources }) {
  const joinedSources = citedSources.reduce((acc, source) => {
    source.startIndex = acc.length ? acc.length + 1 : 0;
    const sep = acc ? '\n' : '';
    return acc + sep + source.halloumiContext; // + '\n---\n';
  }, '');

  const snippets = (segmentIds || [])
    .map((id) => {
      const segment = segments[id];
      if (!segment) {
        // eslint-disable-next-line no-console
        console.warn(`Could not find segment ${id} in `, segments);
      }
      return segment;
    })
    .filter((segment) => !!segment)
    .map((segment) => {
      const text = joinedSources.slice(
        Math.max(0, segment.startOffset), // sometimes startOffset comes as -1
        segment.endOffset,
      );
      const source = citedSources.find((cit) => cit.text.indexOf(text) > -1);
      return {
        ...segment,
        text,
        // expandedText,
        source_id: source?.id,
      };
    });

  const sourcesWithSnippets = citedSources
    .map((source) => ({
      ...source,
      snippets: snippets.filter((s) => s.source_id === source.id),
    }))
    .filter((source) => source.snippets.length > 0)
    .sort((sa, sb) => sa.index - sb.index);

  // eslint-disable-next-line no-console
  // console.log({ snippets, sourcesWithSnippets, segments, citedSources });

  const [activeTab, setActiveTab] = React.useState(0);
  const [visibleSegmentId, setVisibleSegment] = React.useState();
  const [showAllButtons, setShowAllButtons] = React.useState(false);

  const segmentContainerRef = React.useRef(null);
  const spanRefs = React.useRef({});

  const panes = sourcesWithSnippets.map((source, i) => {
    const snippetButtons = source.snippets || [];

    const segmentButtons = showAllButtons
      ? snippetButtons
      : snippetButtons.slice(0, VISIBLE_SEGMENTS);

    const sourceType = source.source_type;
    const SourceIcon = source.source_type === 'web' ? GlobeIcon : FileIcon;

    return {
      menuItem: {
        key: i,
        content: (
          <span title={source?.semantic_identifier}>
            {source?.semantic_identifier}
          </span>
        ),
        className: `${activeTab === i ? 'active' : ''}`,
        onClick: () => {
          setActiveTab(i);
        },
      },
      render: () => (
        <TabPane>
          <div className="source-card-header">
            <div className="source-card-info">
              <SVGIcon name={SourceIcon} size="20" className="source-icon" />
              <div className="source-card-details">
                <h5 className="source-card-title">
                  {source?.semantic_identifier}
                </h5>
                <span className="source-type-badge">{sourceType}</span>
              </div>
            </div>
            {source?.link && (
              <a
                href={source.link}
                rel="noreferrer"
                target="_blank"
                className="source-external-link"
                title="Open source"
              >
                <SVGIcon name={LinkIcon} size="16" />
              </a>
            )}
          </div>

          <div className="citation-chips-section">
            <h5 className="citation-chips-header">Jump to Citation</h5>
            <div className="citation-chips-container">
              {segmentButtons.map(({ id }) => (
                <button
                  key={id}
                  className={`citation-chip ${
                    visibleSegmentId === id ? 'active' : ''
                  }`}
                  onClick={() => {
                    const container = segmentContainerRef.current;
                    const target = spanRefs.current[id];
                    if (container && target) {
                      const containerTop =
                        container.getBoundingClientRect().top;
                      const targetTop = target.getBoundingClientRect().top;
                      const scrollOffset =
                        targetTop - containerTop + container.scrollTop;
                      container.scrollTo({
                        top: scrollOffset - 50,
                        behavior: 'smooth',
                      });
                    }
                    setVisibleSegment(id);
                  }}
                >
                  #{id}
                </button>
              ))}

              {snippetButtons.length > VISIBLE_SEGMENTS && (
                <button
                  className="citation-chip more-chip"
                  onClick={() => setShowAllButtons(!showAllButtons)}
                >
                  {showAllButtons
                    ? 'Less'
                    : `+${snippetButtons.length - VISIBLE_SEGMENTS} More`}
                </button>
              )}
            </div>
          </div>
          <RenderClaimView
            contextText={joinedSources}
            value={source.halloumiContext}
            visibleSegmentId={visibleSegmentId}
            segmentContainerRef={segmentContainerRef}
            spanRefs={spanRefs}
            sourceStartIndex={source.startIndex}
            segments={source.snippets}
          />
        </TabPane>
      ),
    };
  });

  return (
    <div className="chat-window">
      <Tab
        menu={{ secondary: true, pointing: true }}
        panes={panes}
        activeIndex={activeTab}
      />
    </div>
  );
}
