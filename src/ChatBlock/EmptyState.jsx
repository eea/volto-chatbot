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
  const { persona, onChoice } = props;

  const handleClick = (e) => {
    onChoice(e.target.innerText);
  };

  return (
    <div className="rounded flex flex-col items-center max-w-full md:p-8">
      <h2>{persona.name}</h2>
      <p>{persona.description}</p>

      {persona.starter_messages?.map((msg) => (
        <StarterMessage key={msg.name} msg={msg} onClick={handleClick} />
      ))}
    </div>
  );
}
