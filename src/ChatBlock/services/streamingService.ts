import { PacketType, type Packet } from '../types/streamingModels';
import type { FileDescriptor, Filters } from '../types/interfaces';

export interface SendMessageParams {
  regenerate: boolean;
  message: string;
  fileDescriptors?: FileDescriptor[];
  parentMessageId: number | null;
  chatSessionId: string;
  filters: Filters | null;
  selectedDocumentIds: number[] | null;
  queryOverride?: string;
  forceSearch?: boolean;
  modelProvider?: string;
  modelVersion?: string;
  temperature?: number;
  systemPromptOverride?: string;
  useExistingUserMessage?: boolean;
  alternateAssistantId?: number;
  signal?: AbortSignal;
  currentMessageFiles?: FileDescriptor[];
  useAgentSearch?: boolean;
  enabledToolIds?: number[];
  forcedToolIds?: number[];
  fullDoc?: boolean;
}

export interface StreamResponse {
  packets: Packet[];
  error?: string;
  isComplete: boolean;
}

/**
 * Process a single chunk from the stream
 */
const processSingleChunk = (
  chunk: string,
  currPartialChunk: string | null,
): [any | null, string | null] => {
  const completeChunk = (currPartialChunk || '') + chunk;
  try {
    // Every complete chunk should be valid JSON
    const chunkJson = JSON.parse(completeChunk);
    return [chunkJson, null];
  } catch (err) {
    // If it's not valid JSON, then it's probably an incomplete chunk
    return [null, completeChunk];
  }
};

/**
 * Process raw chunk string that may contain multiple packets
 */
export const processRawChunkString = (
  rawChunkString: string,
  previousPartialChunk: string | null,
): [any[], string | null] => {
  if (!rawChunkString) {
    return [[], null];
  }

  const chunkSections = rawChunkString
    .split('\n')
    .filter((chunk) => chunk.length > 0);

  const parsedChunkSections: any[] = [];
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

/**
 * Handle streaming response from the backend
 */
export async function* handleStream(
  streamingResponse: Response,
): AsyncGenerator<Packet[], void, unknown> {
  const reader = streamingResponse.body?.getReader();
  if (!reader) {
    throw new Error('No reader available from response');
  }

  const decoder = new TextDecoder('utf-8');
  let previousPartialChunk: string | null = null;

  while (true) {
    const rawChunk = await reader.read();
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

    // Convert chunks to packets
    const packets: Packet[] = completedChunks
      .filter((chunk) => chunk && typeof chunk === 'object')
      .map((chunk) => {
        // Onyx v2 format: { ind: number, obj: { type: string, ... } }
        if ('ind' in chunk && 'obj' in chunk) {
          return chunk as Packet;
        }

        // Handle MessageResponseIDInfo (special case without ind/obj)
        if (
          'user_message_id' in chunk &&
          'reserved_assistant_message_id' in chunk
        ) {
          // Just pass it through as is - MessageProcessor will handle it
          return {
            ind: -1,
            obj: {
              type: PacketType.MESSAGE_END_ID_INFO,
              user_message_id: chunk.user_message_id,
              reserved_assistant_message_id:
                chunk.reserved_assistant_message_id,
            },
          };
        }

        if ('error' in chunk) {
          return {
            ind: -1,
            obj: { type: PacketType.ERROR, error: chunk.error },
          };
        }
        // Handle legacy format if needed
        return null;
      })
      .filter((p): p is Packet => p !== null);

    if (packets.length > 0) {
      yield packets;
    }
  }
}

/**
 * Send a message and stream the response
 */
export async function* sendMessage({
  regenerate,
  retrieval_options,
  message,
  fileDescriptors,
  currentMessageFiles,
  parentMessageId,
  chatSessionId,
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
  signal,
  useAgentSearch,
  enabledToolIds,
  forcedToolIds,
  fullDoc,
}: SendMessageParams): AsyncGenerator<Packet[], void, unknown> {
  const documentsAreSelected =
    selectedDocumentIds && selectedDocumentIds.length > 0;

  const payload = {
    alternate_assistant_id: alternateAssistantId,
    chat_session_id: chatSessionId,
    parent_message_id: parentMessageId,
    message,
    prompt_id: null,
    search_doc_ids: documentsAreSelected ? selectedDocumentIds : null,
    file_descriptors: fileDescriptors,
    current_message_files: currentMessageFiles,
    regenerate,
    retrieval_options:
      retrieval_options ??
      (!documentsAreSelected
        ? {
            run_search: queryOverride || forceSearch ? 'always' : 'auto',
            real_time: true,
            filters: filters,
          }
        : null),
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
    use_agentic_search: useAgentSearch ?? false,
    allowed_tool_ids: enabledToolIds,
    forced_tool_ids: forcedToolIds,
    full_doc: fullDoc,
  };

  const body = JSON.stringify(payload);

  const sendMessageResponse = await fetch('/_da/chat/send-message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
    signal,
  });

  if (!sendMessageResponse.ok) {
    const errorJson = await sendMessageResponse.json();
    const errorMsg = errorJson.message || errorJson.detail || '';
    throw new Error(`Failed to send message - ${errorMsg}`);
  }

  yield* handleStream(sendMessageResponse);
}

/**
 * Create a new chat session
 */
export async function createChatSession(
  personaId: number,
  description?: string,
): Promise<string> {
  const response = await fetch('/_da/chat/create-chat-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      persona_id: personaId,
      description,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create chat session');
  }

  const data = await response.json();
  return data.chat_session_id;
}

/**
 * Submit feedback for a message
 */
export async function submitFeedback(params: {
  chatMessageId: number;
  feedbackText?: string;
  isPositive: boolean;
  predefinedFeedback?: string;
}): Promise<void> {
  const {
    chatMessageId,
    feedbackText = '',
    isPositive,
    predefinedFeedback = '',
  } = params;

  const payload: any = {
    chat_message_id: chatMessageId,
    feedback_text: feedbackText,
    is_positive: isPositive,
  };

  if (!isPositive) {
    payload.predefined_feedback = predefinedFeedback;
  }

  const response = await fetch('/_da/chat/create-chat-message-feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to submit feedback');
  }

  await response.json();
}

/**
 * Regenerate a message
 */
export async function regenerateMessage(
  messageId: number,
  chatSessionId: number,
): Promise<void> {
  const response = await fetch('/_da/chat/regenerate-message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message_id: messageId,
      chat_session_id: chatSessionId,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to regenerate message');
  }
}
