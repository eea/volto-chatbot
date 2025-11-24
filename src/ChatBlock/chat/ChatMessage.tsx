import { Message as SemanticMessage } from 'semantic-ui-react';
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
      <div className="message-error">
        <SemanticMessage color="red" className="error-message">
          <div className="error-title">Error</div>
          <div className="error-content">{message.message}</div>
        </SemanticMessage>
      </div>
    );
  }

  return null;
}
