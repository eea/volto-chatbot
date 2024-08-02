import React from 'react';
import withDanswerData from './withDanswerData';
import ChatWindow from './ChatWindow';
import superagent from 'superagent';

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

function ChatBlockView(props) {
  const { assistantData } = props;

  console.log(assistantData);

  return assistantData ? (
    <div>
      <h2>{assistantData.name}</h2>
      <p>{assistantData.description}</p>
      <div>
        {assistantData?.starter_messages?.map((msg) => (
          <StarterMessage key={msg.name} msg={msg} />
        ))}
        <ChatWindow />
      </div>
    </div>
  ) : (
    <div>Chatbot</div>
  );
}

export default withDanswerData((props) => [
  'assistantData',
  typeof props.data?.assistant !== 'undefined'
    ? superagent.get(`/_danswer/persona/${props.data.assistant}`).type('json')
    : null,
  props.data?.assistant,
])(ChatBlockView);
