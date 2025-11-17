import type { Message } from '../types/interfaces';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useChatStreaming } from './useChatStreaming';
import {
  createChatSession,
  submitFeedback,
  sendMessage,
} from '../services/streamingService';
import { PacketType } from '../types/streamingModels';
import { ResearchType } from '../types/interfaces';

interface UseChatControllerProps {
  personaId: number;
  enableQgen?: boolean;
  qgenAsistantId?: number;
  deepResearch?: string;
}

interface RelatedQuestion {
  question: string;
}

// Extract JSON array from related questions response
function extractRelatedQuestions(str: string): RelatedQuestion[] {
  const regex = /\[[\s\S]*?\]/;
  const match = str.match(regex);

  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {
      // Fallback to line-by-line parsing
      return str
        .split('\n')
        .filter((line) => line.trim())
        .map((question) => ({ question }));
    }
  }

  return str
    .split('\n')
    .filter((line) => line.trim())
    .map((question) => ({ question }));
}

// Fetch related questions using the qgen assistant
async function fetchRelatedQuestions(
  query: string,
  answer: string,
  qgenAsistantId: number,
): Promise<RelatedQuestion[]> {
  try {
    const chatSessionId = await createChatSession(
      qgenAsistantId,
      `Q: ${query}`,
    );

    const params = {
      message: `Question: ${query}\nAnswer:\n${answer}`,
      alternateAssistantId: qgenAsistantId,
      fileDescriptors: [],
      parentMessageId: null,
      chatSessionId,
      promptId: 0,
      filters: null,
      selectedDocumentIds: [],
      use_agentic_search: false,
      regenerate: false,
    };

    let result = '';
    for await (const packets of sendMessage(params)) {
      for (const packet of packets) {
        if (packet.obj.type === PacketType.MESSAGE_DELTA) {
          result += packet.obj.content;
        }
      }
    }

    return extractRelatedQuestions(result);
  } catch (error) {
    console.error('Error fetching related questions:', error);
    return [];
  }
}

export function useChatController({
  personaId,
  enableQgen = false,
  qgenAsistantId,
  deepResearch,
}: UseChatControllerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef(messages);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [isDeepResearchEnabled, setIsDeepResearchEnabled] = useState(
    deepResearch === 'always_on' || deepResearch === 'user_on',
  );
  const [isFetchingRelatedQuestions, setIsFetchingRelatedQuestions] =
    useState(false);
  const [isCancelled, setIsCancelled] = useState(false);

  const nodeIdCounter = useRef(1);
  const isCancelledRef = useRef(isCancelled);

  // Keep ref in sync with state
  useEffect(() => {
    isCancelledRef.current = isCancelled;
  }, [isCancelled]);

  const { isStreaming, startStreaming, cancelStreaming } = useChatStreaming({
    onMessageUpdate: (message) => {
      setMessages((prev) => {
        const existingIndex = prev.findIndex(
          (m) => m.nodeId === message.nodeId,
        );

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = message;
          return updated;
        }
        messagesRef.current = [...prev, message];
        return messagesRef.current;
      });
    },
    onComplete: async (completedMessage, processor) => {
      // Get real database IDs from backend
      const { userMessageId, assistantMessageId } = processor.getMessageIds();

      // Update messages with real IDs
      if (userMessageId || assistantMessageId) {
        setMessages((prev) => {
          const updatedMessages = prev.map((msg) => {
            // Update user message with real ID
            if (
              userMessageId &&
              msg.type === 'user' &&
              msg.nodeId === completedMessage.parentNodeId
            ) {
              return { ...msg, messageId: userMessageId };
            }

            // Update assistant message with real ID
            if (
              assistantMessageId &&
              msg.type === 'assistant' &&
              msg.nodeId === completedMessage.nodeId
            ) {
              return { ...msg, messageId: assistantMessageId };
            }

            return msg;
          });
          messagesRef.current = updatedMessages;
          return updatedMessages;
        });
      }

      // Fetch related questions if enabled
      if (
        enableQgen &&
        qgenAsistantId &&
        completedMessage.type === 'assistant'
      ) {
        setIsFetchingRelatedQuestions(true);

        try {
          // Get the parent user message directly from the completed message
          const userMessage = messagesRef.current.find(
            (m) => m.nodeId === completedMessage.parentNodeId,
          );

          if (userMessage && completedMessage.message) {
            const relatedQuestions = await fetchRelatedQuestions(
              userMessage.message,
              completedMessage.message,
              qgenAsistantId,
            );

            // Update the message with related questions
            setMessages((prev) => {
              return prev.map((m) =>
                m.nodeId === completedMessage.nodeId
                  ? { ...m, relatedQuestions }
                  : m,
              );
            });
          }
        } catch (error) {
          console.error('Failed to fetch related questions:', error);
        } finally {
          setIsFetchingRelatedQuestions(false);
        }
      }
    },
    onError: (error) => {
      const errorMessage: Message = {
        messageId: Date.now(),
        nodeId: nodeIdCounter.current++,
        message: `Error: ${error.message}`,
        type: 'error',
        parentNodeId:
          messages.length > 0 ? messages[messages.length - 1].nodeId : null,
        packets: [],
        files: [],
        toolCall: null,
      };

      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  const onSubmit = useCallback(
    async ({ message }: { message?: string }) => {
      if (isStreaming) return;

      try {
        // Create session if needed
        let sessionId = chatSessionId;

        if (!sessionId) {
          sessionId = await createChatSession(personaId, 'Chat session');
          setChatSessionId(sessionId);
        }

        let messageText = message;
        let parentNodeId: number | null = null;
        let parentMessageId: number | null = null;

        // For new messages, set parent to the last assistant message
        const lastMessage = messages
          .filter((m) => m.type === 'assistant')
          .pop();

        if (lastMessage) {
          parentNodeId = lastMessage.nodeId;
          parentMessageId = lastMessage.messageId || null;
        }

        if (!messageText?.trim()) return;

        // Add user message
        const userNodeId = nodeIdCounter.current++;
        const userMessage: Message = {
          messageId: Date.now(),
          nodeId: userNodeId,
          message: messageText,
          type: 'user',
          parentNodeId,
          packets: [],
          time_sent: new Date().toISOString(),
          files: [],
          toolCall: null,
          researchType: isDeepResearchEnabled
            ? ResearchType.Deep
            : ResearchType.Fast,
        };

        setMessages((prev) => [...prev, userMessage]);

        // Start streaming assistant response
        const assistantNodeId = nodeIdCounter.current++;
        await startStreaming(
          {
            message: messageText,
            chatSessionId: sessionId,
            parentMessageId: parentMessageId || null,
            useAgentSearch: isDeepResearchEnabled,
            regenerate: false,
            filters: null,
            selectedDocumentIds: [],
            fullDoc: true, // Request full document content for quality checking
          },
          assistantNodeId,
          userNodeId,
        );
      } catch (error) {
        console.error('Failed to submit message:', error);
      }
    },
    [
      chatSessionId,
      personaId,
      isStreaming,
      isDeepResearchEnabled,
      startStreaming,
      messages,
    ],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setChatSessionId(null);
    nodeIdCounter.current = 1;
    setIsCancelled(false);
  }, []);

  const handleFeedback = useCallback(
    async (
      messageId: number,
      feedback: 'like' | 'dislike' | null,
      feedbackText?: string,
      predefinedFeedback?: string,
    ) => {
      if (!feedback) return;

      try {
        await submitFeedback({
          chatMessageId: messageId,
          isPositive: feedback === 'like',
          feedbackText: feedbackText || '',
          predefinedFeedback: predefinedFeedback || '',
        });

        // Update message feedback state
        setMessages((prev) =>
          prev.map((m) =>
            m.messageId === messageId ? { ...m, currentFeedback: feedback } : m,
          ),
        );
      } catch (error) {
        console.error('Failed to submit feedback:', error);
      }
    },
    [],
  );

  const handleCancel = useCallback(() => {
    setIsCancelled(true);
    cancelStreaming();
  }, [cancelStreaming]);

  return {
    messages,
    isStreaming,
    isCancelled,
    isFetchingRelatedQuestions,
    onSubmit,
    clearChat,
    cancelStreaming: handleCancel,
    handleFeedback,
    isDeepResearchEnabled,
    setIsDeepResearchEnabled,
    chatSessionId,
  };
}
