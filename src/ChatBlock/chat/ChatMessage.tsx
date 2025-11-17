import type { ChatMessageProps } from '../types/interfaces';
import { UserMessage, AIMessage } from '.';

export function ChatMessage(props: ChatMessageProps) {
  const { message, libs, className = '' } = props;
  if (message.type === 'user') {
    return <UserMessage message={message} libs={libs} className={className} />;
  }

  if (message.type === 'assistant') {
    return <AIMessage {...props} />;
  }

  if (message.type === 'error') {
    return (
      <div className={`error-message ${className}`}>
        <div className="error-icon">⚠️</div>
        <div className="error-text">{message.message}</div>
      </div>
    );
  }

  return null;
}
