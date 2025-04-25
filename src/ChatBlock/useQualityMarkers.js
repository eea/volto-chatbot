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

export default function useQualityMarkers(doQualityControl, message, sources) {
  const [halloumiResponse, setHalloumiResponse] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    async function handler() {
      const textSources = sources.map(({ text }) => text);
      setIsLoading(true);
      const feedback = await fetchHalloumi(message, textSources);
      const body = await feedback.json();
      // console.log({ message, sources, body });
      setHalloumiResponse(body);
      setIsLoading(false);
    }

    if (doQualityControl && !halloumiResponse) {
      handler();
    }
  }, [doQualityControl, halloumiResponse, message, sources]);

  return { markers: halloumiResponse, isLoadingHalloumi: isLoading };
}
