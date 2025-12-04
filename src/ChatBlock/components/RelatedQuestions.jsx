import { trackEvent } from '@eeacms/volto-matomo/utils';

const RelatedQuestions = ({
  persona,
  message,
  isLoading,
  onChoice,
  enableMatomoTracking,
}) => {
  const showRelatedQuestions = message.relatedQuestions?.length > 0;

  const handleRelatedQuestionClick = (question) => {
    if (!isLoading) {
      if (enableMatomoTracking) {
        trackEvent({
          category: persona?.name ? `Chatbot - ${persona.name}` : 'Chatbot',
          action: 'Chatbot: Related question click',
          name: 'Message submitted',
        });
      }
      onChoice(question);
    }
  };

  return (
    <>
      {showRelatedQuestions && (
        <>
          <h5>Related questions:</h5>
          <div className="chat-related-questions">
            {message.relatedQuestions.map(({ question }, idx) => (
              <div
                key={idx}
                className="relatedQuestionButton"
                role="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  handleRelatedQuestionClick(question);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault(); // Prevent space from scrolling
                    e.currentTarget.blur();
                    handleRelatedQuestionClick(question);
                  }
                }}
                tabIndex="0"
              >
                {question}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
};

export default RelatedQuestions;
