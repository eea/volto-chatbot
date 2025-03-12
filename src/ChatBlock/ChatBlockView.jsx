import React from 'react';
import superagent from 'superagent';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable';

import './style.less';

function ChatBlockView(props) {
  const { assistantData, data, isEditMode, chatbotLib } = props;
  const ChatWindow = chatbotLib.ChatWindow;

  return assistantData ? (
    <ChatWindow persona={assistantData} isEditMode={isEditMode} {...data} />
  ) : (
    <div>Chatbot</div>
  );
}

function WithOnyxDataChatBlockView(props) {
  const { withOnyxData } = props.chatbotLib;

  const Wrapped = React.useMemo(() => {
    const wrapper = withOnyxData((props) => [
      'assistantData',
      typeof props.data?.assistant !== 'undefined'
        ? superagent.get(`/_da/persona/${props.data.assistant}`).type('json')
        : null,
      props.data?.assistant,
    ]);
    return wrapper(ChatBlockView);
  }, [withOnyxData]);

  return <Wrapped {...props} />;
}

export default injectLazyLibs(['chatbotLib', 'rehypePrism'])(
  WithOnyxDataChatBlockView,
);
