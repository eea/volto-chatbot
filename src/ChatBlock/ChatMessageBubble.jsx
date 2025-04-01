import loadable from '@loadable/component';
import React from 'react';

import { Citation } from './Citation';
import { SourceDetails } from './Source';
import { SVGIcon, transformEmailsToLinks } from './utils';

import BotIcon from './../icons/bot.svg';
import UserIcon from './../icons/user.svg';

const CITATION_MATCH = /\[\d+\](?![[(\])])/gm;

const Markdown = loadable(() => import('react-markdown'));

const components = (message) => {
  return {
    a: (props) => {
      const { node, ...rest } = props;
      const value = rest.children;

      if (value?.toString().startsWith('*')) {
        return (
          <div className="flex-none bg-background-800 inline-block rounded-full h-3 w-3 ml-2" />
        );
      } else {
        return (
          <Citation link={rest?.href} value={value} message={message}>
            {rest.children}
          </Citation>
        );
      }
    },
    p: ({ node, ...props }) => {
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
  // eslint-disable-next-line no-console
  // console.log('tool call', { tool_args, tool_name, tool_result });
  return (
    <div className="tool_info">
      Searched for: <em>{tool_args?.query || ''}</em>
    </div>
  );
}

export function ChatMessageBubble(props) {
  const { message, isLoading, isMostRecent, libs, onChoice, showToolCalls } =
    props;
  const { remarkGfm } = libs; // , rehypePrism
  const { citations = {}, documents, type } = message;
  const isUser = type === 'user';

  const showLoader = isMostRecent && isLoading;

  // TODO: these classes are not actually used, remove them
  // const colorClassName = isUser ? 'bg-lime-300' : 'bg-slate-50';
  // const alignmentClassName = isUser ? 'ml-auto' : 'mr-auto';

  const icon = isUser ? (
    <div className="circle user">
      <SVGIcon name={UserIcon} size="20" color="white" />
    </div>
  ) : (
    <div className="circle assistant">
      <SVGIcon name={BotIcon} size="20" color="white" />
    </div>
  );

  // For some reason the list is shifted by one. It's all weird
  // const sources = Object.keys(citations).map(
  //   (index) => documents[(parseInt(index) - 1).toString()],
  // );

  const sources = Object.values(citations).map((doc_id) =>
    documents.find((doc) => doc.db_doc_id === doc_id),
  );

  const inverseMap = Object.entries(citations).reduce((acc, [k, v]) => {
    return { ...acc, [v]: k };
  }, {});

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
            components={components(message)}
            remarkPlugins={[remarkGfm]}
          >
            {addCitations(message.message)}
          </Markdown>

          {!showLoader && sources.length > 0 && (
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
            <div className="chat-related-questions">
              <h5>Related Questions:</h5>
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
          )}
        </div>
      </div>
    </div>
  );
}
