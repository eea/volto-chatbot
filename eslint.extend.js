const path = require('path');

module.exports = {
  modify(defaultConfig) {
    const aliasMap = defaultConfig.settings['import/resolver'].alias.map;
    const addonPath = aliasMap.find(
      ([name]) => name === '@eeacms/volto-chatbot',
    )[1];

    const searchlibPath = path.resolve(`${addonPath}/../chatbotlib`);
    aliasMap.push(['@eeacms/chatbotlib', searchlibPath]);

    return defaultConfig;
  },
};
