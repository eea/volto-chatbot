import type { ChatMessageProps } from '../types/interfaces';
import { useState, useMemo, useEffect } from 'react';
import visit from 'unist-util-visit';
import loadable from '@loadable/component';
import {
  Tab,
  Sidebar,
  Button,
  Message as SemanticMessage,
} from 'semantic-ui-react';
import { serializeNodes } from '@plone/volto-slate/editor/render';
import {
  useDeepCompareMemoize,
  useQualityMarkers,
  useScrollonStream,
} from '../hooks';
import { MultiToolRenderer, RendererComponent } from '../packets';
import { addCitations } from '../utils/citations';
import SVGIcon from '../components/Icon';
import BotIcon from '../../icons/bot.svg';
import ClearIcon from '../../icons/clear.svg';

// Lazy load heavy components
const SourceDetails: any = loadable(() => import('../components/Source'));
const UserActionsToolbar: any = loadable(
  () => import('../components/UserActionsToolbar'),
);
const RelatedQuestions: any = loadable(
  () => import('../components/RelatedQuestions'),
);
const HalloumiFeedback: any = loadable(
  () => import('../components/HalloumiFeedback'),
);

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function addQualityMarkersPlugin() {
  return function (tree: any) {
    visit(tree, 'element', function (node: any) {
      node.children?.forEach((child: any, cidx: any) => {
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
    visit(tree, 'text', function (node: any, idx: any, parent: any) {
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

export function addHalloumiContext(doc: any, text: string) {
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
  const sources: any = { web: 'Website', file: 'File' };

  const sourceType = doc.source_type
    ? sources[doc.source_type] || capitalize(doc.source_type)
    : '';

  const header = `${docIndex}${doc.semantic_identifier}${
    sourceType ? `\nSource: ${sourceType}` : ''
  }${updatedDate ? `\nUpdated: ${updatedDate}` : ''}`;

  return `${header}\n${text}`;
}

function mapToolDocumentsToText(message: any) {
  if (!message?.toolCall?.tool_result) {
    return {};
  }

  const toolResult = message.toolCall.tool_result;

  if (Array.isArray(toolResult)) {
    return toolResult.reduce((acc: Record<string, string>, doc: any) => {
      if (doc.document_id && doc.content) {
        acc[doc.document_id] = doc.content;
      }
      return acc;
    }, {});
  }

  return {};
}

function getContextSources(
  message: any,
  sources: any,
  qualityCheckContext: any,
) {
  const documentIdToText = mapToolDocumentsToText(message);

  return qualityCheckContext === 'citations'
    ? sources.map((doc: any) => ({
        ...doc,
        id: doc.document_id,
        text: documentIdToText[doc.document_id] || '',
        halloumiContext: addHalloumiContext(
          doc,
          documentIdToText[doc.document_id] || '',
        ),
      }))
    : (message.toolCalls || []).reduce(
        (acc: any, cur: any) => [
          ...acc,
          ...(cur.tool_result || []).map((doc: any) => ({
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

function getScoreDetails(claims: any, qualityCheckStages: any) {
  const score = (
    (claims.length > 0
      ? claims.reduce((acc: any, { score }: any) => acc + score, 0) /
        claims.length
      : 1) * 100
  ).toFixed(0);

  const scoreStage = qualityCheckStages?.find(
    ({ start, end }: any) => start <= score && score <= end,
  );
  const isFirstScoreStage =
    qualityCheckStages?.reduce(
      (acc: any, { start, end }: any, curIx: any) =>
        start <= score && score <= end ? curIx : acc,
      -1,
    ) ?? -1;
  const scoreColor = scoreStage?.color || 'black';
  return { score, scoreStage, isFirstScoreStage, scoreColor };
}

export function AIMessage({
  message,
  isLoading,
  libs,
  onChoice,
  onFetchRelatedQuestions,
  enableFeedback,
  feedbackReasons,
  qualityCheck,
  qualityCheckStages,
  qualityCheckContext,
  qualityCheckEnabled,
  noSupportDocumentsMessage,
  totalFailMessage,
  isFetchingRelatedQuestions = false,
  enableShowTotalFailMessage,
  enableMatomoTracking,
  persona,
  maxContextSegments,
  isLastMessage,
  className = '',
  chatWindowRef,
  chatWindowEndRef,
  showTools,
}: ChatMessageProps) {
  const [allToolsDisplayed, setAllToolsDisplayed] = useState(false);
  const [messageDisplayed, setMessageDisplayed] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showSourcesSidebar, setShowSourcesSidebar] = useState(false);
  // Halloumi
  const [forceHalloumi, setForceHallomi] = useState(qualityCheck === 'enabled');
  const [verificationTriggered, setVerificationTriggered] = useState(false);
  const [isMessageVerified, setIsMessageVerified] = useState(false);

  useScrollonStream({
    containerRef: chatWindowRef,
    bottomRef: chatWindowEndRef,
    isStreaming: isLoading || !messageDisplayed || isFetchingRelatedQuestions,
  });

  const {
    groupedPackets = [],
    toolPackets = [],
    displayPackets = [],
    citations = {},
    documents = [],
    relatedQuestions,
    isComplete = false,
    error,
  } = message;

  // Separate tool groups from display groups
  const toolGroups = useMemo(() => {
    return groupedPackets.filter((group) => toolPackets.includes(group.ind));
  }, [groupedPackets, toolPackets]);

  const displayGroups = useMemo(() => {
    return groupedPackets.filter((group) => displayPackets.includes(group.ind));
  }, [groupedPackets, displayPackets]);

  // Build sources from citations
  const inverseMap = useMemo(
    () =>
      Object.entries(citations).reduce(
        (acc, [k, v]) => {
          return { ...acc, [v]: k };
        },
        {} as Record<string, string>,
      ),
    [citations],
  );

  const sources = useMemo(
    () =>
      Object.values(citations).map((doc_id) => {
        const doc = documents?.find((doc: any) => doc.document_id === doc_id);
        return {
          ...(doc || {}),
          index: inverseMap[doc_id],
        };
      }),
    [citations, documents, inverseMap],
  );

  const showSources = messageDisplayed && sources.length > 0;

  const contextSources = getContextSources(
    message,
    sources,
    qualityCheckContext,
  );

  const stableContextSources = useDeepCompareMemoize(contextSources);

  const doQualityControl =
    messageDisplayed &&
    qualityCheck &&
    qualityCheck !== 'disabled' &&
    forceHalloumi &&
    showSources &&
    (qualityCheckEnabled || verificationTriggered) &&
    message.messageId &&
    message.messageId > -1;

  const { markers, isLoadingHalloumi, retryHalloumi }: any = useQualityMarkers(
    doQualityControl,
    addCitations(message.message, message),
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
    messageDisplayed &&
    sources.length > 0 &&
    !isFetching &&
    !markers &&
    (qualityCheck === 'ondemand' ||
      (qualityCheck === 'ondemand_toggle' && !qualityCheckEnabled));

  const showTotalFailMessage =
    messageDisplayed &&
    sources.length === 0 &&
    !isFetching &&
    enableShowTotalFailMessage;

  useEffect(() => {
    if (isFetchingRelatedQuestions || typeof relatedQuestions !== 'undefined') {
      return;
    }
    if (messageDisplayed && isComplete && onFetchRelatedQuestions) {
      onFetchRelatedQuestions();
    }
  }, [
    messageDisplayed,
    relatedQuestions,
    isComplete,
    onFetchRelatedQuestions,
    isFetchingRelatedQuestions,
  ]);

  useEffect(() => {
    if (qualityCheck === 'ondemand_toggle' && qualityCheckEnabled) {
      setForceHallomi(true);
    } else {
      setForceHallomi(false);
    }
  }, [qualityCheck, qualityCheckEnabled]);

  useEffect(() => {
    if (markers?.claims?.length > 0) {
      setIsMessageVerified(true);
    }
  }, [markers]);

  // Answer tab content
  const answerTab = (
    <div className="answer-tab">
      {/* Show first 3 sources inline */}
      {showSources && (
        <div className="sources">
          {sources.slice(0, 3).map((source: any, i: number) => (
            <SourceDetails source={source} key={i} index={source.index} />
          ))}

          {sources.length > 3 && (
            <Button
              className="source show-all-sources-btn"
              onClick={() => setShowSourcesSidebar(true)}
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

      {/* Main message content */}
      <div className="message-content">
        {/* Render tools if any */}
        {toolGroups.length > 0 && (
          <MultiToolRenderer
            toolGroups={toolGroups}
            showTools={showTools}
            onAllToolsDisplayed={() => {
              setAllToolsDisplayed(true);
            }}
            message={message}
            libs={libs}
          />
        )}

        {/* Display error message if present */}
        {!!error && (
          <div className="message-error">
            <SemanticMessage color="red" className="error-message">
              <div className="error-title">Error</div>
              <div className="error-content">{error}</div>
            </SemanticMessage>
          </div>
        )}

        {/* Display normal content if no error or if we have content to display alongside the error */}
        {(allToolsDisplayed || toolGroups.length === 0) &&
          !error &&
          displayGroups.map((group) => (
            <div key={group.ind} className="message-display-group">
              <RendererComponent
                packets={group.packets}
                onComplete={() => setMessageDisplayed(true)}
                animate={!messageDisplayed}
                stopPacketSeen={isComplete}
                message={message}
                libs={libs}
                markers={markers}
                stableContextSources={stableContextSources}
                addQualityMarkersPlugin={addQualityMarkersPlugin}
              >
                {({ content }) => (
                  <div className="message-text-wrapper">{content}</div>
                )}
              </RendererComponent>
            </div>
          ))}
      </div>

      {/* Total fail message */}
      {showTotalFailMessage && (
        <SemanticMessage color="red">
          {serializeNodes(totalFailMessage)}
        </SemanticMessage>
      )}

      {/* Halloumi/Quality feedback */}
      {qualityCheck !== 'disabled' && !error && (
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

      {/* User actions toolbar (feedback, copy, etc) */}
      {!isLoading && (
        <UserActionsToolbar
          message={message}
          enableFeedback={enableFeedback}
          feedbackReasons={feedbackReasons}
          enableMatomoTracking={enableMatomoTracking}
          persona={persona}
        />
      )}

      {isFirstScoreStage === -1 && serializeNodes(noSupportDocumentsMessage)}

      {isFetchingRelatedQuestions && isLastMessage && !error && (
        <SemanticMessage color="blue">
          <div className="related-questions-loader">
            Finding related questions...
          </div>
        </SemanticMessage>
      )}

      {/* Related questions */}

      {!error && (
        <RelatedQuestions
          persona={persona}
          message={message}
          isLoading={isLoading}
          onChoice={onChoice}
          enableMatomoTracking={enableMatomoTracking}
        />
      )}
    </div>
  );

  // Tab panes
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
                {sources.map((source: any, i: number) => (
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
    <div className={`comment ${className}`}>
      <div className="circle assistant">
        <SVGIcon name={BotIcon} size={20} color="white" />
      </div>

      <div className="comment-content">
        {/* Main content with tabs or plain */}
        <div className="comment-tabs">
          {showSources && !error ? (
            <>
              <Tab
                activeIndex={activeTab}
                onTabChange={(_, data: any) => setActiveTab(data.activeIndex)}
                menu={{ secondary: true, pointing: true, fluid: true }}
                panes={panes}
              />

              {/* Sources sidebar */}
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
                  <Button basic onClick={() => setShowSourcesSidebar(false)}>
                    <SVGIcon name={ClearIcon} size={24} />
                  </Button>
                </div>
                <div className="sources-listing">
                  {showSources && (
                    <div className="sources">
                      {sources.map((source: any, i: number) => (
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
      </div>
    </div>
  );
}
