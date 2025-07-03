import React from 'react';

import { convertToPercentage, transformEmailsToLinks, SVGIcon } from './utils';
import { Modal, ModalContent, Tab, TabPane, Button } from 'semantic-ui-react';
import { Citation } from './Citation';
import { getSupportedBgColor, getSupportedTextColor } from './colors';
import { SourceDetails } from './Source';

import PrevIcon from './../icons/chevron-left.svg';
import NextIcon from './../icons/chevron-right.svg';

import './colors.less';

// const EXPAND = 100;
const BUTTONS_PER_PAGE = 25;

const RenderClaimView = (props) => {
  const {
    contextText,
    value,
    visibleCitationId,
    spanRefs,
    sourceStartIndex = 0,
    citationContainerRef,
  } = props;

  const citations = props.citations || [];
  const sortedCitations = citations.sort(
    (a, b) => a.startOffset - b.startOffset,
  );

  const citationSpans = sortedCitations.map((citation, ind) => {
    const isSelectedCitation = citation.id === visibleCitationId;
    const Tag = isSelectedCitation ? 'mark' : 'span';
    return (
      <span
        key={ind}
        ref={(el) => {
          if (el) spanRefs.current[citation.id] = el;
        }}
      >
        <Tag>
          {contextText.slice(citation.startOffset, citation.endOffset)}
          <sup>{citation.id}</sup>
        </Tag>
      </span>
    );
  });

  let startIndex = sourceStartIndex;
  let currentInd = startIndex;
  let currentKey = citations.length;
  const allSpans = [];

  while (currentInd < startIndex + value.length) {
    const ix = currentInd;
    const nextCitation = sortedCitations.findIndex(
      (citation) => citation.startOffset === ix,
    );
    if (nextCitation >= 0) {
      // Push our current text before the citation starts.
      if (startIndex < currentInd) {
        allSpans.push(
          <span key={currentKey}>
            {value.slice(
              startIndex - sourceStartIndex,
              currentInd - sourceStartIndex,
            )}
          </span>,
        );
        currentKey++;
      }
      allSpans.push(citationSpans[nextCitation]);
      currentInd = sortedCitations[nextCitation].endOffset;
      startIndex = currentInd;
    } else {
      currentInd++;
    }
  }
  // Push the remaining text.
  if (startIndex < currentInd) {
    allSpans.push(
      <span key={currentKey}>
        {value.slice(
          startIndex - sourceStartIndex,
          currentInd - sourceStartIndex,
        )}
      </span>,
    );
  }

  return (
    <div className="citation-text" ref={citationContainerRef}>
      {allSpans}
    </div>
  );
};

export function ClaimCitations(props) {
  const { ids, citations, citedSources } = props;

  let joinedSources = '';
  citedSources.forEach((source) => {
    source.startIndex = joinedSources.length;
    joinedSources += source.text + '\n---\n';
  });

  const snippets = (ids || [])
    .map((id) => citations[id])
    .map((cit) => {
      const text = joinedSources.slice(cit.startOffset, cit.endOffset);
      const source = citedSources.find((cit) => cit.text.indexOf(text) > -1);
      return {
        ...cit,
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

  const [activeTab, setActiveTab] = React.useState(0);
  const [visibleCitationId, setVisibleCitation] = React.useState();
  const [buttonPage, setButtonPage] = React.useState(0);

  const citationContainerRef = React.useRef(null);
  const spanRefs = React.useRef({});

  const panes = sourcesWithSnippets.map((source, i) => {
    const snippetButtons = source.snippets || [];
    const totalPages = Math.ceil(snippetButtons.length / BUTTONS_PER_PAGE);

    const citationButtons = snippetButtons.slice(
      buttonPage * BUTTONS_PER_PAGE,
      (buttonPage + 1) * BUTTONS_PER_PAGE,
    );

    return {
      menuItem: () => (
        <button
          key={i}
          className={`sources ${activeTab === i ? 'active' : ''}`}
          onClick={() => {
            setActiveTab(i);
            setButtonPage(0);
          }}
        >
          <SourceDetails source={source} index={source.index} />
        </button>
      ),
      render: () => (
        <TabPane>
          <div
            className={`citation-buttons ${
              totalPages > 1 ? 'slider-active' : ''
            }`}
          >
            <div className="citation-buttons-container">
              {citationButtons.map(({ id }) => (
                <Button
                  key={id}
                  size="tiny"
                  onClick={() => {
                    const container = citationContainerRef.current;
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
                    setVisibleCitation(id);
                  }}
                >
                  Line {id}
                </Button>
              ))}
            </div>

            <div className="slider-buttons">
              {totalPages > 1 && (
                <Button
                  className="slider-button-prev"
                  onClick={() => setButtonPage(Math.max(0, buttonPage - 1))}
                  disabled={buttonPage === 0}
                >
                  <SVGIcon name={PrevIcon} />
                </Button>
              )}
              {totalPages > 1 && (
                <Button
                  className="slider-button-next"
                  onClick={() =>
                    setButtonPage(Math.min(totalPages - 1, buttonPage + 1))
                  }
                  disabled={buttonPage >= totalPages - 1}
                >
                  <SVGIcon name={NextIcon} />
                </Button>
              )}
            </div>
          </div>
          <RenderClaimView
            contextText={joinedSources}
            value={source.text}
            visibleCitationId={visibleCitationId}
            citations={source.snippets}
            citationContainerRef={citationContainerRef}
            spanRefs={spanRefs}
            sourceStartIndex={source.startIndex}
          />
        </TabPane>
      ),
    };
  });

  return (
    <div className="chat-window">
      <Tab
        menu={{ secondary: true, attached: true }}
        attached
        panes={panes}
        activeIndex={activeTab}
      />
    </div>
  );
}

export function components(message, markers, citedSources) {
  return {
    span: (props) => {
      const { node, ...rest } = props;
      const child = node.children[0];
      let claim;

      if (
        child.type === 'text' &&
        child.position &&
        child.value?.length > 10 && // we don't show for short text
        markers
      ) {
        const start = child.position.start.offset;
        const end = child.position.end.offset;
        claim = markers.claims?.find(
          (claim) =>
            (start >= claim.startOffset && end <= claim.endOffset) ||
            (claim.startOffset >= start && end <= claim.endOffset),
        );
      }

      return !claim || claim?.score === null ? (
        rest.children || []
      ) : (
        <Modal
          className="claim-modal"
          trigger={
            <span className={`claim ${getSupportedBgColor(claim.score)}`}>
              {rest.children}
            </span>
          }
        >
          <ModalContent>
            <h2>
              Supported by citations:{' '}
              <span className={getSupportedTextColor(claim.score)}>
                {convertToPercentage(claim.score)}
              </span>
            </h2>
            <p>{claim.rationale}</p>

            <ClaimCitations
              ids={claim.citationIds}
              citations={markers?.citations || []}
              citedSources={citedSources}
            />
          </ModalContent>
        </Modal>
      );
    },
    a: (props) => {
      const { node, ...rest } = props;
      const value = node.children?.[0]?.children?.[0]?.value || ''; // we assume a <a><span/></a>

      if (value?.toString().startsWith('*')) {
        return <div className="" />;
      } else {
        return (
          <Citation link={rest?.href} value={value} message={message}>
            {rest.children}
          </Citation>
        );
      }
    },
    p: ({ node, ...props }) => {
      // TODO: reimplement this with rehype
      const children = props.children;
      const text = React.Children.map(children, (child) => {
        if (typeof child === 'string') {
          return transformEmailsToLinks(child);
        }
        return child;
      });

      return (
        <p {...props} className="text-default">
          {text}
        </p>
      );
    },
  };
}

// const before = joinedSources.slice(
//   Math.max(cit.startOffset - EXPAND, 0),
//   cit.startOffset,
// );
// const after = joinedSources.slice(
//   cit.endOffset,
//   Math.min(cit.endOffset + EXPAND, joinedSources.length),
// );

// const expandedText = (
//   <>
//     ...{before}
//     <strong>
//       <em>{text}</em>{' '}
//     </strong>
//     {after}...
//   </>
// );

// `...${joinedSources.slice(
//   Math.max(cit.startOffset - EXPAND, 0),
//   Math.min(cit.endOffset + EXPAND, joinedSources.length),
// )}...`;
