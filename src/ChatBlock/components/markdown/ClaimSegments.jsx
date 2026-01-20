import React from 'react';
import { Tab, TabPane, Button } from 'semantic-ui-react';
import SVGIcon from '../Icon';
import { RenderClaimView } from './RenderClaimView';
import LinkIcon from '../../../icons/external-link.svg';

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
          <div className="claim-source-header">
            {source?.link ? (
              <a
                href={source.link}
                rel="noreferrer"
                target="_blank"
                className="claim-source-link"
              >
                <h5 className="claim-source-title">
                  {source.semantic_identifier}
                  <SVGIcon name={LinkIcon} size="16" />
                </h5>
              </a>
            ) : (
              <h5 className="claim-source-title">
                {source?.semantic_identifier}
              </h5>
            )}
          </div>
          <div className="citation-buttons">
            <h5 className="citations-header">Citations:</h5>
            <div className="citation-buttons-container">
              {segmentButtons.map(({ id }) => (
                <Button
                  key={id}
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
                  Line {id}
                </Button>
              ))}

              {snippetButtons.length > VISIBLE_SEGMENTS && (
                <Button
                  className="toggle-text"
                  role="button"
                  tabIndex={0}
                  onClick={() => setShowAllButtons(!showAllButtons)}
                >
                  {showAllButtons ? 'Less' : '... More'}
                </Button>
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
