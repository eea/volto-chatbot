import React from 'react';
import visit from 'unist-util-visit';
import loadable from '@loadable/component';
import {
  Icon,
  Button,
  Popup,
  PopupHeader,
  PopupContent,
} from 'semantic-ui-react';
import { Citation } from './Citation';
import { SourceDetails } from './Source';
import { SVGIcon, transformEmailsToLinks, useCopyToClipboard } from './utils';
import ChatMessageFeedback from './ChatMessageFeedback';
import useQualityMarkers from './useQualityMarkers';
import { useDeepCompareMemoize } from './useDeepCompareMemoize';
import { getSupportedBgColor } from './colors';
import './colors.css';

import BotIcon from './../icons/bot.svg';
import UserIcon from './../icons/user.svg';
// import { QualityCheck } from './QualityCheck';

const CITATION_MATCH = /\[\d+\](?![[(\])])/gm;

const Markdown = loadable(() => import('react-markdown'));

function convertToPercentage(floatValue) {
  if (floatValue < 0 || floatValue > 1) {
    return 0;
  }
  return (floatValue * 100).toFixed(2) + '%';
}

function ClaimCitations(props) {
  const { ids, citations, citedSources } = props;
  const joinedSources = citedSources.join('\n---\n');
  return (
    <div>
      {(ids || [])
        .map((id) => citations[id])
        .map((cit) => (
          <small key={cit.id}>
            {joinedSources.slice(cit.startOffset, cit.endOffset)}
          </small>
        ))}
    </div>
  );
}

const components = (message, markers, citedSources) => {
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
        <Popup
          trigger={
            <span className={getSupportedBgColor(claim.score)}>
              {rest.children}
            </span>
          }
        >
          <PopupHeader>{convertToPercentage(claim.score)}</PopupHeader>
          <PopupContent>{claim.rationale}</PopupContent>
          <ClaimCitations
            ids={claim.citationIds}
            citations={markers?.citations || []}
            citedSources={citedSources}
          />
        </Popup>
      ) : (
        <span>{rest.children}</span>
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
};

function addCitations(text) {
  return text.replaceAll(CITATION_MATCH, (match) => {
    const number = match.match(/\d+/)[0];
    return `${match}(${number})`;
  });
}

export function ToolCall({ tool_args, tool_name, tool_result }) {
  if (tool_name === 'run_search') {
    return (
      <div className="tool_info">
        Searched for: <em>{tool_args?.query || ''}</em>
      </div>
    );
  }
  return null;
}

export function ChatMessageBubble(props) {
  const {
    message,
    isLoading,
    isMostRecent,
    libs,
    onChoice,
    showToolCalls,
    enableFeedback,
    feedbackReasons,
  } = props;
  const { remarkGfm } = libs; // , rehypePrism
  const { citations = {}, documents, type } = message;
  const isUser = type === 'user';
  const [copied, handleCopy] = useCopyToClipboard(message.message);

  const icon = isUser ? (
    <div className="circle user">
      <SVGIcon name={UserIcon} size="20" color="white" />
    </div>
  ) : (
    <div className="circle assistant">
      <SVGIcon name={BotIcon} size="20" color="white" />
    </div>
  );

  const sources = Object.values(citations).map((doc_id) =>
    documents.find((doc) => doc.db_doc_id === doc_id),
  );
  const showLoader = isMostRecent && isLoading;
  const showSources = !showLoader && sources.length > 0;
  const citedDocuments = message.toolCalls?.reduce((acc, cur) => {
    return {
      ...acc,
      ...Object.assign(
        {},
        {},
        ...(cur.tool_result || []).map((doc) => ({
          [doc.document_id]: doc.content,
        })),
      ),
    };
  }, {});
  const citedSources = useDeepCompareMemoize(
    sources.map((doc) => citedDocuments[doc.document_id] || ''),
  );
  const doQualityControl = showSources && message.messageId > -1;
  const markers = useQualityMarkers(
    doQualityControl,
    message.message,
    citedSources,
  );

  const inverseMap = Object.entries(citations).reduce((acc, [k, v]) => {
    return { ...acc, [v]: k };
  }, {});

  const addQualityMarkers = React.useCallback(() => {
    return function (tree, file) {
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
  }, []);

  return (
    <div>
      <div className="comment">
        {icon}

        <div>
          {showToolCalls &&
            message.toolCalls?.map((info, index) => (
              <ToolCall key={index} {...info} />
            ))}
          <Markdown
            components={components(message, markers, citedSources)}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[addQualityMarkers]}
          >
            {addCitations(message.message)}
          </Markdown>
          {/* {showSources && message.messageId > -1 && ( */}
          {/*   <QualityCheck message={message.message} sources={citedSources} /> */}
          {/* )} */}

          {!isUser && !isLoading && (
            <div className="message-actions">
              <Button
                basic
                onClick={() => handleCopy()}
                title="Copy"
                aria-label="Copy"
                disabled={copied}
              >
                <Icon name={copied ? 'check' : 'copy outline'} />
              </Button>

              {enableFeedback && (
                <>
                  <ChatMessageFeedback
                    message={message}
                    feedbackReasons={feedbackReasons}
                  />
                </>
              )}
            </div>
          )}

          {showSources && (
            <>
              <h5>Sources:</h5>

              <div className="sources">
                {sources.map((source, i) => (
                  <SourceDetails
                    source={source}
                    key={i}
                    index={inverseMap[source.db_doc_id]}
                  />
                ))}
              </div>
            </>
          )}

          {message.relatedQuestions?.length > 0 && (
            <>
              <h5>Related Questions:</h5>
              <div className="chat-related-questions">
                {message.relatedQuestions?.map(({ question }) => (
                  <div
                    className="relatedQuestionButton"
                    role="button"
                    onClick={() => !isLoading && onChoice(question)}
                    onKeyDown={() => !isLoading && onChoice(question)}
                    tabIndex="-1"
                  >
                    {question}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
