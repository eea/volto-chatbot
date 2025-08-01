import React from 'react';

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

const FAILURE_RATIONALE = 'Answer cannot be verified due to empty sources.';
const TIMEOUT_RATIONALE =
  'Verification failed: Halloumi service is unreachable or timed out.';

export default function useQualityMarkers(doQualityControl, message, sources) {
  const [halloumiResponse, setHalloumiResponse] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    async function handler() {
      const textSources = sources.map(({ halloumiContext }) => halloumiContext);
      if (sources.length === 0) {
        setHalloumiResponse({
          claims: [
            {
              startOffset: 0,
              endOffset: message.length,
              score: 0,
              rationale: FAILURE_RATIONALE,
            },
          ],
          citations: {},
        });
        return;
      }

      setIsLoading(true);

      try {
        const feedback = await fetchHalloumi(message, textSources);
        const body = await feedback.json();
        // console.log({ message, sources, body });

        if (body.error) {
          setHalloumiResponse({
            claims: [
              {
                startOffset: 0,
                endOffset: message.length,
                score: null,
                rationale: TIMEOUT_RATIONALE,
              },
            ],
            citations: {},
          });
        } else {
          setHalloumiResponse(body);
        }
      } catch {
        setHalloumiResponse({
          claims: [
            {
              startOffset: 0,
              endOffset: message.length,
              score: null,
              rationale: TIMEOUT_RATIONALE,
            },
          ],
          citations: {},
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (doQualityControl && !halloumiResponse) {
      handler();
    }
  }, [doQualityControl, halloumiResponse, message, sources]);

  return { markers: halloumiResponse, isLoadingHalloumi: isLoading };
}
