const makeLoaderFinder = require('razzle-dev-utils/makeLoaderFinder');
// const path = require('path');

const modify = (config, { target, dev }, webpack) => {
  // const markedPath = path.dirname(require.resolve('marked'));
  // const rehyped = path.dirname(require.resolve('rehype-prism-plus'));
  // const remarkGfm = `${path.dirname(require.resolve('remark-gfm'))}/index.js`;

  // const voltoChatbotPath = path.dirname(
  //   require.resolve('@eeacms/volto-chatbot'),
  // );
  // const chatbotPath = path.resolve(`${voltoChatbotPath}/../chatbotlib`);

  // config.resolve.alias['@eeacms/chatbotlib'] = chatbotPath;

  const babelLoaderFinder = makeLoaderFinder('babel-loader');
  const babelLoader = config.module.rules.find(babelLoaderFinder);

  // const { include } = babelLoader;
  // include.push(remarkGfm);
  // console.log('pushed', remarkGfm);
  // include.push(markedPath);
  // include.push(rehyped);
  // include.push(chatbotPath);

  babelLoader.use[0].options.plugins = [
    ...(babelLoader.use[0].options.plugins || []),
    '@babel/plugin-proposal-private-methods',
  ];

  return config;
};

module.exports = {
  plugins: (plugs) => plugs,
  modify,
};
