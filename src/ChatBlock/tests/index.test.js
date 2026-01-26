import '@testing-library/jest-dom/extend-expect';

import installChatBlock from '../index';

// Mock @plone/volto/components
jest.mock('@plone/volto/components', () => ({
  SidebarPortal: () => null,
}));

// Mock other dependencies
jest.mock('../ChatBlockView', () => () => <div>ChatBlockView</div>);
jest.mock('../ChatBlockEdit', () => () => <div>ChatBlockEdit</div>);

describe('ChatBlock installation', () => {
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      blocks: {
        blocksConfig: {},
      },
      settings: {},
    };
  });

  it('should register danswerChat block', () => {
    installChatBlock(mockConfig);

    expect(mockConfig.blocks.blocksConfig.danswerChat).toBeDefined();
  });

  it('should set correct block properties', () => {
    installChatBlock(mockConfig);

    const blockConfig = mockConfig.blocks.blocksConfig.danswerChat;
    expect(blockConfig.id).toBe('danswerChat');
    expect(blockConfig.title).toBe('AI Chatbot');
    expect(blockConfig.group).toBe('common');
    expect(blockConfig.restricted({ user: null })).toBe(false);
    expect(blockConfig.mostUsed).toBe(false);
    expect(blockConfig.sidebarTab).toBe(1);
  });

  it('should set view and edit components', () => {
    installChatBlock(mockConfig);

    const blockConfig = mockConfig.blocks.blocksConfig.danswerChat;
    expect(blockConfig.view).toBeDefined();
    expect(blockConfig.edit).toBeDefined();
  });
});
