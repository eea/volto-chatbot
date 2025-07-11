import React from 'react';

import { convertToPercentage, transformEmailsToLinks } from './utils';
import {
  Modal,
  ModalContent,
  ModalHeader,
  Tab,
  TabPane,
  Button,
  Menu,
} from 'semantic-ui-react';
import { Citation } from './Citation';
import { SVGIcon } from './utils';
import { getSupportedBgColor, getSupportedTextColor } from './colors';

import BotIcon from './../icons/bot.svg';
import LinkIcon from './../icons/external-link.svg';
import './colors.less';

// const EXPAND = 100;
const VISIBLE_CITATIONS = 50; // Number of citations to show by default

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
    joinedSources += source.halloumiContext + '\n---\n';
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
  const [showAllButtons, setShowAllButtons] = React.useState(false);

  const citationContainerRef = React.useRef(null);
  const spanRefs = React.useRef({});

  const panes = sourcesWithSnippets.map((source, i) => {
    const snippetButtons = source.snippets || [];

    const citationButtons = showAllButtons
      ? snippetButtons
      : snippetButtons.slice(0, VISIBLE_CITATIONS);

    return {
      menuItem: () => (
        <Menu.Item
          key={i}
          className={`${activeTab === i ? 'active' : ''}`}
          onClick={() => {
            setActiveTab(i);
          }}
        >
          <span title={source?.semantic_identifier}>
            {source?.semantic_identifier}
          </span>
        </Menu.Item>
      ),
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
                  <SVGIcon name={LinkIcon} size="20" />
                </h5>
              </a>
            ) : (
              <div className="claim-source-link">
                <h5 className="claim-source-title">
                  {source?.semantic_identifier}
                  <SVGIcon name={LinkIcon} size="20" />
                </h5>
              </div>
            )}
          </div>
          <div className="citation-buttons">
            <h5 className="citations-header">Citations:</h5>
            <div className="citation-buttons-container">
              {citationButtons.map(({ id }) => (
                <Button
                  key={id}
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

              {snippetButtons.length > VISIBLE_CITATIONS && (
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
            // value={source.text}
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
        menu={{ secondary: true, pointing: true }}
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
          <ModalHeader>
            <div className="circle assistant">
              <SVGIcon name={BotIcon} size="20" color="white" />
            </div>
            <h5
              className={`claim claim-text ${getSupportedBgColor(claim.score)}`}
            >
              &ldquo;{rest.children}&rdquo;
            </h5>
          </ModalHeader>
          <ModalContent>
            <div className="claim-source">
              <p className="claim-score">
                Supported by citations:{' '}
                <span className={getSupportedTextColor(claim.score)}>
                  {convertToPercentage(claim.score)}
                </span>
              </p>

              <p className="claim-rationale">
                <strong>Rationale: </strong>
                {claim.rationale}
              </p>
            </div>

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
