export const SourceDetails = ({ source, index }) => {
  return (
    <>
      <h4 className="text-sm font-semibold">
        {index + 1}. {source.title || 'untitled document'}
      </h4>
      {source.pageContent}
    </>
  );
};
