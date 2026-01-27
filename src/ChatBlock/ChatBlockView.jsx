import React from 'react';
import withDanswerData from './withDanswerData';
import ChatWindow from './ChatWindow';
import superagent from 'superagent';

function ChatBlockView(props) {
  const { assistantData, data, isEditMode } = props;

  return assistantData ? (
    <ChatWindow persona={assistantData} isEditMode={isEditMode} {...data} />
  ) : (
    <div>Chatbot</div>
  );
}

export default withDanswerData((props) => [
  'assistantData',
  typeof props.data?.assistant !== 'undefined'
    ? superagent.get(`/_da/persona/${props.data.assistant}`).type('json')
    : null,
  props.data?.assistant,
])(ChatBlockView);
