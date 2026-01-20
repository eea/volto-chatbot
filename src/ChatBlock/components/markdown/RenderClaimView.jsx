import React from 'react';

export const RenderClaimView = (props) => {
  const {
    value,
    visibleSegmentId,
    segmentContainerRef,
    spanRefs,
    segments = [],
    sourceStartIndex = 0,
  } = props;

  const sortedSegments = [...segments].sort(
    (a, b) => a.startOffset - b.startOffset,
  );

  const parts = [];
  let lastIndex = 0;

  sortedSegments.forEach((segment) => {
    const segmentStart = segment.startOffset - sourceStartIndex;
    const segmentEnd = segment.endOffset - sourceStartIndex;

    // Add the text part before the current segment
    if (segmentStart > lastIndex) {
      parts.push({
        type: 'text',
        content: value.slice(lastIndex, segmentStart),
      });
    }

    // Add the segment part
    parts.push({
      type: 'segment',
      ...segment,
      content: value.slice(segmentStart, segmentEnd),
    });

    lastIndex = segmentEnd;
  });

  // Add the remaining text part after the last segment
  if (lastIndex < value.length) {
    parts.push({
      type: 'text',
      content: value.slice(lastIndex),
    });
  }

  return (
    <div className="citation-text-container" ref={segmentContainerRef}>
      <div className="citation-text-content">
        {parts.map((part, index) => {
          const endline = part.content.endsWith('\n');
          const content = part.content.split('\n');

          if (part.type === 'segment') {
            const isSelectedSegment = part.id === visibleSegmentId;
            return (
              <React.Fragment key={part.id || index}>
                <span
                  ref={(el) => {
                    if (el) spanRefs.current[part.id] = el;
                  }}
                  className={`citation-segment ${
                    isSelectedSegment ? 'active' : ''
                  }`}
                >
                  <mark className="citation-highlight">
                    {part.content.trim()}
                    <sup className="citation-ref">{part.id}</sup>
                  </mark>
                  {!endline && <>&nbsp;</>}
                </span>
                {endline && <span className="br" />}
              </React.Fragment>
            );
          }

          return (
            <React.Fragment key={index}>
              {content
                .filter((line) => !line.startsWith('DOCUMENT '))
                .map((line, lineIndex) => (
                  <React.Fragment key={lineIndex}>
                    <span className="citation-line">{line}</span>
                    {lineIndex < content.length - 1 && <span className="br" />}
                  </React.Fragment>
                ))}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
