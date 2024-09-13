import { Button } from 'semantic-ui-react';

function StarterMessage({ msg, onClick }) {
  return (
    <Button onClick={onClick} onKeyDown={onClick} role="button" tabIndex={-1}>
      <strong>{msg.name}</strong>
      <div>
        <em>{msg.description}</em>
      </div>
    </Button>
  );
}

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

      {showAssistantPrompts &&
        persona.starter_messages?.map((msg) => (
          <StarterMessage
            key={msg.name}
            msg={msg}
            onClick={() =>
              onChoice(msg.message || `${msg.name}\n${msg.description}`)
            }
          />
        ))}
    </div>
  );
}
