import type { Packet } from '../types/streamingModels';
import type { Message, ToolCallMetadata } from '../types/interfaces';
import { PacketType } from '../types/streamingModels';
import {
  getDocuments,
  getCitations,
  getTextContent,
  injectSectionEndPackets,
} from './packetUtils';

/**
 * Process streaming packets into a message object
 */
export class MessageProcessor {
  private packets: Packet[] = [];
  private userMessageId: number | null = null;
  private assistantMessageId: number | null = null;

  constructor(
    private nodeId: number,
    private parentNodeId: number | null,
  ) {}

  /**
   * Add new packets to the processor
   */
  addPackets(newPackets: Packet[]): void {
    this.packets.push(...newPackets);

    // Check for MessageResponseIDInfo packet (special case)
    for (const packet of newPackets) {
      // Handle raw MessageResponseIDInfo packet from backend
      if (packet.obj.type === PacketType.MESSAGE_END_ID_INFO) {
        const idInfo = packet.obj;
        this.userMessageId = idInfo.user_message_id;
        this.assistantMessageId = idInfo.reserved_assistant_message_id;
      }
    }
  }

  /**
   * Check if streaming is complete
   */
  isComplete(): boolean {
    return this.packets.some((p) => p.obj.type === PacketType.STOP);
  }

  /**
   * Get the real database message IDs from backend
   */
  getMessageIds(): {
    userMessageId: number | null;
    assistantMessageId: number | null;
  } {
    return {
      userMessageId: this.userMessageId,
      assistantMessageId: this.assistantMessageId,
    };
  }

  /**
   * Extract tool call information from packets
   */
  private extractToolCall(packets: Packet[]): ToolCallMetadata | null {
    // Look for search tool packets
    const searchToolStart = packets.find(
      (p) => p.obj.type === PacketType.SEARCH_TOOL_START,
    );

    if (!searchToolStart) {
      return null;
    }

    // Collect all documents from SEARCH_TOOL_DELTA packets
    const toolDocuments: any[] = [];
    const processedDocs: Record<string, any> = {};

    for (const packet of packets) {
      if (packet.obj.type === PacketType.SEARCH_TOOL_DELTA) {
        const delta = packet.obj as any;
        if (delta.documents && Array.isArray(delta.documents)) {
          delta.documents.forEach((doc: any) => {
            if (!processedDocs[doc.document_id]) {
              processedDocs[doc.document_id] = doc;
              toolDocuments.push(doc);
            }
          });
        }
      }
    }

    // If we have documents, create the tool call metadata
    if (toolDocuments.length > 0) {
      return {
        tool_name: 'run_search',
        tool_args: {
          query: '', // Query info might be in SEARCH_TOOL_DELTA.queries
        },
        tool_result: toolDocuments.map((doc) => ({
          ...doc,
          content: doc.content || doc.blurb, // Use full content if available, fallback to blurb
        })),
      };
    }

    return null;
  }

  /**
   * Get the current message state
   */
  getMessage(): Message {
    // Inject section end packets for graceful completion
    const processedPackets = injectSectionEndPackets(this.packets);

    // Extract documents
    const documents = getDocuments(processedPackets);

    // Extract citations
    const citationsArray = getCitations(processedPackets);
    const citations: Record<number, string> = {};
    citationsArray.forEach((citation) => {
      citations[citation.citation_num] = citation.document_id;
    });

    // Extract text content
    const textContent = getTextContent(processedPackets);

    // Extract tool call information
    const toolCall = this.extractToolCall(processedPackets);

    return {
      messageId: this.assistantMessageId,
      nodeId: this.nodeId,
      message: textContent,
      type: 'assistant',
      parentNodeId: this.parentNodeId,
      packets: processedPackets,
      documents: documents.length > 0 ? documents : null,
      citations: Object.keys(citations).length > 0 ? citations : undefined,
      files: [],
      toolCall,
    };
  }

  /**
   * Reset the processor
   */
  reset(): void {
    this.packets = [];
    this.userMessageId = null;
    this.assistantMessageId = null;
  }
}
