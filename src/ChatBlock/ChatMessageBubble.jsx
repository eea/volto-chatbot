import loadable from '@loadable/component';
import React from 'react';
import { Citation } from './Citation';
import { SourceDetails } from './Source';
import { Icon, Divider, Button } from 'semantic-ui-react';
const Markdown = loadable(() => import('react-markdown'));

const components = {
  a: (props) => {
    const { node, ...rest } = props;
    const value = rest.children;

    if (value?.toString().startsWith('*')) {
      return (
        <div className="flex-none bg-background-800 inline-block rounded-full h-3 w-3 ml-2" />
      );
    } else if (value?.toString().startsWith('[')) {
      // for some reason <a> tags cause the onClick to not apply
      // and the links are unclickable
      // TODO: fix the fact that you have to double click to follow link
      // for the first link
      return (
        <Citation link={rest?.href} key={node?.position?.start?.offset}>
          {rest.children}
        </Citation>
      );
    } else {
      return (
        <sup>
          <Button
            basic
            key={node?.position?.start?.offset}
            onClick={() =>
              rest.href ? window.open(rest.href, '_blank') : undefined
            }
            className="cursor-pointer text-link hover:text-link-hover"
          >
            {rest.children}
          </Button>
        </sup>
      );
    }
  },
  // code: (props) => <CodeBlock {...props} content={content} />,
  p: ({ node, ...props }) => <p {...props} className="text-default" />,
};

const CITATION_MATCH = /\[\d+\]/gm;

function addCitations(text) {
  return text.replaceAll(CITATION_MATCH, (match) => {
    const number = match.match(/\d+/)[0];
    return `${match}(#${number})`;
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
    <div
      className={`${alignmentClassName} ${colorClassName} rounded px-4 py-2 max-w-[80%] mb-8 flex`}
    >
      {/* <div className="mr-2">{icon}</div> */}
      <div className="whitespace-pre-wrap flex flex-col">
        <Markdown components={components} remarkPlugins={[remarkGfm]}>
          {addCitations(message.message)}
        </Markdown>

        {!showLoader && sources.length ? (
          <>
            <Divider />
            <h5>
              <Icon name="copy outline" /> Sources:
            </h5>
            {sources.map((source, i) => (
              <SourceDetails source={source} key={i} index={i} />
            ))}
          </>
        ) : (
          ''
        )}
      </div>
    </div>
  );
}
