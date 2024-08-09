import React from 'react';
import loadable from '@loadable/component';
import { Citation } from './Citation';
import { SourceDetails } from './Source';
import { transformEmailsToLinks } from './utils';

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

const CITATION_MATCH = /\[\d+\](?![[(\])])/gm;

function addCitations(text) {
  return text.replaceAll(CITATION_MATCH, (match) => {
    const number = match.match(/\d+/)[0];
    return `${match}(${number})`;
  });
}

export function ChatMessageBubble(props) {
  const { message, isLoading, isMostRecent, libs } = props;
  const { remarkGfm } = libs; // , rehypePrism
  const { citations = {}, documents } = message;

  const showLoader = isMostRecent && isLoading;
  const colorClassName =
    message.type === 'user' ? 'bg-lime-300' : 'bg-slate-50 text-black';
  const alignmentClassName = message.role === 'user' ? 'ml-auto' : 'mr-auto';

  // const icon =
  //   message.role === 'user' ? (
  //     <UserIcon />
  //   ) : showLoader ? (
  //     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  //   ) : (
  //     <BotIcon />
  //   );

  const sources = Object.keys(citations).map((index) => documents[index]);

  return (
    <div className={`${alignmentClassName} ${colorClassName} `}>
      {/* <div className="mr-2">{icon}</div> */}
      <div>
        <Markdown components={components(message)} remarkPlugins={[remarkGfm]}>
          {addCitations(message.message)}
        </Markdown>

        {!showLoader && sources.length ? (
          <>
            <h5>Sources:</h5>

            <div className="sources">
              {sources.map((source, i) => (
                <SourceDetails source={source} key={i} index={i} />
              ))}
            </div>
          </>
        ) : (
          ''
        )}
      </div>
    </div>
  );
}
