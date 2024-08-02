import { injectLazyLibs } from '@plone/volto/helpers/Loadable';
import { useBackendChat } from './useBackendChat';

function ChatWindow(props) {
  const { highlightJs, marked, fastJsonPatch, fetchEventSource } = props;

  const libs = {
    highlightJs,
    marked,
    fastJsonPatch,
    fetchEventSource,
  };
  const endpoint = '/_danswer/chat';

  const { sendMessage, input, setInput, messages, isLoading } = useBackendChat({
    endpoint,
    libs,
  });

  return <div>Chat window</div>;
}

export default injectLazyLibs([
  'highlightJs',
  'marked',
  'fastJsonPatch',
  'fetchEventSource',
])(ChatWindow);
