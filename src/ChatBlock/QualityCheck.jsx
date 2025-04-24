import React from 'react';
import { getSupportedBgColor } from './colors';
import './colors.css';
import { useDeepCompareMemoize } from './useDeepCompareMemoize';

async function fetchHalloumi(answer, sources) {
  const halloumiResponse = await fetch('/_ha/generate', {
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
  // console.log({ claimValue, claim });
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
  const stableSources = useDeepCompareMemoize(sources);

  const [halloumiResponse, setHalloumiResponse] = React.useState(null);

  React.useEffect(() => {
    async function handler() {
      const feedback = await fetchHalloumi(message, stableSources);
      const body = await feedback.json();
      console.log({ message, stableSources, body });
      setHalloumiResponse(body);
    }

    if (!halloumiResponse) {
      handler();
    }
  }, [halloumiResponse, message, stableSources]);

  return (
    <div>
      {halloumiResponse && (
        <ClaimBox
          value={message}
          claims={halloumiResponse.claims}
          onClaimClick={() => {}}
        />
      )}
    </div>
  );
}

//     {
//       startOffset: 1306,
//       endOffset: 1480,
//       citationIds: [Array],
//       score: 0.20641613926384872,
//       rationale: 'The document provides a brief description of the case studies, but only one is explicitly mentioned as being relevant to the Apulia region in southern Italy. The other case study is n
// ot clearly linked to the Apulia region.'
//     }
//   ],
//   citations: {
//     '1': { startOffset: 0, endOffset: 55, id: '1' },
//     '2': { startOffset: 55, endOffset: 116, id: '2' },
//     '3': { startOffset: 116, endOffset: 191, id: '3' },
