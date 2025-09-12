import React from 'react';
import { Button, Message, MessageContent } from 'semantic-ui-react';
import { serializeNodes } from '@plone/volto-slate/editor/render';
import Spinner from './Spinner';
import { SVGIcon } from './utils';

import GlassesIcon from './../icons/glasses.svg';

const VERIFY_CLAIM_MESSAGES = [
  'Going through each claim and verify against the referenced documents...',
  'Summarising claim verifications results...',
  'Calculating scores...',
];

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

function VerifyClaims() {
  const [message, setMessage] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (message < VERIFY_CLAIM_MESSAGES.length - 1) {
        setMessage(message + 1);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <div className="verify-claims">
      <Spinner />
      {VERIFY_CLAIM_MESSAGES[message]}
    </div>
  );
}

const HalloumiFeedback = ({
  halloumiMessage,
  isLoadingHalloumi,
  markers,
  score,
  scoreColor,
  onManualVerify,
  showVerifyClaimsButton,
  sources,
}) => {
  const noClaimsScore = markers?.claims[0]?.score === null;
  const messageBySource =
    'Please allow a few minutes for claim verification when many references are involved.';

  return (
    <>
      {showVerifyClaimsButton && (
        <div className="halloumi-feedback-button">
          <Button onClick={onManualVerify} className="icon claims-btn">
            <SVGIcon name={GlassesIcon} /> Fact-check AI answer
          </Button>
          <div>
            <span>{messageBySource}</span>{' '}
          </div>
        </div>
      )}

      {isLoadingHalloumi && sources.length > 0 && (
        <Message color="blue">
          <VerifyClaims />
        </Message>
      )}

      {noClaimsScore && (
        <Message color="red">{markers?.claims?.[0].rationale}</Message>
      )}

      {!!halloumiMessage && !!markers && !noClaimsScore && (
        <Message color={scoreColor} icon>
          <MessageContent>
            {printSlate(halloumiMessage, `${score}%`)}
          </MessageContent>
        </Message>
      )}
    </>
  );
};

export default HalloumiFeedback;
