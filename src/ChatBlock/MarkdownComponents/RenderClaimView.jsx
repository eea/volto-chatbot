export const RenderClaimView = ({
  contextText,
  value,
  visibleSegmentId,
  segmentContainerRef,
  spanRefs,
  sourceStartIndex = 0,
  segments = [],
}) => {
  const sortedSegments = segments.sort((a, b) => a.startOffset - b.startOffset);

  const segmentSpans = sortedSegments.map((segment, ind) => {
    const isSelectedSegment = segment.id === visibleSegmentId;
    const Tag = isSelectedSegment ? 'mark' : 'span';
    return (
      <span
        key={ind}
        ref={(el) => {
          if (el) spanRefs.current[segment.id] = el;
        }}
      >
        <Tag>
          {contextText.slice(segment.startOffset, segment.endOffset)}
          <sup>{segment.id}</sup>
        </Tag>
      </span>
    );
  });

  let startIndex = sourceStartIndex;
  let currentInd = startIndex;
  let currentKey = segments.length;
  const allSpans = [];

  while (currentInd < startIndex + value.length) {
    const ix = currentInd;
    const nextSegment = sortedSegments.findIndex(
      (segment) => segment.startOffset === ix,
    );
    if (nextSegment >= 0) {
      // Push our current text before the segment starts.
      if (startIndex < currentInd) {
        allSpans.push(
          <span key={currentKey}>
            {value.slice(
              startIndex - sourceStartIndex,
              currentInd - sourceStartIndex,
            )}
          </span>,
        );
        currentKey++;
      }
      allSpans.push(segmentSpans[nextSegment]);
      currentInd = sortedSegments[nextSegment].endOffset;
      startIndex = currentInd;
    } else {
      currentInd++;
    }
  }
  // Push the remaining text.
  if (startIndex < currentInd) {
    allSpans.push(
      <span key={currentKey}>
        {value.slice(
          startIndex - sourceStartIndex,
          currentInd - sourceStartIndex,
        )}
      </span>,
    );
  }

  return (
    <div className="citation-text" ref={segmentContainerRef}>
      {allSpans}
    </div>
  );
};
