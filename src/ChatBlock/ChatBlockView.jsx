import React from 'react';
import { withDanswerData } from './helpers';

function StarterMessage({ msg }) {
  const handler = () => {
    console.log(msg.message);
  };
  return (
    <div onClick={handler} onKeyDown={handler} role="button" tabIndex={-1}>
      <strong>{msg.name}</strong>
      <em>{msg.description}</em>
    </div>
  );
}

function ChatBlockView({ assistantData }) {
  console.log(assistantData);
  return assistantData ? (
    <div>
      <h2>{assistantData.name}</h2>
      <p>{assistantData.description}</p>
      <div>
        {assistantData?.starter_messages?.map((msg) => (
          <StarterMessage key={msg.name} msg={msg} />
        ))}
      </div>
    </div>
  ) : (
    <div>Chatbot</div>
  );
}

export default withDanswerData((props) => [
  'assistantData',
  typeof props.data?.assistant !== 'undefined'
    ? fetch(`/_danswer/persona/${props.data.assistant}`)
    : null,
])(ChatBlockView);
