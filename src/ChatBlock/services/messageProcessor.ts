import type {
  CitationDelta,
  MessageDelta,
  MessageStart,
  OnyxDocument,
  Packet,
  StreamingCitation,
} from '../types/streamingModels';
import type { Message, ToolCallMetadata } from '../types/interfaces';
import {
  getSynteticPacket,
  isToolPacket,
  isDisplayPacket,
} from './packetUtils';
import { PacketType } from '../types/streamingModels';

/**
 * Process streaming packets into a message object
 */
export class MessageProcessor {
  private packets: Packet[] = [];
  private groupedPackets = new Map<number, Packet[]>();
  private toolPackets: number[] = [];
  private displayPackets: number[] = [];
  private userMessageId: number | null = null;
  private assistantMessageId: number | null = null;
  private documentMap = new Map<string, OnyxDocument>();
  private indicesStarted: number[] = [];
  private _textContent: string = '';
  private _errorContent: string = '';
  private _documents: OnyxDocument[] = [];
  private _citations = new Map<number, string>();
  private _isComplete: boolean = false;
  private _isFinalMessageComing: boolean = false;

  constructor(
    private nodeId: number,
    private parentNodeId: number | null,
  ) {}

  /**
   * Add new packets to the processor
   */
  addPackets(newPackets: Packet[]): void {
    for (const packet of newPackets) {
      this.processPacket(packet);
      this.processMessageIdsInfo(packet);
      this.processTextContent(packet);
      this.processDocuments(packet);
      this.processCitations(packet);
      this.processFinalMessageComming(packet);
      this.processError(packet);
      this.processStreamEnd(packet);
    }
  }

  // Getters
  /**
   * Indicates if the streaming has completed
   */
  get isComplete(): boolean {
    return this._isComplete;
  }

  /**
   * Indicates if the final message is about to come
   */
  get isFinalMessageComing(): boolean {
    return this._isFinalMessageComing;
  }

  /**
   * Get the real database message IDs from backend
   */
  get messageIds(): {
    userMessageId: number | null;
    assistantMessageId: number | null;
  } {
    return {
      userMessageId: this.userMessageId,
      assistantMessageId: this.assistantMessageId,
    };
  }

  // Packet processing
  /**
   * Process a single packet and track its lifecycle
   */
  private processPacket(packet: Packet) {
    let processedPacket: Packet = packet;

    // Store tool packets indices
    if (isToolPacket(packet) && !this.toolPackets.includes(packet.ind)) {
      this.toolPackets.push(packet.ind);
    }

    // Store display packets indices
    if (isDisplayPacket(packet) && !this.displayPackets.includes(packet.ind)) {
      this.displayPackets.push(packet.ind);
    }

    // Keep track of all started indices to know when to send SECTION_END
    if (
      packet.ind > -1 &&
      packet.obj.type !== PacketType.SECTION_END &&
      !this.indicesStarted.includes(packet.ind)
    ) {
      this.indicesStarted.push(packet.ind);
    }

    // Send synthetic SECTION_END when needed
    if (
      packet.obj.type === PacketType.SECTION_END &&
      this.indicesStarted.length > 0
    ) {
      processedPacket = getSynteticPacket(
        this.indicesStarted.shift()!,
        PacketType.SECTION_END,
      );
    } else if (packet.obj.type === PacketType.SECTION_END) {
      return;
    }

    const { ind } = processedPacket;

    // Store processed packet for later aggregation
    this.packets.push(processedPacket);

    // Group packets by index for later processing
    if (!this.groupedPackets.has(ind)) {
      this.groupedPackets.set(ind, []);
    }
    this.groupedPackets.get(ind)!.push(processedPacket);
  }

  /**
   * Process MESSAGE_END_ID_INFO packets to extract message IDs
   * These packets contain the actual database message IDs assigned by the backend
   */
  private processMessageIdsInfo(packet: Packet) {
    if (packet.obj.type !== PacketType.MESSAGE_END_ID_INFO) {
      return;
    }
    const idInfo = packet.obj;
    this.userMessageId = idInfo.user_message_id;
    this.assistantMessageId = idInfo.reserved_assistant_message_id;
  }

  /**
   * Process text content from MESSAGE_START and MESSAGE_DELTA packets
   * Accumulates text content across multiple packets
   */
  private processTextContent(packet: Packet) {
    if (
      [PacketType.MESSAGE_START, PacketType.MESSAGE_DELTA].includes(
        packet.obj.type,
      )
    ) {
      const content = (packet.obj as MessageStart | MessageDelta).content || '';
      this._textContent += content;
    }
  }

  /**
   * Process document information from various tool packets
   * Updates the internal document collection and notifies when new documents are added
   */
  private processDocuments(packet: Packet) {
    if (
      ![
        PacketType.MESSAGE_START,
        PacketType.SEARCH_TOOL_DELTA,
        PacketType.FETCH_TOOL_START,
      ].includes(packet.obj.type)
    ) {
      return;
    }
    let newDocuments = false;
    const data = packet.obj as any;
    const documents = data.final_documents || data.documents;
    if (documents) {
      documents.forEach((doc: OnyxDocument) => {
        const docId = doc.document_id;
        if (docId && !this.documentMap.has(docId)) {
          this.documentMap.set(docId, doc);
          newDocuments = true;
        }
      });
    }
    if (newDocuments) {
      this._documents = Array.from(this.documentMap.values());
    }
  }

  /**
   * Process citation information from CITATION_DELTA packets
   * Updates the internal citation collection and notifies when new citations are added
   */
  private processCitations(packet: Packet) {
    if (packet.obj.type !== PacketType.CITATION_DELTA) {
      return;
    }
    const citationDelta = packet.obj as CitationDelta;
    citationDelta.citations?.forEach((citation: StreamingCitation) => {
      if (!this._citations.has(citation.citation_num)) {
        this._citations.set(citation.citation_num, citation.document_id);
      }
    });
  }

  /**
   * Check if a packet indicates the final message is about to be sent
   * Sets the _isFinalMessageComing flag when appropriate
   */
  private processFinalMessageComming(packet: Packet) {
    if (
      [
        PacketType.MESSAGE_START,
        PacketType.IMAGE_GENERATION_TOOL_START,
      ].includes(packet.obj.type)
    ) {
      this._isFinalMessageComing = true;
    }
  }

  private processError(packet: Packet) {
    if (packet.obj.type === PacketType.ERROR) {
      this._errorContent = packet.obj.error;
    }
  }

  /**
   * Handle STOP packets to mark streaming as complete
   */
  private processStreamEnd(packet: Packet) {
    if ([PacketType.STOP, PacketType.ERROR].includes(packet.obj.type)) {
      this._isComplete = true;
    }
  }

  // Utility methods
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
          content: doc.content || doc.blurb,
        })),
      };
    }

    return null;
  }

  /**
   * Get the current message state
   */
  getMessage(): Message {
    let toolCall = null;

    if (this._isComplete) {
      // Extract tool call information
      toolCall = this._isComplete ? this.extractToolCall(this.packets) : null;
    }

    return {
      messageId: this.assistantMessageId,
      nodeId: this.nodeId,
      message: this._textContent,
      error: this._errorContent,
      type: 'assistant',
      parentNodeId: this.parentNodeId,
      packets: [...this.packets],
      groupedPackets: Array.from(this.groupedPackets.entries())
        .map(([ind, packets]) => ({
          ind,
          packets: [...packets],
        }))
        .sort((a, b) => a.ind - b.ind),
      toolPackets: [...this.toolPackets],
      displayPackets: [...this.displayPackets],
      documents: this._documents.length > 0 ? [...this._documents] : null,
      citations:
        this._citations.size > 0
          ? Object.fromEntries(this._citations)
          : undefined,
      files: [],
      isComplete: this._isComplete,
      isFinalMessageComing: this._isFinalMessageComing,
      toolCall,
    };
  }

  /**
   * Reset the processor
   */
  reset(): void {
    this.packets = [];
    this.groupedPackets.clear();
    this.toolPackets = [];
    this.displayPackets = [];
    this.userMessageId = null;
    this.assistantMessageId = null;
    this.documentMap.clear();
    this.indicesStarted = [];
    this._textContent = '';
    this._errorContent = '';
    this._documents = [];
    this._citations.clear();
    this._isComplete = false;
    this._isFinalMessageComing = false;
  }
}
