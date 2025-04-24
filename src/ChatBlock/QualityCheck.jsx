import React from 'react';

async function fetchHalloumi(context, sources) {
  const halloumiResponse = await fetch('/_ha/classify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ context, sources }),
  });
  return halloumiResponse;
}

export function QualityCheck(props) {
  const { message, sources } = props;

  const [hasHalloumiCheck, setHasHalloumiCheck] = React.useState(false);

  React.useEffect(() => {
    if (!hasHalloumiCheck) {
      setHasHalloumiCheck(true);
      console.log({ message, sources });
      const feedback = fetchHalloumi(message, sources);
    }
  }, [hasHalloumiCheck, message, sources]);

  return <div></div>;
}
