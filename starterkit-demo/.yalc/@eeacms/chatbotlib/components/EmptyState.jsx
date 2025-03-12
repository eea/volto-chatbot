// import { Button } from 'semantic-ui-react';
import { debounce } from './../utils';

function Button(props) {
  return <button {...props} />;
}

function StarterMessage({ msg, onClick }) {
  return (
    <Button
      onClick={onClick}
      onKeyDown={onClick}
      role="button"
      tabIndex={-1}
      className="starter-message"
    >
      <span className="starter-message-title">{msg.name}</span>
      <div className="starter-message-desc">{msg.description}</div>
    </Button>
  );
}

let click_signal = { current: null };

export default function EmptyState(props) {
  const {
    persona,
    onChoice,
    showAssistantTitle = true,
    showAssistantPrompts = true,
    showAssistantDescription = true,
  } = props;

  return (
    <div className="">
      {showAssistantTitle && <h2>{persona.name}</h2>}
      {showAssistantDescription && <p>{persona.description}</p>}

      <div className="starter-messages-container">
        {showAssistantPrompts &&
          persona.starter_messages?.map((msg) => (
            <StarterMessage
              key={msg.name}
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
