import type { ChatPacket } from '../../types/streamingModels';
import type { MessageRenderer } from '../../types/interfaces';
import { useEffect, useMemo, useState } from 'react';
import loadable from '@loadable/component';
import { components } from '../../components/markdown';
import { isFinalAnswerComplete } from '../../services/packetUtils';
import { PacketType } from '../../types/streamingModels';
import { BlinkingDot } from '../../components/BlinkingDot';

const Markdown: any = loadable(() => import('react-markdown'));

// Control the rate of packet streaming (packets per second)
const PACKET_DELAY_MS = 10;
// Number of packets to show per animation tick when catching up
const PACKETS_PER_TICK = 5;
// Adaptive animation constants for fast streams
const MIN_REVEAL_DURATION_MS = 400;  // Minimum typing animation duration
const PACKET_VALUE_MS = 1.5;          // Additional time per packet (scales with length)
const MAX_REVEAL_DURATION_MS = 2000; // Cap to prevent slow reveals
const CATCH_UP_THRESHOLD = 20;       // Threshold for catch-up mode

export const MessageTextRenderer: MessageRenderer<ChatPacket> = ({
  packets,
  onComplete,
  animate,
  stopPacketSeen,
  children,
  message,
  libs,
  markers,
  stableContextSources,
  addQualityMarkersPlugin,
}) => {
  const { remarkGfm } = libs;

  // Check if stream is finished
  const isStreamFinished = isFinalAnswerComplete(packets);

  // If we're animating and the final answer is already complete, show more packets initially
  const initialPacketCount = animate
    ? packets.length > 0
      ? 1 // Start with 1 packet
      : 0
    : -1; // Show all if not animating

  const [displayedPacketCount, setDisplayedPacketCount] =
    useState(initialPacketCount);

  // Animation effect - gradually increase displayed packets at controlled rate
  // Adaptive animation: ensures visible typing effect even for fast streams
  useEffect(() => {
    if (!animate) {
      setDisplayedPacketCount(-1); // Show all packets
      return;
    }

    if (displayedPacketCount >= 0 && displayedPacketCount < packets.length) {
      // CASE 1: Stream finished - apply adaptive animation
      if (isStreamFinished) {
        const remainingPackets = packets.length - displayedPacketCount;

        // Calculate adaptive reveal velocity
        const targetDuration =
          MIN_REVEAL_DURATION_MS + remainingPackets * PACKET_VALUE_MS;
        const cappedDuration = Math.min(targetDuration, MAX_REVEAL_DURATION_MS);
        const ticksNeeded = Math.max(1, cappedDuration / PACKET_DELAY_MS);
        const packetsPerTick = Math.ceil(remainingPackets / ticksNeeded);

        const timer = setTimeout(() => {
          setDisplayedPacketCount((prev) => {
            return Math.min(prev + packetsPerTick, packets.length);
          });
        }, PACKET_DELAY_MS);

        return () => clearTimeout(timer);
      }

      // CASE 2: Normal streaming - existing catch-up logic
      const timer = setTimeout(() => {
        setDisplayedPacketCount((prev) => {
          const remaining = packets.length - prev;
          // If we're far behind, catch up faster
          const increment = remaining > CATCH_UP_THRESHOLD ? PACKETS_PER_TICK : 1;
          return Math.min(prev + increment, packets.length);
        });
      }, PACKET_DELAY_MS);

      return () => clearTimeout(timer);
    }
  }, [animate, displayedPacketCount, packets.length, isStreamFinished]);

  // Reset displayed count when packet array changes significantly (e.g., new message)
  useEffect(() => {
    if (animate && packets.length < displayedPacketCount) {
      const resetCount = isStreamFinished
        ? packets.length // Show all if stream is finished
        : packets.length > 0
        ? 1
        : 0;
      setDisplayedPacketCount(resetCount);
    }
  }, [animate, packets.length, displayedPacketCount, isStreamFinished]);

  // Only mark as complete when all packets are received AND displayed
  useEffect(() => {
    if (isStreamFinished) {
      // If animating, wait until all packets are displayed
      if (
        animate &&
        displayedPacketCount >= 0 &&
        displayedPacketCount < packets.length
      ) {
        return;
      }
      onComplete();
    }
  }, [
    packets.length,
    onComplete,
    animate,
    displayedPacketCount,
    isStreamFinished,
  ]);

  // Get content based on displayed packet count
  const content = useMemo(() => {
    if (!animate || displayedPacketCount === -1) {
      return message.message; // Show all content
    }

    // Only show content from packets up to displayedPacketCount
    return packets
      .slice(0, displayedPacketCount)
      .map((packet) => {
        if (
          packet.obj.type === PacketType.MESSAGE_DELTA ||
          packet.obj.type === PacketType.MESSAGE_START
        ) {
          return packet.obj.content;
        }
        return '';
      })
      .join('');
  }, [animate, displayedPacketCount, message.message, packets]);

  // Add blinking cursor when streaming
  const displayContent = stopPacketSeen ? content : content + ' ▊';

  const renderedContent = (
    <div className="message-text-content">
      <Markdown
        components={components(message, markers, stableContextSources)}
        remarkPlugins={[remarkGfm.default]}
        rehypePlugins={[addQualityMarkersPlugin]}
      >
        {displayContent}
      </Markdown>
    </div>
  );

  return children({
    icon: null,
    status: null,
    content:
      content.length > 0 || packets.length > 0 ? (
        renderedContent
      ) : (
        <BlinkingDot addMargin />
      ),
  });
};
