import type {
  Packet,
  MessageStart,
  MessageDelta,
  CitationDelta,
  StreamingCitation,
  OnyxDocument,
} from '../types/streamingModels';
import type { GroupedPackets } from '../types/interfaces';
import { PacketType } from '../types/streamingModels';

export function isToolPacket(
  packet: Packet,
  includeSectionEnd: boolean = true,
): boolean {
  const toolPacketTypes = [
    PacketType.SEARCH_TOOL_START,
    PacketType.SEARCH_TOOL_DELTA,
    PacketType.CUSTOM_TOOL_START,
    PacketType.CUSTOM_TOOL_DELTA,
    PacketType.REASONING_START,
    PacketType.REASONING_DELTA,
    PacketType.FETCH_TOOL_START,
  ];

  if (includeSectionEnd) {
    toolPacketTypes.push(PacketType.SECTION_END);
  }

  return toolPacketTypes.includes(packet.obj.type as PacketType);
}

export function isDisplayPacket(packet: Packet): boolean {
  return (
    packet.obj.type === PacketType.MESSAGE_START ||
    packet.obj.type === PacketType.IMAGE_GENERATION_TOOL_START
  );
}

export function isStreamingComplete(packets: Packet[]): boolean {
  return packets.some(
    (packet) =>
      packet.obj.type === PacketType.STOP ||
      packet.obj.type === PacketType.ERROR,
  );
}

export function hasError(packets: Packet[]): {
  hasError: boolean;
  errorMessage: string | null;
} {
  const errorPacket = packets.find(
    (packet) => packet.obj.type === PacketType.ERROR,
  );
  if (errorPacket && 'error' in errorPacket.obj) {
    return { hasError: true, errorMessage: errorPacket.obj.error as string };
  }
  return { hasError: false, errorMessage: null };
}

export function isFinalAnswerComing(packets: Packet[]): boolean {
  return packets.some(
    (packet) =>
      packet.obj.type === PacketType.MESSAGE_START ||
      packet.obj.type === PacketType.IMAGE_GENERATION_TOOL_START,
  );
}

export function isFinalAnswerComplete(packets: Packet[]): boolean {
  const messageStartPacket = packets.find(
    (packet) =>
      packet.obj.type === PacketType.MESSAGE_START ||
      packet.obj.type === PacketType.IMAGE_GENERATION_TOOL_START,
  );

  if (!messageStartPacket) {
    return false;
  }

  return packets.some(
    (packet) =>
      packet.obj.type === PacketType.SECTION_END &&
      packet.ind === messageStartPacket.ind,
  );
}

export function groupPacketsByInd(packets: Packet[]): GroupedPackets[] {
  const groups = packets.reduce((acc: Map<number, Packet[]>, packet) => {
    const ind = packet.ind;
    if (!acc.has(ind)) {
      acc.set(ind, []);
    }
    acc.get(ind)!.push(packet);
    return acc;
  }, new Map());

  return Array.from(groups.entries())
    .map(([ind, packets]) => ({
      ind,
      packets,
    }))
    .sort((a, b) => a.ind - b.ind);
}

export function getTextContent(packets: Packet[]): string {
  return packets
    .map((packet) => {
      if (
        packet.obj.type === PacketType.MESSAGE_START ||
        packet.obj.type === PacketType.MESSAGE_DELTA
      ) {
        return (packet.obj as MessageStart | MessageDelta).content || '';
      }
      return '';
    })
    .join('');
}

export function getCitations(packets: Packet[]): StreamingCitation[] {
  const citations: StreamingCitation[] = [];
  const seenCitations = new Set<string>();

  packets.forEach((packet) => {
    if (packet.obj.type === PacketType.CITATION_DELTA) {
      const citationDelta = packet.obj as CitationDelta;
      citationDelta.citations?.forEach((citation) => {
        const key = `${citation.citation_num}-${citation.document_id}`;
        if (!seenCitations.has(key)) {
          seenCitations.add(key);
          citations.push(citation);
        }
      });
    }
  });

  return citations;
}

export function getDocuments(packets: Packet[]): OnyxDocument[] {
  const documentMap = new Map<string, OnyxDocument>();

  packets.forEach((packet) => {
    // From MESSAGE_START
    if (packet.obj.type === PacketType.MESSAGE_START) {
      const messageStart = packet.obj as MessageStart;
      messageStart.final_documents?.forEach((doc) => {
        if (doc.document_id) {
          documentMap.set(doc.document_id, doc);
        }
      });
    }

    // From SEARCH_TOOL_DELTA
    if (packet.obj.type === PacketType.SEARCH_TOOL_DELTA) {
      const toolDelta = packet.obj as any;
      toolDelta.documents?.forEach((doc: OnyxDocument) => {
        if (doc.document_id) {
          documentMap.set(doc.document_id, doc);
        }
      });
    }

    // From FETCH_TOOL_START
    if (packet.obj.type === PacketType.FETCH_TOOL_START) {
      const fetchStart = packet.obj as any;
      fetchStart.documents?.forEach((doc: OnyxDocument) => {
        if (doc.document_id) {
          documentMap.set(doc.document_id, doc);
        }
      });
    }
  });

  return Array.from(documentMap.values());
}

export function hasContentPackets(packets: Packet[]): boolean {
  const contentPacketTypes = [
    PacketType.MESSAGE_START,
    PacketType.SEARCH_TOOL_START,
    PacketType.IMAGE_GENERATION_TOOL_START,
    PacketType.CUSTOM_TOOL_START,
    PacketType.FETCH_TOOL_START,
    PacketType.REASONING_START,
  ];
  return packets.some((packet) =>
    contentPacketTypes.includes(packet.obj.type as PacketType),
  );
}

export function injectSectionEndPackets(packets: Packet[]): Packet[] {
  /**
   * Injects SECTION_END packets for graceful completion of tool groups
   * that may not have received a proper end packet due to streaming interruption.
   * Based on Onyx's implementation in AIMessage.tsx.
   */
  const result: Packet[] = [];

  // Track all tool indices we've seen
  const seenToolInds = new Set<number>();

  // Track which tool indices have received SECTION_END packets
  const indicesWithSectionEnd = new Set<number>();

  // Map to group packets by ind for easier injection
  const groupedPackets = new Map<number, Packet[]>();

  // First pass: process all packets and track indices
  packets.forEach((packet) => {
    // Add to grouped packets
    if (!groupedPackets.has(packet.ind)) {
      groupedPackets.set(packet.ind, []);
    }
    groupedPackets.get(packet.ind)!.push(packet);

    // Track tool starts
    if (isToolPacket(packet, false)) {
      seenToolInds.add(packet.ind);
    }

    // Track SECTION_END packets
    if (packet.obj.type === PacketType.SECTION_END) {
      indicesWithSectionEnd.add(packet.ind);
    }
  });

  // Second pass: handle tool transitions and STOP packet
  let previousInd: number | null = null;

  packets.forEach((packet) => {
    result.push(packet);

    // When we see a new tool index, inject SECTION_END for previous tools
    // that don't have one (mimicking Onyx's behavior)
    if (
      previousInd !== null &&
      packet.ind !== previousInd &&
      seenToolInds.has(previousInd)
    ) {
      if (!indicesWithSectionEnd.has(previousInd)) {
        // Inject SECTION_END for the previous tool
        const syntheticPacket: Packet = {
          ind: previousInd,
          obj: { type: PacketType.SECTION_END },
        };
        result.push(syntheticPacket);
        indicesWithSectionEnd.add(previousInd);
      }
    }

    previousInd = packet.ind;

    // If this is a STOP packet, inject SECTION_END for all tools that don't have one
    if (packet.obj.type === PacketType.STOP) {
      seenToolInds.forEach((ind) => {
        if (!indicesWithSectionEnd.has(ind)) {
          const syntheticPacket: Packet = {
            ind,
            obj: { type: PacketType.SECTION_END },
          };
          result.push(syntheticPacket);
          indicesWithSectionEnd.add(ind);
        }
      });
    }
  });

  return result;
}
