import React from 'react';
import { ClaimModal } from './ClaimModal';
import { Citation } from './Citation';
import { transformEmailsToLinks } from '../utils';

export function components(message, markers, citedSources) {
  return {
    table: (props) => {
      const { node, children, ...rest } = props;
      return (
        <table className="ui celled table" {...rest}>
          {children}
        </table>
      );
    },
    span: (props) => {
      const { node, ...rest } = props;
      const child = node.children[0];
      let claim;

      // identifies if the current text belongs to a claim
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
        <ClaimModal
          claim={claim}
          markers={markers}
          text={rest.children}
          citedSources={citedSources}
        />
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
