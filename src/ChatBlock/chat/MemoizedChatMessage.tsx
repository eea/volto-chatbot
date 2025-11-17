import type { ChatMessageProps } from '../types/interfaces';
import { memo } from 'react';
import isEqual from 'lodash/isEqual';
import { ChatMessage } from './ChatMessage';

// Memoized version of ChatMessage to prevent unnecessary re-renders
export const MemoizedChatMessage = memo(
  (props: ChatMessageProps) => <ChatMessage {...props} />,
  (prevProps, nextProps) => {
    // Custom comparison function to determine if props changed
    // Only re-render if message content changed
    if (prevProps.message !== nextProps.message) {
      // For streaming messages, do deep comparison
      if (
        prevProps.message.packets?.length !== nextProps.message.packets?.length
      ) {
        return false; // Packet count changed, should re-render
      }

      // Check if the last packet changed
      const prevLastPacket =
        prevProps.message.packets?.[prevProps.message.packets.length - 1];
      const nextLastPacket =
        nextProps.message.packets?.[nextProps.message.packets.length - 1];
      if (!isEqual(prevLastPacket, nextLastPacket)) {
        return false; // Last packet changed, should re-render
      }
    }

    // For stable props, don't re-render
    return true;
  },
);

// Set display name for debugging
MemoizedChatMessage.displayName = 'MemoizedChatMessage';
