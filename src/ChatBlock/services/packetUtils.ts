import type { Packet } from '../types/streamingModels';
import { PacketType } from '../types/streamingModels';

export function getSynteticPacket(ind: number, type: PacketType): Packet {
  return {
    ind,
    obj: { type } as any,
  };
}

export function isToolPacket(packet: Packet): boolean {
  const toolPacketTypes = [
    PacketType.SEARCH_TOOL_START,
    PacketType.SEARCH_TOOL_DELTA,
    PacketType.CUSTOM_TOOL_START,
    PacketType.CUSTOM_TOOL_DELTA,
    PacketType.REASONING_START,
    PacketType.REASONING_DELTA,
    PacketType.FETCH_TOOL_START,
  ];

  return toolPacketTypes.includes(packet.obj.type as PacketType);
}

export function isDisplayPacket(packet: Packet): boolean {
  return [
    PacketType.MESSAGE_START,
    PacketType.IMAGE_GENERATION_TOOL_START,
  ].includes(packet.obj.type as PacketType);
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
