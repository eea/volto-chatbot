import { useState } from 'react';

import { useMarked } from './useMarked';
import { createChatSession } from './lib';

function wrap(env) {
  async function onmessage(msg) {
    const {
      accumulatedMessage,
      applyPatch,
      messageValue,
      parser,
      runId,
      setChatHistory,
      setIsLoading,
      setMessages,
      sourceStepName,
      streamedResponse,
    } = env;

    if (msg.event === 'end') {
      setChatHistory((prevChatHistory) => [
        ...prevChatHistory,
        { human: messageValue, ai: accumulatedMessage },
      ]);
      setIsLoading(false);
      return;
    }
    if (msg.event === 'data' && msg.data) {
      const chunk = JSON.parse(msg.data);
      env.streamedResponse = applyPatch(
        streamedResponse,
        chunk.ops,
      ).newDocument;

      if (
        Array.isArray(
          streamedResponse?.logs?.[sourceStepName]?.final_output?.output,
        )
      ) {
        env.sources = streamedResponse.logs[
          sourceStepName
        ].final_output.output.map((doc) => ({
          url: doc.metadata.source,
          title: doc.metadata.title,
          pageContent: doc.page_content,
        }));
      }
      if (streamedResponse.id !== undefined) {
        env.runId = streamedResponse.id;
      }
      if (Array.isArray(streamedResponse?.streamed_output)) {
        env.accumulatedMessage = streamedResponse.streamed_output.join('');
      }
      const parsedResult = await parser(accumulatedMessage);

      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        if (
          env.messageIndex === null ||
          newMessages[env.messageIndex] === undefined
        ) {
          env.messageIndex = newMessages.length;
          newMessages.push({
            id: Math.random().toString(),
            content: parsedResult.trim(),
            runId: runId,
            sources: env.sources,
            role: 'assistant',
          });
        } else if (newMessages[env.messageIndex] !== undefined) {
          newMessages[env.messageIndex].content = parsedResult.trim();
          newMessages[env.messageIndex].runId = runId;
          newMessages[env.messageIndex].sources = env.sources;
        }
        return newMessages;
      });
    }
  }

  return onmessage;
}

export function useBackendChat({ endpoint, libs, persona }) {
  const fetchEventSource = libs.fetchEventSource.fetchEventSource;
  const applyPatch = libs.fastJsonPatch.applyPatch;
  console.log(persona);
  const personaId = persona.id;

  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');

  const [chatHistory, setChatHistory] = useState([]);

  const { parser } = useMarked(libs);

  const sendMessage = async (message) => {
    let newChatId;

    if (chatId === null) {
      newChatId = await createChatSession(personaId, 'Public Chat');
      setChatId(newChatId);
    }

    if (isLoading) {
      return;
    }

    const messageValue = message ?? input;
    if (messageValue === '') return;
    setInput('');
    setMessages((prevMessages) => [
      ...prevMessages,
      { id: Math.random().toString(), content: messageValue, role: 'user' },
    ]);
    setIsLoading(true);

    const env = {
      accumulatedMessage: '',
      applyPatch,
      messageIndex: null,
      messageValue,
      runId: undefined,
      setChatHistory,
      setIsLoading,
      sourceStepName: 'FindDocs',
      sources: [],
      setMessages,
      parser,
    };

    try {
      env.streamedResponse = {};
      const body = JSON.stringify({
        chat_session_id: chatId ?? newChatId,
        file_descriptors: [],
        message: messageValue,
        retrieval_options: {
          run_search: 'auto',
          real_time: true,
          filters: {
            source_type: null,
            document_set: null,
            time_cutoff: null,
            tags: [],
          },
        },
      });
      console.log(body);

      await fetchEventSource('/_da/chat/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        openWhenHidden: true,
        body,
        onerror(err) {
          throw err;
        },
        onmessage: wrap(env),
      });
    } catch (e) {
      setMessages((prevMessages) => prevMessages.slice(0, -1));
      setIsLoading(false);
      setInput(messageValue);
      throw e;
    }
  };
  return { input, setInput, sendMessage, messages, isLoading };
}

// input: {
//   question: messageValue,
//   chat_history: chatHistory,
// },
// config: {
//   metadata: {
//     conversation_id: conversationId,
//   },
// },
// include_names: [env.sourceStepName],
