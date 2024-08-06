const path = require('path');
const makeLoaderFinder = require('razzle-dev-utils/makeLoaderFinder');

const modify = (config, { target, dev }, webpack) => {
  const markedPath = path.dirname(require.resolve('marked'));

  const babelLoaderFinder = makeLoaderFinder('babel-loader');
  const babelLoader = config.module.rules.find(babelLoaderFinder);

  // config.module.rules.push({
  //   test: /node_modules\/vfile\//, // \/lib\/index\.js
  //   use: [
  //     {
  //       loader: 'imports-loader',
  //       options: {
  //         type: 'commonjs',
  //         // imports: ['single process/browser process'],
  //       },
  //     },
  //   ],
  // });

  const { include } = babelLoader;

  include.push(markedPath);
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
