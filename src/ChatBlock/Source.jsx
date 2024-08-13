export const SourceDetails = ({ source, index }) => {
  return (
    <div className="source">
      <strong className="text-sm font-semibold">
        {index}. {source.semantic_identifier || 'untitled document'}
      </strong>
      {/* {source.match_highlights.map((text, i) => (
        <div key={i} dangerouslySetInnerHTML={{ __html: text }} />
      ))} */}
    </div>
  );
};
