import { useRef, useEffect } from 'react';

export const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export async function createChatSession(personaId, description) {
  const createChatSessionResponse = await fetch(
    '/_da/chat/create-chat-session',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        persona_id: personaId,
        description,
      }),
    },
  );
  if (!createChatSessionResponse.ok) {
    //eslint-disable-next-line no-console
    console.log(
      `Failed to create chat session - ${createChatSessionResponse.status}`,
    );
    throw Error('Failed to create chat session');
  }
  const chatSessionResponseJson = await createChatSessionResponse.json();
  return chatSessionResponseJson.chat_session_id;
}

export async function createChatMessageFeedback({
  chat_message_id,
  feedback_text = '',
  is_positive,
  predefined_feedback = '',
}) {
  const payload = {
    chat_message_id,
    feedback_text,
    is_positive,
  };

  if (!is_positive) {
    payload.predefined_feedback = predefined_feedback;
  }

  const createChatMessageFeedbackResponse = await fetch(
    '/_da/chat/create-chat-message-feedback',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );

  if (!createChatMessageFeedbackResponse.ok) {
    //eslint-disable-next-line no-console
    console.log(
      `Failed to submit feedback - ${createChatMessageFeedbackResponse.status}`,
    );
    throw Error(`Failed to submit feedback.`);
  }

  const createChatMessageFeedbackResponseJson = await createChatMessageFeedbackResponse.json();
  return await createChatMessageFeedbackResponseJson;
}

export function updateParentChildren(
  message,
  completeMessageMap,
  setAsLatestChild,
) {
  // NOTE: updates the `completeMessageMap` in place
  const parentMessage = message.parentMessageId
    ? completeMessageMap.get(message.parentMessageId)
    : null;
  if (parentMessage) {
    if (setAsLatestChild) {
      parentMessage.latestChildMessageId = message.messageId;
    }

    const parentChildMessages = parentMessage.childrenMessageIds || [];
    if (!parentChildMessages.includes(message.messageId)) {
      parentChildMessages.push(message.messageId);
    }
    parentMessage.childrenMessageIds = parentChildMessages;
  }
}

export function removeMessage(messageId, completeMessageMap) {
  const messageToRemove = completeMessageMap.get(messageId);
  if (!messageToRemove) {
    return;
  }

  const parentMessage = messageToRemove.parentMessageId
    ? completeMessageMap.get(messageToRemove.parentMessageId)
    : null;
  if (parentMessage) {
    if (parentMessage.latestChildMessageId === messageId) {
      parentMessage.latestChildMessageId = null;
    }
    const currChildMessage = parentMessage.childrenMessageIds || [];
    const newChildMessage = currChildMessage.filter((id) => id !== messageId);
    parentMessage.childrenMessageIds = newChildMessage;
  }

  completeMessageMap.delete(messageId);
}

export function buildLatestMessageChain(messageMap) {
  const rootMessage = Array.from(messageMap.values()).find(
    (message) => message.parentMessageId === null,
  );

  let finalMessageList = [];

  if (rootMessage) {
    let currMessage = rootMessage;
    while (currMessage) {
      finalMessageList.push(currMessage);
      const childMessageNumber = currMessage.latestChildMessageId;
      if (childMessageNumber && messageMap.has(childMessageNumber)) {
        currMessage = messageMap.get(childMessageNumber);
      } else {
        currMessage = null;
      }
    }
  }

  // remove system message
  if (finalMessageList.length > 0 && finalMessageList[0].type === 'system') {
    finalMessageList = finalMessageList.slice(1);
  }
  return finalMessageList; // .concat(additionalMessagesOnMainline);
}

export async function* sendMessage({
  message,
  fileDescriptors,
  parentMessageId,
  chatSessionId,
  promptId,
  filters,
  selectedDocumentIds,
  queryOverride,
  forceSearch,
  modelProvider,
  modelVersion,
  temperature,
  systemPromptOverride,
  useExistingUserMessage,
  alternateAssistantId,
}) {
  const documentsAreSelected =
    selectedDocumentIds && selectedDocumentIds.length > 0;

  const sendMessageResponse = await fetch('/_da/chat/send-message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      alternate_assistant_id: alternateAssistantId,
      chat_session_id: chatSessionId,
      parent_message_id: parentMessageId,
      message: message,
      prompt_id: promptId,
      search_doc_ids: documentsAreSelected ? selectedDocumentIds : null,
      file_descriptors: fileDescriptors,
      retrieval_options: !documentsAreSelected
        ? {
            run_search:
              promptId === null ||
              promptId === undefined ||
              queryOverride ||
              forceSearch
                ? 'always'
                : 'auto',
            real_time: true,
            filters: filters,
          }
        : null,
      query_override: queryOverride,
      prompt_override: systemPromptOverride
        ? {
            system_prompt: systemPromptOverride,
          }
        : null,
      llm_override:
        temperature || modelVersion
          ? {
              temperature,
              model_provider: modelProvider,
              model_version: modelVersion,
            }
          : null,
      use_existing_user_message: useExistingUserMessage,
    }),
  });
  if (!sendMessageResponse.ok) {
    const errorJson = await sendMessageResponse.json();
    const errorMsg = errorJson.message || errorJson.detail || '';
    throw Error(`Failed to send message - ${errorMsg}`);
  }

  yield* handleStream(sendMessageResponse);
}

const processSingleChunk = (chunk, currPartialChunk) => {
  const completeChunk = (currPartialChunk || '') + chunk;
  try {
    // every complete chunk should be valid JSON
    const chunkJson = JSON.parse(completeChunk);
    return [chunkJson, null];
  } catch (err) {
    // if it's not valid JSON, then it's probably an incomplete chunk
    return [null, completeChunk];
  }
};

export const processRawChunkString = (rawChunkString, previousPartialChunk) => {
  /* This is required because, in practice, we see that nginx does not send over
  each chunk one at a time even with buffering turned off. Instead,
  chunks are sometimes in batches or are sometimes incomplete */

  if (!rawChunkString) {
    return [[], null];
  }

  const chunkSections = rawChunkString
    .split('\n')
    .filter((chunk) => chunk.length > 0);
  let parsedChunkSections = [];
  let currPartialChunk = previousPartialChunk;

  chunkSections.forEach((chunk) => {
    const [processedChunk, partialChunk] = processSingleChunk(
      chunk,
      currPartialChunk,
    );
    if (processedChunk) {
      parsedChunkSections.push(processedChunk);
      currPartialChunk = null;
    } else {
      currPartialChunk = partialChunk;
    }
  });

  return [parsedChunkSections, currPartialChunk];
};

export async function* handleStream(streamingResponse) {
  const reader = streamingResponse.body?.getReader();
  const decoder = new TextDecoder('utf-8');

  let previousPartialChunk = null;
  while (true) {
    const rawChunk = await reader?.read();
    if (!rawChunk) {
      throw new Error('Unable to process chunk');
    }
    const { done, value } = rawChunk;
    if (done) {
      break;
    }

    const [completedChunks, partialChunk] = processRawChunkString(
      decoder.decode(value, { stream: true }),
      previousPartialChunk,
    );
    if (!completedChunks.length && !partialChunk) {
      break;
    }
    previousPartialChunk = partialChunk;

    yield await Promise.resolve(completedChunks);
  }
}

export class CurrentMessageFIFO {
  constructor() {
    this.stack = [];
    this.isComplete = false;
    this.error = null;
  }

  push(packetBunch) {
    this.stack.push(packetBunch);
  }

  nextPacket() {
    return this.stack.shift();
  }

  isEmpty() {
    return this.stack.length === 0;
  }
}

export async function fetchRelatedQuestions(message, qgenAsistantId) {
  const { query, answer } = message;
  const chatSessionId = await createChatSession(qgenAsistantId, `Q: ${query}`);

  const params = {
    message: `Question: ${query}\nAnswer:\n${answer}`,
    alternateAssistantId: qgenAsistantId,
    fileDescriptors: [],
    parentMessageId: null,
    chatSessionId,
    promptId: 0,
    filters: {},
    selectedDocumentIds: [],
  };
  const promise = updateCurrentMessageFIFO(params, {}, () => {});

  let result = '';

  const stack = new CurrentMessageFIFO();
  for await (const bit of promise) {
    if (bit.error) {
      stack.error = bit.error;
    } else if (bit.isComplete) {
      stack.isComplete = true;
    } else {
      stack.push(bit.packet);
    }

    if (stack.isComplete || stack.isEmpty()) {
      break;
    }

    await delay(2);

    if (!stack.isEmpty()) {
      const packet = stack.nextPacket();

      if (packet) {
        if (Object.hasOwn(packet, 'answer_piece')) {
          result += packet.answer_piece;
        }
      }
    }
  }

  return result;
}

export async function* updateCurrentMessageFIFO(
  params,
  isCancelledRef,
  setIsCancelled,
) {
  const promise = sendMessage(params);

  try {
    for await (const packetBunch of promise) {
      for (const packet of packetBunch) {
        yield { packet };
      }

      if (isCancelledRef.current) {
        setIsCancelled(false);
        break;
      }
    }
  } catch (error) {
    yield { error: String(error) };
  } finally {
    yield { isComplete: true };
  }
}

export async function useScrollonStream({
  isStreaming,
  scrollableDivRef,
  scrollDist,
  endDivRef,
  distance,
  debounce,
}) {
  const preventScrollInterference = useRef(false);
  const preventScroll = useRef(false);
  const blockActionRef = useRef(false);
  const previousScroll = useRef(0);

  useEffect(() => {
    if (isStreaming && scrollableDivRef && scrollableDivRef.current) {
      let newHeight = scrollableDivRef.current?.scrollTop;
      const heightDifference = newHeight - previousScroll.current;
      previousScroll.current = newHeight;

      // Prevent streaming scroll
      if (heightDifference < 0 && !preventScroll.current) {
        scrollableDivRef.current.style.scrollBehavior = 'auto';
        // scrollableDivRef.current.scrollTop = scrollableDivRef.current.scrollTop;
        scrollableDivRef.current.style.scrollBehavior = 'smooth';
        preventScrollInterference.current = true;
        preventScroll.current = true;

        setTimeout(() => {
          preventScrollInterference.current = false;
        }, 2000);
        setTimeout(() => {
          preventScroll.current = false;
        }, 10000);
      }

      // Ensure can scroll if scroll down
      else if (!preventScrollInterference.current) {
        preventScroll.current = false;
      }
      if (
        scrollDist.current < distance &&
        !blockActionRef.current &&
        !preventScroll.current &&
        endDivRef &&
        endDivRef.current
      ) {
        // catch up if necessary!
        const scrollAmount = scrollDist.current + 10000;
        if (scrollDist.current > 140) {
          endDivRef.current.scrollIntoView();
        } else {
          blockActionRef.current = true;

          scrollableDivRef?.current &&
            scrollableDivRef.current.scrollBy({
              left: 0,
              top: Math.max(0, scrollAmount),
              behavior: 'smooth',
            });

          setTimeout(() => {
            blockActionRef.current = false;
          }, debounce);
        }
      }
    }
  });

  // scroll on end of stream if within distance
  useEffect(() => {
    if (scrollableDivRef?.current && !isStreaming) {
      if (scrollDist.current < distance) {
        scrollableDivRef?.current &&
          scrollableDivRef.current.scrollBy({
            left: 0,
            top: Math.max(scrollDist.current + 600, 0),
            behavior: 'smooth',
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming]);
}

export function getLastSuccessfulMessageId(messageHistory) {
  const lastSuccessfulMessage = messageHistory
    .slice()
    .reverse()
    .find(
      (message) =>
        message.type === 'assistant' &&
        message.messageId !== -1 &&
        message.messageId !== null,
    );
  return lastSuccessfulMessage ? lastSuccessfulMessage?.messageId : null;
}
