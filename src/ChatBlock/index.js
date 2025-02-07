import codeSVG from '@plone/volto/icons/code.svg';
import ChatBlockView from './ChatBlockView';
import ChatBlockEdit from './ChatBlockEdit';
import { ChatBlockSchema } from './schema';

export default function installChatBlock(config) {
  config.blocks.blocksConfig.danswerChat = {
    id: 'danswerChat',
    title: 'AI Chatbot',
    icon: codeSVG,
    group: 'common',
    view: ChatBlockView,
    edit: ChatBlockEdit,
    restricted: function ({ user }) {
      if (user?.roles) {
        return !user.roles.find((role) => role === 'Manager');
      }
      // backward compatibility for older Volto versions
      return false;
    },
    mostUsed: false,
    blockHasOwnFocusManagement: false,
    sidebarTab: 1,
    schema: ChatBlockSchema,
    security: {
      addPermission: [],
      view: [],
    },
    variations: [],
  };
  return config;
}
