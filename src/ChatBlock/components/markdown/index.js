import React from 'react';
import { ClaimModal } from './ClaimModal';
import { Citation } from './Citation';
import { transformEmailsToLinks } from '../../utils';

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
    td: (props) => {
      const { node, children, ...rest } = props;
      // Process children to replace <br> strings with actual line breaks
      const processedChildren = React.Children.map(children, (child) => {
        if (typeof child === 'string' && child.includes('<br>')) {
          // Split by <br> and insert actual <br /> elements
          const parts = child.split('<br>');
          return parts.reduce((acc, part, index) => {
            acc.push(part);
            if (index < parts.length - 1) {
              acc.push(<br key={`br-${index}`} />);
            }
            return acc;
          }, []);
        }
        return child;
      });
      return <td {...rest}>{processedChildren}</td>;
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
      const { node, children, href, ...rest } = props;
      const value = children?.toString() || '';

      // Check for blinking dot indicator
      if (value?.startsWith('*')) {
        return <div className="" />;
      }

      // Check if this is a citation pattern [number]
      if (value?.startsWith('[') && value?.endsWith(']')) {
        const match = value.match(/\[(\d+)\]/);
        if (match) {
          // This is a citation - render Citation component
          return (
            <Citation link={href} value={value} message={message}>
              {children}
            </Citation>
          );
        }
      }

      // Regular link - render normal anchor
      const handleClick = (event) => {
        if (href) {
          event.preventDefault();
          window.open(href, '_blank');
        }
      };

      return (
        <a href={href} onClick={handleClick} {...rest}>
          {children}
        </a>
      );
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
