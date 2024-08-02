function StarterMessage({ msg, onClick }) {
  return (
    <div onClick={onClick} onKeyDown={onClick} role="button" tabIndex={-1}>
      <strong>{msg.name}</strong>
      <em>{msg.description}</em>
    </div>
  );
}

export default function EmptyState(props) {
  const { data, onChoice } = props;

  const handleClick = (e) => {
    onChoice(e.target.innerText);
  };

  return (
    <div className="rounded flex flex-col items-center max-w-full md:p-8">
      <h2>{data.name}</h2>
      <p>{data.description}</p>

      {data?.starter_messages?.map((msg) => (
        <StarterMessage key={msg.name} msg={msg} onClick={handleClick} />
      ))}
    </div>
  );
}
