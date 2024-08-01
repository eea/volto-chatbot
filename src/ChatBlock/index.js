import codeSVG from '@plone/volto/icons/code.svg';
import ChatBlockView from './ChatBlockView';
import ChatBlockEdit from './ChatBlockEdit';
import { ChatBlockSchema } from './schema';

export default function installChatBlock(config) {
  config.blocks.blocksConfig.danswerChat = {
    id: 'danswerChat',
    title: 'Danswer Chat',
    icon: codeSVG,
    group: 'common',
    view: ChatBlockView,
    edit: ChatBlockEdit,
    restricted: false,
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
