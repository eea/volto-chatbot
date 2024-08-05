import { useRef, useEffect } from 'react';

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
  console.log('buildLatestMessageChain', messageMap);
  const rootMessage = Array.from(messageMap.values()).find(
    (message) => message.parentMessageId === null,
  );
  // console.log('rootMessage', rootMessage);

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
    // console.log('slicing', finalMessageList)
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

  console.log('sendMessageResponse', sendMessageResponse);
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
  console.log('rawChunkString', rawChunkString);

  if (!rawChunkString) {
    return [[], null];
  }

  const chunkSections = rawChunkString
    .split('\n')
    .filter((chunk) => chunk.length > 0);
  let parsedChunkSections;
  let currPartialChunk = previousPartialChunk;

  console.log('chunks', chunkSections);
  chunkSections.forEach((chunk) => {
    const [processedChunk, partialChunk] = processSingleChunk(
      chunk,
      currPartialChunk,
    );
    console.log('pp', [processedChunk, partialChunk]);
    if (processedChunk) {
      parsedChunkSections.push(processedChunk);
      currPartialChunk = null;
    } else {
      currPartialChunk = partialChunk;
    }
  });

  console.log('return', [parsedChunkSections, currPartialChunk]);

  return [parsedChunkSections, currPartialChunk];
};

export async function* handleStream(streamingResponse) {
  const reader = streamingResponse.body?.getReader();
  const decoder = new TextDecoder('utf-8');

  let previousPartialChunk = null;
  while (true) {
    const rawChunk = await reader?.read();
    console.log('rawChunk', rawChunk);
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
    console.log('ccc', [completedChunks, partialChunk]);
    if (!completedChunks.length && !partialChunk) {
      break;
    }
    previousPartialChunk = partialChunk;

    console.log('chunk', completedChunks);
    yield await Promise.resolve(completedChunks);
  }
}

export class CurrentMessageFIFO {
  stack = [];
  isComplete = false;
  error = null;

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

export async function updateCurrentMessageFIFO(
  stack,
  params,
  isCancelledRef,
  setIsCancelled,
) {
  const promise = sendMessage(params);

  try {
    for await (const packetBunch of promise) {
      console.log('pucket bunch', packetBunch);
      for (const packet of packetBunch) {
        console.log('packet', packet);
        stack.push(packet);
      }

      if (isCancelledRef.current) {
        setIsCancelled(false);
        break;
      }
    }
  } catch (error) {
    stack.error = String(error);
  } finally {
    stack.isComplete = true;
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
