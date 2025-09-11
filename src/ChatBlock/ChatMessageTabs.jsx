import React from 'react';
import loadable from '@loadable/component';
import { Tab, Button, Message } from 'semantic-ui-react';
import { SourceDetails } from './Source';
import { components } from './MarkdownComponents';
import { serializeNodes } from '@plone/volto-slate/editor/render';
import Spinner from './Spinner';
import RelatedQuestions from './RelatedQuestions';
import HalloumiFeedback from './HalloumiFeedback';
import UserActionsToolbar from './UserActionsToolbar';
import { addQualityMarkersPlugin } from './plugins';
import { addCitations } from './utils';

const Markdown = loadable(() => import('react-markdown'));

const ChatMessageTabs = ({
  isUser,
  message,
  markers,
  sources,
  stableContextSources,
  remarkGfm,
  showTotalFailMessage,
  totalFailMessage,
  halloumiMessage,
  isLoadingHalloumi,
  score,
  scoreColor,
  onManualVerify,
  showVerifyClaimsButton,
  enableFeedback,
  feedbackReasons,
  enableMatomoTracking,
  persona,
  noSupportDocumentsMessage,
  isFetchingRelatedQuestions,
  onChoice,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = React.useState(0);

  const answerTab = (
    <div className="answer-tab">
      {sources.length > 0 && (
        <div className="sources">
          {sources.slice(0, 3).map((source, i) => (
            <SourceDetails source={source} key={i} index={source.index} />
          ))}
          {sources.length > 3 && (
            <Button
              className="show-all-sources-btn"
              onClick={() => setActiveTab(1)}
            >
              <div className="source-header">
                <div>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span key={i} className="chat-citation"></span>
                  ))}
                </div>
                <div className="source-title">See all</div>
              </div>
            </Button>
          )}
        </div>
      )}

      <Markdown
        components={components(message, markers, stableContextSources)}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[addQualityMarkersPlugin]}
      >
        {addCitations(message.message)}
      </Markdown>

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
          onManualVerify={onManualVerify}
          showVerifyClaimsButton={showVerifyClaimsButton}
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

      {serializeNodes(noSupportDocumentsMessage)}

      {!isUser && isFetchingRelatedQuestions && (
        <div className="related-questions-loader">
          <Spinner />
          Finding related questions...
        </div>
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

  const sourcesTab = (
    <div className="sources-listing">
      {sources.length > 0 && (
        <div className="sources">
          {sources.map((source, i) => (
            <SourceDetails source={source} key={i} index={source.index} />
          ))}
        </div>
      )}
    </div>
  );

  if (isUser) return answerTab;

  if (sources.length > 3) {
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
        render: () => <Tab.Pane>{sourcesTab}</Tab.Pane>,
      },
    ];

    return (
      <div className="comment-tabs">
        <Tab
          activeIndex={activeTab}
          onTabChange={(_, data) => setActiveTab(data.activeIndex)}
          menu={{ secondary: true, pointing: true, fluid: true }}
          panes={panes}
        />
      </div>
    );
  }

  return answerTab;
};

export default ChatMessageTabs;
