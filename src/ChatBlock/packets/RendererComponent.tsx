import type { Packet } from '../types/streamingModels';
import type { RendererResult, Message } from '../types/interfaces';
import { PacketType } from '../types/streamingModels';
import { RenderType as RenderTypeEnum } from '../types/interfaces';
import {
  MessageTextRenderer,
  SearchToolRenderer,
  ImageToolRenderer,
  ReasoningRenderer,
  CustomToolRenderer,
  FetchToolRenderer,
} from './renderers';

interface GroupedPackets {
  packets: Packet[];
}

function isChatPacket(packet: Packet): boolean {
  return (
    packet.obj.type === PacketType.MESSAGE_START ||
    packet.obj.type === PacketType.MESSAGE_DELTA ||
    packet.obj.type === PacketType.MESSAGE_END
  );
}

function isSearchToolPacket(packet: Packet): boolean {
  return packet.obj.type === PacketType.SEARCH_TOOL_START;
}

function isImageToolPacket(packet: Packet): boolean {
  return packet.obj.type === PacketType.IMAGE_GENERATION_TOOL_START;
}

function isCustomToolPacket(packet: Packet): boolean {
  return packet.obj.type === PacketType.CUSTOM_TOOL_START;
}

function isFetchToolPacket(packet: Packet): boolean {
  return packet.obj.type === PacketType.FETCH_TOOL_START;
}

function isReasoningPacket(packet: Packet): boolean {
  return (
    packet.obj.type === PacketType.REASONING_START ||
    packet.obj.type === PacketType.REASONING_DELTA ||
    packet.obj.type === PacketType.SECTION_END
  );
}

export function findRenderer(groupedPackets: GroupedPackets): any | null {
  if (groupedPackets.packets.some((packet) => isChatPacket(packet))) {
    return MessageTextRenderer;
  }
  if (groupedPackets.packets.some((packet) => isSearchToolPacket(packet))) {
    return SearchToolRenderer;
  }
  if (groupedPackets.packets.some((packet) => isImageToolPacket(packet))) {
    return ImageToolRenderer;
  }
  if (groupedPackets.packets.some((packet) => isCustomToolPacket(packet))) {
    return CustomToolRenderer;
  }
  if (groupedPackets.packets.some((packet) => isFetchToolPacket(packet))) {
    return FetchToolRenderer;
  }
  if (groupedPackets.packets.some((packet) => isReasoningPacket(packet))) {
    return ReasoningRenderer;
  }
  return null;
}

// React component wrapper that directly uses renderer components
export function RendererComponent({
  packets,
  onComplete,
  animate,
  stopPacketSeen,
  useShortRenderer = false,
  children,
  message,
  libs,
  markers,
  stableContextSources,
  addQualityMarkersPlugin,
}: {
  packets: Packet[];
  onComplete: () => void;
  animate: boolean;
  stopPacketSeen: boolean;
  useShortRenderer?: boolean;
  children: (result: RendererResult) => JSX.Element;
  libs: any;
  message?: Message;
  markers?: any;
  stableContextSources?: any;
  addQualityMarkersPlugin?: any;
}) {
  const RendererFn = findRenderer({ packets });
  const renderType = useShortRenderer
    ? RenderTypeEnum.HIGHLIGHT
    : RenderTypeEnum.FULL;

  if (!RendererFn) {
    return children({ icon: null, status: null, content: <></> });
  }

  return (
    <RendererFn
      packets={packets as any}
      onComplete={onComplete}
      animate={animate}
      renderType={renderType}
      stopPacketSeen={stopPacketSeen}
      message={message}
      libs={libs}
      markers={markers}
      stableContextSources={stableContextSources}
      addQualityMarkersPlugin={addQualityMarkersPlugin}
    >
      {children}
    </RendererFn>
  );
}
