import React from 'react';
import visit from 'unist-util-visit';
import loadable from '@loadable/component';
import { Button, Message, Tab, Sidebar } from 'semantic-ui-react';
import { SourceDetails } from './Source';
import Spinner from './Spinner';
import UserActionsToolbar from './UserActionsToolbar';
import RelatedQuestions from './RelatedQuestions';
import HalloumiFeedback from './HalloumiFeedback';
import useQualityMarkers from './useQualityMarkers';
import { SVGIcon } from './utils';
import { useDeepCompareMemoize } from './useDeepCompareMemoize';
import { components } from './MarkdownComponents';
import { serializeNodes } from '@plone/volto-slate/editor/render';

import BotIcon from './../icons/bot.svg';
import UserIcon from './../icons/user.svg';
import ClearIcon from './../icons/clear.svg';

function useBufferedValue(value, delay) {
  const [bufferedValue, setBufferedValue] = React.useState(value);
  const latestValue = React.useRef(value);
  const timeoutRef = React.useRef(null);
  const lastExecuted = React.useRef(Date.now());

  React.useEffect(() => {
    latestValue.current = value;

    const now = Date.now();
    const remaining = delay - (now - lastExecuted.current);

    if (remaining <= 0) {
      setBufferedValue(value);
      lastExecuted.current = now;
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setBufferedValue(latestValue.current);
        lastExecuted.current = Date.now();
        timeoutRef.current = null;
      }, remaining);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return bufferedValue;
}

const CITATION_MATCH = /\[\d+\](?![[(\])])/gm;

const Markdown = loadable(() => import('react-markdown'));

function addCitations(text) {
  return text.replaceAll(CITATION_MATCH, (match) => {
    const number = match.match(/\d+/)[0];
    return `${match}(${number})`;
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function ToolCall({ tool_args, tool_name, showShimmer }) {
  if (tool_name === 'run_search') {
    return (
      <div className={`tool_info ${showShimmer ? 'loading-text' : ''}`}>
        Searched for: <em>{tool_args?.query || ''}</em>
      </div>
    );
  }
  return null;
}

function addQualityMarkersPlugin() {
  return function (tree) {
    visit(tree, 'element', function (node) {
      node.children?.forEach((child, cidx) => {
        if (child.type === 'raw' && child.value?.trim() === '<br>') {
          const newNode = {
            ...child,
            type: 'element',
            tagName: 'br',
            children: [],
            value: '',
          };
          node.children[cidx] = newNode;
        }
      });
    });
    visit(tree, 'text', function (node, idx, parent) {
      if (node.value?.trim()) {
        const newNode = {
          type: 'element',
          tagName: 'span',
          children: [node],
        };
        parent.children[idx] = newNode;
      }
    });
  };
}

export function addHalloumiContext(doc, text) {
  const updatedDate = doc.updated_at
    ? new Date(doc.updated_at).toLocaleString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const docIndex = doc.index ? `DOCUMENT ${doc.index}: ` : '';

  const sourceType = doc.source_type
    ? { web: 'Website', file: 'File' }[doc.source_type] ||
      capitalize(doc.source_type)
    : '';

  const header = `${docIndex}${doc.semantic_identifier}${
    sourceType ? `\nSource: ${sourceType}` : ''
  }${updatedDate ? `\nUpdated: ${updatedDate}` : ''}`;

  return `${header}\n${text}`;
}

function mapToolDocumentsToText(message) {
  // make a map of document_id: text
  return message.toolCalls?.reduce((acc, cur) => {
    return {
      ...acc,
      ...Object.assign(
        {},
        ...(cur.tool_result || []).map((doc) => ({
          [doc.document_id]: doc.content,
        })),
      ),
    };
  }, {});
}

function getContextSources(message, sources, qualityCheckContext) {
  const documentIdToText = mapToolDocumentsToText(message);

  return qualityCheckContext === 'citations'
    ? sources.map((doc) => ({
        ...doc,
        id: doc.document_id,
        text: documentIdToText[doc.document_id] || '',
        halloumiContext: addHalloumiContext(
          doc,
          documentIdToText[doc.document_id] || '',
        ),
      }))
    : (message.toolCalls || []).reduce(
        (acc, cur) => [
          ...acc,
          ...(cur.tool_result || []).map((doc) => ({
            ...doc,
            id: doc.document_id,
            text: doc.content,
            halloumiContext: addHalloumiContext(doc, doc.content),
          })),
        ], // TODO: make sure we don't add multiple times the same doc
        // TODO: this doesn't have the index for source
        [],
      );
}

function getScoreDetails(claims, qualityCheckStages) {
  const score = (
    (claims.length > 0
      ? claims.reduce((acc, { score }) => acc + score, 0) / claims.length
      : 1) * 100
  ).toFixed(0);

  const scoreStage = qualityCheckStages?.find(
    ({ start, end }) => start <= score && score <= end,
  );
  const isFirstScoreStage =
    qualityCheckStages?.reduce(
      (acc, { start, end }, curIx) =>
        start <= score && score <= end ? curIx : acc,
      -1,
    ) ?? -1;
  const scoreColor = scoreStage?.color || 'black';
  return { score, scoreStage, isFirstScoreStage, scoreColor };
}

export function ChatMessageBubble(props) {
  const {
    message,
    isLoading,
    libs,
    onChoice,
    showToolCalls,
    enableFeedback,
    feedbackReasons,
    qualityCheck,
    qualityCheckStages,
    qualityCheckContext,
    qualityCheckEnabled,
    noSupportDocumentsMessage,
    totalFailMessage,
    isFetchingRelatedQuestions,
    enableShowTotalFailMessage,
    enableMatomoTracking,
    persona,
    maxContextSegments,
  } = props;
  const { remarkGfm } = libs; // , rehypePrism
  const { citations = {}, documents = [], type } = message;
  const isUser = type === 'user';
  const [forceHalloumi, setForceHallomi] = React.useState(
    qualityCheck === 'enabled',
  );
  const [verificationTriggered, setVerificationTriggered] =
    React.useState(false);
  const [isMessageVerified, setIsMessageVerified] = React.useState(false);
  const [showShimmer, setShowShimmer] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState(0);
  const [showSourcesSidebar, setShowSourcesSidebar] = React.useState(false);

  React.useEffect(() => {
    if (qualityCheck === 'ondemand_toggle' && qualityCheckEnabled) {
      setForceHallomi(true);
    } else {
      setForceHallomi(false);
    }
  }, [qualityCheck, qualityCheckEnabled]);

  const inverseMap = Object.entries(citations).reduce((acc, [k, v]) => {
    return { ...acc, [v]: k };
  }, {});

  const sources = Object.values(citations).map((doc_id) => ({
    ...(documents.find((doc) => doc.db_doc_id === doc_id) || {}),
    index: inverseMap[doc_id],
  }));
  const showSources = sources.length > 0;

  const contextSources = getContextSources(
    message,
    sources,
    qualityCheckContext,
  );

  const stableContextSources = useDeepCompareMemoize(contextSources);

  const doQualityControl =
    !isUser &&
    qualityCheck &&
    qualityCheck !== 'disabled' &&
    forceHalloumi &&
    showSources &&
    (qualityCheckEnabled || verificationTriggered) &&
    message.messageId > -1;

  const { markers, isLoadingHalloumi, retryHalloumi } = useQualityMarkers(
    doQualityControl,
    addCitations(message.message),
    stableContextSources,
    maxContextSegments,
  );

  const claims = markers?.claims || [];
  const { score, scoreStage, scoreColor, isFirstScoreStage } = getScoreDetails(
    claims,
    qualityCheckStages,
  );

  const isFetching = isLoadingHalloumi || isLoading;
  const halloumiMessage =
    isMessageVerified || doQualityControl ? scoreStage?.label : '';

  const showVerifyClaimsButton =
    sources.length > 0 &&
    !isFetching &&
    !markers &&
    (qualityCheck === 'ondemand' ||
      (qualityCheck === 'ondemand_toggle' && !qualityCheckEnabled));

  const showTotalFailMessage =
    sources.length === 0 && !isFetching && enableShowTotalFailMessage;

  React.useEffect(() => {
    if (markers?.claims?.length > 0) {
      setIsMessageVerified(true);
    }
  }, [markers]);

  React.useEffect(() => {
    if (!isUser) {
      if (message.message?.length > 0) {
        setShowShimmer(false);
      } else {
        setShowShimmer(true);
      }
    }
  }, [message.message, isUser]);

  const bufferedMessage = useBufferedValue(message.message, 150);
  // console.log(bufferedMessage);

  const formattedText = (
    <Markdown
      components={components(message, markers, stableContextSources)}
      remarkPlugins={[remarkGfm.default]}
      rehypePlugins={[addQualityMarkersPlugin]}
    >
      {addCitations(bufferedMessage)}
    </Markdown>
  );

  const answerTab = (
    <div className="answer-tab">
      {showSources && (
        <div className="sources">
          {sources.slice(0, 3).map((source, i) => (
            <SourceDetails source={source} key={i} index={source.index} />
          ))}

          {sources.length > 3 && (
            <Button
              className="source show-all-sources-btn"
              onClick={() => setShowSourcesSidebar(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setShowSourcesSidebar(true);
                }
                if (e.key === 'Escape') {
                  setShowSourcesSidebar(false);
                }
              }}
            >
              <div className="source-header">
                <div>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span key={i} className="chat-citation"></span>
                  ))}
                </div>
                <div className="source-title">See all sources</div>
              </div>
            </Button>
          )}
        </div>
      )}

      {formattedText}

      {!isUser && showTotalFailMessage && (
        <Message color="red">{serializeNodes(totalFailMessage)}</Message>
      )}

      {!isUser && (
        <HalloumiFeedback
          sources={sources}
          halloumiMessage={halloumiMessage}
          isLoadingHalloumi={isLoadingHalloumi}
          markers={markers}
          score={score}
          scoreColor={scoreColor}
          onManualVerify={() => {
            setForceHallomi(true);
            setVerificationTriggered(true);
          }}
          showVerifyClaimsButton={showVerifyClaimsButton}
          retryHalloumi={retryHalloumi}
        />
      )}

      {!isUser && !isLoading && (
        <UserActionsToolbar
          message={message}
          enableFeedback={enableFeedback}
          feedbackReasons={feedbackReasons}
          enableMatomoTracking={enableMatomoTracking}
          persona={persona}
        />
      )}

      {isFirstScoreStage === -1 && serializeNodes(noSupportDocumentsMessage)}

      {!isUser && isFetchingRelatedQuestions && (
        <Message color="blue">
          <div className="related-questions-loader">
            <Spinner />
            Finding related questions...
          </div>
        </Message>
      )}

      <RelatedQuestions
        persona={persona}
        message={message}
        isLoading={isLoading}
        onChoice={onChoice}
        enableMatomoTracking={enableMatomoTracking}
      />
    </div>
  );

  const panes = [
    { menuItem: 'Answer', render: () => <Tab.Pane>{answerTab}</Tab.Pane> },
    {
      menuItem: {
        key: 'sources',
        content: (
          <span>
            Sources <span className="sources-count">({sources.length})</span>
          </span>
        ),
      },
      render: () => (
        <Tab.Pane>
          <div className="sources-listing">
            {showSources && (
              <div className="sources">
                {sources.map((source, i) => (
                  <SourceDetails source={source} key={i} index={source.index} />
                ))}
              </div>
            )}
          </div>
        </Tab.Pane>
      ),
    },
  ];

  return (
    <div>
      <div className="comment">
        {isUser ? (
          <div className="circle user">
            <SVGIcon name={UserIcon} size="20" color="white" />
          </div>
        ) : (
          <div className="circle assistant">
            <SVGIcon name={BotIcon} size="20" color="white" />
          </div>
        )}

        <div>
          {showToolCalls &&
            message.toolCalls?.map((info, index) => (
              <ToolCall key={index} {...info} showShimmer={showShimmer} />
            ))}

          {!isUser ? (
            <div className="comment-tabs">
              {showSources ? (
                <>
                  <Tab
                    activeIndex={activeTab}
                    onTabChange={(_, data) => setActiveTab(data.activeIndex)}
                    menu={{ secondary: true, pointing: true, fluid: true }}
                    panes={panes}
                  />

                  <Sidebar
                    visible={showSourcesSidebar}
                    animation="overlay"
                    icon="labeled"
                    width="wide"
                    direction="right"
                    className="sources-sidebar"
                    onHide={() => setShowSourcesSidebar(false)}
                  >
                    <div className="sources-sidebar-heading">
                      <h4>Sources</h4>
                      <Button
                        basic
                        onClick={() => {
                          setShowSourcesSidebar(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setShowSourcesSidebar(false);
                          }
                        }}
                      >
                        <SVGIcon name={ClearIcon} size="24" />
                      </Button>
                    </div>
                    <div className="sources-listing">
                      {showSources && (
                        <div className="sources">
                          {sources.map((source, i) => (
                            <SourceDetails
                              source={source}
                              key={i}
                              index={source.index}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </Sidebar>
                </>
              ) : (
                answerTab
              )}
            </div>
          ) : (
            formattedText
          )}
        </div>
      </div>
    </div>
  );
}
