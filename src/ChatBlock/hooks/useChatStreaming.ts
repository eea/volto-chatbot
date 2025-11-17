import type { Message } from '../types/interfaces';
import type { SendMessageParams } from '../services/streamingService';
import { useState, useCallback, useRef } from 'react';
import { sendMessage } from '../services/streamingService';
import { MessageProcessor } from '../services/messageProcessor';

interface UseChatStreamingProps {
  onMessageUpdate?: (message: Message) => void;
  onComplete?: (message: Message, processor: MessageProcessor) => void;
  onError?: (error: Error) => void;
}

export function useChatStreaming({
  onMessageUpdate,
  onComplete,
  onError,
}: UseChatStreamingProps = {}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const processorRef = useRef<MessageProcessor | null>(null);

  const startStreaming = useCallback(
    async (
      params: SendMessageParams,
      nodeId: number,
      parentNodeId: number | null,
    ) => {
      // Cancel any existing streaming
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      setIsStreaming(true);
      abortControllerRef.current = new AbortController();
      processorRef.current = new MessageProcessor(nodeId, parentNodeId);

      try {
        for await (const packets of sendMessage({
          ...params,
          signal: abortControllerRef.current.signal,
        })) {
          processorRef.current.addPackets(packets);
          const message = processorRef.current.getMessage();

          setCurrentMessage(message);
          onMessageUpdate?.(message);

          if (processorRef.current.isComplete()) {
            onComplete?.(message, processorRef.current);
            break;
          }
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Streaming error:', error);
          onError?.(error as Error);
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
        processorRef.current = null;
      }
    },
    [onMessageUpdate, onComplete, onError],
  );

  const cancelStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  return {
    isStreaming,
    currentMessage,
    startStreaming,
    cancelStreaming,
  };
}
