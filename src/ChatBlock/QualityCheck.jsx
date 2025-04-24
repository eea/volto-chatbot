import React from 'react';
import { getSupportedBgColor } from './colors';

async function fetchHalloumi(answer, sources) {
  const halloumiResponse = await fetch('/_ha/classify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ answer, sources }),
  });
  return halloumiResponse;
}

function generateClaimSpan(
  claim,
  ind,
  value,
  selectedClaim,
  propagateClaimClick,
) {
  const claimValue = value.slice(claim.startOffset, claim.endOffset);
  const trimmedClaim = claimValue.trim();
  const trimStart = claimValue.indexOf(trimmedClaim);
  const trimEnd = trimStart + trimmedClaim.length;
  const leadingWhitespace = claimValue.slice(0, trimStart);
  const trailingWhitespace = claimValue.slice(trimEnd);
  const color = getSupportedBgColor(claim.score);
  const underlineClass = ind === selectedClaim ? 'underline' : '';
  console.log({ claimValue, claim });
  return (
    <span
      tabIndex="-1"
      role="button"
      key={ind}
      onKeyDown={() => propagateClaimClick(ind)}
      onClick={() => propagateClaimClick(ind)}
    >
      {leadingWhitespace}
      <mark
        className={
          color +
          ' mark-rounded cursor-pointer hover:underline ' +
          underlineClass
        }
      >
        {trimmedClaim}
      </mark>
      {trailingWhitespace}
    </span>
  );
}

export function ClaimBox(props) {
  const { selectedClaim, value, onClaimClick, claims = [] } = props;

  const sortedClaims = claims.sort((a, b) => a.startOffset - b.startOffset);
  const claimSpans = sortedClaims.map((claim, ind) =>
    generateClaimSpan(claim, ind, value, selectedClaim, onClaimClick),
  );
  let startIndex = 0;
  let currentInd = 0;
  let currentKey = sortedClaims.length;
  const allSpans = [];
  while (currentInd < value.length) {
    const ind = currentInd;
    const nextClaim = sortedClaims.findIndex(
      (claim) => claim.startOffset === ind,
    );
    if (nextClaim >= 0) {
      // Push our current text before the claim starts.
      if (startIndex < currentInd) {
        allSpans.push(
          <span key={currentKey}>{value.slice(startIndex, currentInd)}</span>,
        );
        currentKey++;
      }
      allSpans.push(claimSpans[nextClaim]);
      currentInd = sortedClaims[nextClaim].endOffset;
      startIndex = currentInd;
    } else {
      currentInd++;
    }
  }
  // Push the remaining text.
  if (startIndex < currentInd) {
    allSpans.push(
      <span key={currentKey}>{value.slice(startIndex, currentInd)}</span>,
    );
  }
  return <div>{allSpans}</div>;
}

export function QualityCheck(props) {
  const { message, sources } = props;

  const [halloumiResponse, setHalloumiResponse] = React.useState(null);

  React.useEffect(() => {
    async function handler() {
      const feedback = await fetchHalloumi(message, sources);
      const body = await feedback.json();
      console.log({ message, sources, body });
      setHalloumiResponse(body);
    }

    if (!halloumiResponse) {
      handler();
    }
  }, [halloumiResponse, message, sources]);

  return (
    <div>
      {halloumiResponse && (
        <ClaimBox value={message} claims={halloumiResponse.claims} />
      )}
    </div>
  );
}
