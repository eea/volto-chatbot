import React from 'react';
import './App.css';
import superagent from 'superagent';
import { ChatWindow, withOnyxData } from '@eeacms/chatbotlib';

function getEnv() {
  return {
    qaAssistantId: import.meta.env.VITE_API_QA_ASSISTANT_ID,
    assistantId: import.meta.env.VITE_API_MAIN_ASSISTANT_ID,
  };
}

const WrappedChatWindow = withOnyxData(({ assistant }) => [
  'persona',
  typeof assistant !== 'undefined'
    ? superagent.get(`/_da/persona/${assistant}`).type('json')
    : null,
  assistant,
])(ChatWindow);

function App() {
  const envs = getEnv();
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => setIsClient(true), []);

  console.log('envs', envs);

  return isClient ? (
    <WrappedChatWindow assistant={envs.assistantId} />
  ) : (
    <div></div>
  );
}

export default App;
