import type { ChatMessageProps } from '../types/interfaces';
import loadable from '@loadable/component';
import SVGIcon from '../components/Icon';
import { components } from '../components/markdown';
import UserIcon from '../../icons/user.svg';

const Markdown = loadable(() => import('react-markdown'));

export function UserMessage({
  message,
  className = '',
  libs,
}: ChatMessageProps) {
  const { remarkGfm } = libs;
  return (
    <div className={`comment ${className}`}>
      <div className="circle user">
        <SVGIcon name={UserIcon} size={20} color="white" />
      </div>
      <div>
        <Markdown components={components(message)} remarkPlugins={[remarkGfm]}>
          {message.message}
        </Markdown>
      </div>
    </div>
  );
}
