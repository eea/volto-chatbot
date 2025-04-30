import React from 'react';

import { convertToPercentage, transformEmailsToLinks } from './utils';
import { Modal, ModalContent } from 'semantic-ui-react';
import { Citation } from './Citation';
import { getSupportedBgColor, getSupportedTextColor } from './colors';
import { SourceDetails } from './Source';

import './colors.less';

export function ClaimCitations(props) {
  const { ids, citations, citedSources } = props;
  const joinedSources = citedSources.map(({ text }) => text).join('\n---\n');
  const snippets = (ids || [])
    .map((id) => citations[id])
    .map((cit) => {
      const text = joinedSources.slice(cit.startOffset, cit.endOffset);
      const source = citedSources.find((cit) => cit.text.indexOf(text) > -1);
      return {
        ...cit,
        text,
        source_id: source?.id,
      };
    });
  // console.log('snips', snippets);
  //
  // const sourcesIds = snippets.reduce(
  //   (acc, cur) =>
  //     cur.source_id && acc.indexOf(cur.source_id) === -1
  //       ? [...acc, cur.source_id]
  //       : acc,
  //   [],
  // );

  // const x = <div>
  //
  //               {sources.map((source, i) => (
  //                 <SourceDetails
  //                   source={source}
  //                   key={i}
  //                   index={source.index}
  //                 />
  //               ))}
  //
  // </div>

  return (
    <div>
      {snippets.map((snip, ix) => (
        <p key={ix}>
          <a href={snip.source_id}>Source</a> <small>{snip.text}</small>
        </p>
      ))}
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
