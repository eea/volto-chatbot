import { Button } from 'semantic-ui-react';
import { debounce } from './utils';

function StarterMessage({ msg, onClick }) {
  if (!(msg.name || msg.message)) return null;

  return (
    <Button
      onClick={onClick}
      onKeyDown={onClick}
      role="button"
      tabIndex={-1}
      className="starter-message"
    >
      <span className="starter-message-title">{msg.name || msg.message}</span>
      {/* <div className="starter-message-desc">{msg.description}</div> */}
    </Button>
  );
}

let click_signal = { current: null };

export default function EmptyState(props) {
  const {
    persona,
    onChoice,
    showAssistantPrompts = true,
    enableStarterPrompts,
    starterPrompts = [],
    starterPromptsHeading,
  } = props;

  return (
    <div className="empty-state">
      {enableStarterPrompts &&
        starterPrompts.length > 0 &&
        starterPromptsHeading && (
          <h4 className="starter-message-heading">{starterPromptsHeading}</h4>
        )}

      <div className="starter-messages-container">
        {enableStarterPrompts &&
          starterPrompts.map((msg, idx) => (
            <StarterMessage
              key={msg.name || `starter-${idx}`}
              msg={msg}
              onClick={() =>
                debounce(
                  () =>
                    onChoice(msg.message || `${msg.name}\n${msg.description}`),
                  click_signal,
                )
              }
            />
          ))}

        {showAssistantPrompts &&
          persona?.starter_messages?.map((msg, idx) => (
            <StarterMessage
              key={msg.name || `assistant-${idx}`}
              msg={msg}
              onClick={() =>
                debounce(
                  () =>
                    onChoice(msg.message || `${msg.name}\n${msg.description}`),
                  click_signal,
                )
              }
            />
          ))}
      </div>
    </div>
  );
}
