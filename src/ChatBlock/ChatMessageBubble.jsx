import React from 'react';
import visit from 'unist-util-visit';
import loadable from '@loadable/component';
import {
  Icon,
  Button,
  Message,
  MessageContent,
  // Loader,
  // Segment,
} from 'semantic-ui-react';
import { SourceDetails } from './Source';
import { SVGIcon, useCopyToClipboard } from './utils';
import ChatMessageFeedback from './ChatMessageFeedback';
import useQualityMarkers from './useQualityMarkers';
import Spinner from './Spinner';
import { useDeepCompareMemoize } from './useDeepCompareMemoize';
import { components } from './MarkdownComponents';
import { serializeNodes } from '@plone/volto-slate/editor/render';

import BotIcon from './../icons/bot.svg';
import UserIcon from './../icons/user.svg';

const CITATION_MATCH = /\[\d+\](?![[(\])])/gm;

const Markdown = loadable(() => import('react-markdown'));

// TODO: don't use this over the text like this, make it a rehype plugin
function addCitations(text) {
  return text.replaceAll(CITATION_MATCH, (match) => {
    const number = match.match(/\d+/)[0];
    return `${match}(${number})`;
  });
}

export function ToolCall({ tool_args, tool_name }) {
  // , tool_result
  if (tool_name === 'run_search') {
    return (
      <div className="tool_info">
        Searched for: <em>{tool_args?.query || ''}</em>
      </div>
    );
  }
  return null;
}

function addQualityMarkersPlugin() {
  return function (tree) {
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

function visitTextNodes(node, visitor) {
  if (Array.isArray(node)) {
    node.forEach((child) => visitTextNodes(child, visitor));
  } else if (node && typeof node === 'object') {
    if (node.text !== undefined) {
      // Process the text node value here
      // console.log(node.text);
      visitor(node);
    }
    if (node.children) {
      visitTextNodes(node.children, visitor);
    }
  }
}

function printSlate(value, score) {
  if (typeof value === 'string') {
    return value.replaceAll('{score}', score);
  }
  function visitor(node) {
    if (node.text.indexOf('{score}') > -1) {
      node.text = node.text.replaceAll('{score}', score);
    }
  }

  visitTextNodes(value, visitor);
  return serializeNodes(value);
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
    qualityCheck,
    qualityCheckStages,
    qualityCheckContext,
    isFetchingRelatedQuestions,
  } = props;
  const { remarkGfm } = libs; // , rehypePrism
  const { citations = {}, documents = [], type } = message;
  const isUser = type === 'user';
  const [copied, handleCopy] = useCopyToClipboard(message.message);
  const [forceHalloumi, setForceHallomi] = React.useState(
    qualityCheck === 'enabled' ? true : false,
  );

  const inverseMap = Object.entries(citations).reduce((acc, [k, v]) => {
    return { ...acc, [v]: k };
  }, {});

  const sources = Object.values(citations).map((doc_id) => ({
    ...(documents.find((doc) => doc.db_doc_id === doc_id) || {}),
    index: inverseMap[doc_id],
  }));
  const showLoader = isMostRecent && isLoading;
  const showSources = !showLoader && sources.length > 0;

  // TODO: maybe this should be just on the first tool call?
  const documentIdToText = message.toolCalls?.reduce((acc, cur) => {
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
  // console.log({ qualityCheckContext });

  const contextSources =
    qualityCheckContext === 'citations'
      ? sources.map((doc) => ({
          ...doc,
          id: doc.document_id,
          text: documentIdToText[doc.document_id] || '',
        }))
      : (message.toolCalls || []).reduce(
          (acc, cur) => [
            ...acc,
            ...(cur.tool_result || []).map((doc) => ({
              ...doc,
              id: doc.document_id,
              text: doc.content,
            })),
          ], // TODO: make sure we don't add multiple times the same doc
          // TODO: this doesn't have the index for source
          [],
        );

  const stableContextSources = useDeepCompareMemoize(contextSources);

  const doQualityControl =
    !isUser &&
    qualityCheck &&
    qualityCheck !== 'disabled' &&
    forceHalloumi &&
    showSources &&
    message.messageId > -1;
  const { markers, isLoadingHalloumi } = useQualityMarkers(
    doQualityControl,
    addCitations(message.message),
    stableContextSources,
  );
  // console.log({ message, sources, documentIdToText, citedSources });

  const claims = markers?.claims || [];
  const score = (
    (claims.length > 0
      ? claims.reduce((acc, { score }) => acc + score, 0) / claims.length
      : 1) * 100
  ).toFixed(0);

  const scoreStage = qualityCheckStages?.find(
    ({ start, end }) => start <= score && score <= end,
  );
  const scoreColor = scoreStage?.color || 'black';
  const halloumiMessage = (doQualityControl && scoreStage?.label) || '';

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
              <ToolCall key={index} {...info} />
            ))}
          <Markdown
            components={components(message, markers, stableContextSources)}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[addQualityMarkersPlugin]}
          >
            {addCitations(message.message)}
          </Markdown>

          {!isUser && (
            <>
              {!isLoadingHalloumi &&
                !isLoading &&
                qualityCheck === 'ondemand' &&
                !markers && (
                  <Button onClick={() => setForceHallomi(true)}>
                    <i class="ri-spy-line"></i> Verify AI claims
                  </Button>
                )}
              {isLoadingHalloumi && (
                <Message color="blue">Verifying AI claims...</Message>
              )}
              {!!halloumiMessage && !!markers && (
                <Message color={scoreColor} icon>
                  {/* {!!scoreStage.icon && ( */}
                  {/*   <Icon name={scoreStage.icon} color={scoreColor} /> */}
                  {/* )} */}
                  {/* <strong>{score}%</strong> */}

                  <MessageContent>
                    {printSlate(halloumiMessage, `${score}%`)}
                  </MessageContent>
                </Message>
              )}
            </>
          )}
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
                  <SourceDetails source={source} key={i} index={source.index} />
                ))}
              </div>
            </>
          )}

          {isFetchingRelatedQuestions && (
            <div style={{ display: 'flex' }}>
              <Spinner />
              Finding related questions...
            </div>
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
