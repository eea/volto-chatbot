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
                onClick={() => handleRelatedQuestionClick(question)}
                onKeyDown={() => handleRelatedQuestionClick(question)}
                tabIndex="-1"
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
