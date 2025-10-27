import React from 'react';
import loadable from '@loadable/component';

const Sentry = loadable.lib(
  () => import(/* webpackChunkName: "s_entry-browser" */ '@sentry/browser'), // chunk name avoids ad blockers
);

async function fetchHalloumi(answer, sources, maxContextSegments) {
  const halloumiResponse = await fetch('/_ha/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ answer, sources, maxContextSegments }),
  });
  return halloumiResponse;
}

const FAILURE_RATIONALE = 'Answer cannot be verified due to empty sources.';
const TOOLARGE_RATIONALE = 'Verification failed: Too many sources provided.';
const TIMEOUT_RATIONALE =
  'Verification failed: Halloumi service is unreachable or timed out.';

const empty = (message, rationale, score = 0) => ({
  claims: [
    {
      startOffset: 0,
      endOffset: message.length,
      score,
      rationale,
    },
  ],
  segments: {},
});

export default function useQualityMarkers(
  doQualityControl,
  message,
  sources,
  maxContextSegments = 0,
) {
  const [halloumiResponse, setHalloumiResponse] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const retryHalloumi = React.useCallback(() => {
    setHalloumiResponse(null);
  }, []);

  React.useEffect(() => {
    async function handler() {
      const textSources = sources.map(({ halloumiContext }) => halloumiContext);
      if (sources.length === 0) {
        setHalloumiResponse(empty(message, FAILURE_RATIONALE));
        return;
      }

      // // console.log('Halloumi sources:', sources.length, sources);
      // if (sources.length > 40) {
      //   // eslint-disable-next-line no-console
      //   console.warn(
      //     `Warning: Too many sources (${sources.length}). Skipping quality control.`,
      //   );
      //
      //   setHalloumiResponse(empty(message, TOOLARGE_RATIONALE));
      //   return;
      // }

      setIsLoading(true);

      try {
        const feedback = await fetchHalloumi(
          message,
          textSources,
          maxContextSegments,
        );
        const body = await feedback.json();
        // console.log({ message, sources, body });

        if (body.error) {
          setHalloumiResponse(empty(message, TIMEOUT_RATIONALE, null));
          Sentry.load().then((mod) => mod.captureException(body.error));
        } else {
          setHalloumiResponse(body);
        }
      } catch {
        setHalloumiResponse(empty(message, TIMEOUT_RATIONALE, null));
        throw new Error(`Unknown error fetching halloumi response`);
      } finally {
        setIsLoading(false);
      }
    }

    if (doQualityControl && !halloumiResponse) {
      handler();
    }
  }, [
    doQualityControl,
    halloumiResponse,
    message,
    sources,
    maxContextSegments,
  ]);

  if (halloumiResponse !== null) {
    halloumiResponse.claims = halloumiResponse.claims.filter((claim) => {
      const claim_text = message.substring(claim.startOffset, claim.endOffset);
      const hasSpace = claim_text.trim().includes(' ');
      const hasSpecialCharacters = /[^a-zA-Z0-9 ]/.test(claim_text);
      const hasSmallScore = claim.score < 0.07;

      return hasSpace || !hasSpecialCharacters || !hasSmallScore;
    });
  }
  return {
    markers: halloumiResponse,
    isLoadingHalloumi: isLoading,
    retryHalloumi,
  };
}
