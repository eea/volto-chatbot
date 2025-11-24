import { useRef, useEffect } from 'react';
import type { RefObject, MutableRefObject } from 'react';

interface UseScrollOnStreamArgs {
  isStreaming: boolean;
  scrollableDivRef: RefObject<HTMLElement>;
  scrollDist: MutableRefObject<number>;
  endDivRef: RefObject<HTMLElement>;
  distance: number;
  debounce: number;
}

export function useScrollonStream({
  isStreaming,
  scrollableDivRef,
  scrollDist,
  endDivRef,
  distance,
  debounce,
}: UseScrollOnStreamArgs): void {
  const preventScrollInterference = useRef(false);
  const preventScroll = useRef(false);
  const blockActionRef = useRef(false);
  const previousScroll = useRef(0);

  useEffect(() => {
    if (isStreaming && scrollableDivRef && scrollableDivRef.current) {
      let newHeight = scrollableDivRef.current?.scrollTop;
      const heightDifference = newHeight - previousScroll.current;
      previousScroll.current = newHeight;

      // Prevent streaming scroll
      if (heightDifference < 0 && !preventScroll.current) {
        scrollableDivRef.current.style.scrollBehavior = 'auto';
        // scrollableDivRef.current.scrollTop = scrollableDivRef.current.scrollTop;
        scrollableDivRef.current.style.scrollBehavior = 'smooth';
        preventScrollInterference.current = true;
        preventScroll.current = true;

        setTimeout(() => {
          preventScrollInterference.current = false;
        }, 2000);
        setTimeout(() => {
          preventScroll.current = false;
        }, 10000);
      }

      // Ensure can scroll if scroll down
      else if (!preventScrollInterference.current) {
        preventScroll.current = false;
      }
      if (
        scrollDist.current < distance &&
        !blockActionRef.current &&
        !preventScroll.current &&
        endDivRef &&
        endDivRef.current
      ) {
        // catch up if necessary!
        const scrollAmount = scrollDist.current + 10000;
        if (scrollDist.current > 140) {
          endDivRef.current.scrollIntoView();
        } else {
          blockActionRef.current = true;

          scrollableDivRef?.current &&
            scrollableDivRef.current.scrollBy({
              left: 0,
              top: Math.max(0, scrollAmount),
              behavior: 'smooth',
            });

          setTimeout(() => {
            blockActionRef.current = false;
          }, debounce);
        }
      }
    }
  });

  // scroll on end of stream if within distance
  useEffect(() => {
    if (scrollableDivRef?.current && !isStreaming) {
      if (scrollDist.current < distance) {
        scrollableDivRef?.current &&
          scrollableDivRef.current.scrollBy({
            left: 0,
            top: Math.max(scrollDist.current + 600, 0),
            behavior: 'smooth',
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming]);
}
