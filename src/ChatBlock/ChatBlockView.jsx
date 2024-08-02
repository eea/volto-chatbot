import React from 'react';
import withDanswerData from './withDanswerData';
import ChatWindow from './ChatWindow';
import superagent from 'superagent';

function ChatBlockView(props) {
  const { assistantData } = props;

  console.log(assistantData);

  return assistantData ? (
    <div>
      <div>
        <ChatWindow data={assistantData} />
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
