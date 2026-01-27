import React from 'react';
import { dequal } from 'dequal';

export function useDeepCompareMemoize(dependencies) {
  const dependenciesRef = React.useRef(dependencies);
  const signalRef = React.useRef(0);

  if (!dequal(dependencies, dependenciesRef.current)) {
    dependenciesRef.current = dependencies;
    signalRef.current += 1;
  }

  const currentSignal = signalRef.current;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useMemo(() => dependenciesRef.current, [currentSignal]);
}
