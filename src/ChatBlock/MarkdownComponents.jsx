import React from 'react';

import { convertToPercentage, transformEmailsToLinks } from './utils';
import { Modal, ModalContent, Tab, TabPane } from 'semantic-ui-react';
import { Citation } from './Citation';
import { getSupportedBgColor, getSupportedTextColor } from './colors';
import { SourceDetails } from './Source';

import './colors.less';

// const EXPAND = 100;

const RenderClaimView = (props) => {
  const {
    contextText,
    value,
    visibleCitationId,
    spanRef,
    sourceStartIndex = 0,
  } = props;
  const citations = props.citations || [];
  const sortedCitations = citations.sort(
    (a, b) => a.startOffset - b.startOffset,
  );

  const citationSpans = sortedCitations.map((citation, ind) => {
    const isSelectedCitation = citation.id === visibleCitationId;
    const Tag = isSelectedCitation ? 'mark' : 'span';
    return (
      <span key={ind} ref={spanRef}>
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
      <span key={currentKey}>{value.slice(startIndex, currentInd)}</span>,
    );
  }

  return <div className="citation-text">{allSpans}</div>;
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
  const spanRef = React.useRef();

  const panes = sourcesWithSnippets.map((source, i) => {
    console.log({ source });
    return {
      menuItem: () => (
        <button className="sources" key={i} onClick={() => setActiveTab(i)}>
          <SourceDetails source={source} index={source.index} />
        </button>
      ),
      render: () => (
        <TabPane>
          <div style={{ display: 'flex' }}>
            {source?.snippets?.map(({ id }) => {
              return (
                <div key={id}>
                  <button
                    onClick={() => {
                      spanRef.current && spanRef.current.scrollIntoView();
                      setVisibleCitation(id);
                    }}
                  >
                    Line {id}
                  </button>
                </div>
              );
            })}
          </div>
          <RenderClaimView
            contextText={joinedSources}
            value={source.text}
            visibleCitationId={visibleCitationId}
            citations={source.snippets}
            spanRef={spanRef}
            sourceStartIndex={source.startIndex}
          />
        </TabPane>
      ),
    };
  });

  return (
    <div className="chat-window">
      {visibleCitationId || ''}
      <Tab
        menu={{ tabular: true, attached: true }}
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

      return claim ? (
        <Modal
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
      ) : (
        rest.children || []
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
