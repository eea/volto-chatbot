import installChatBlock from './ChatBlock';
import loadable from '@loadable/component';

const applyConfig = (config) => {
  if (__SERVER__) {
    const express = require('express');
    const middleware = express.Router();

    middleware.use(express.json({ limit: config.settings.maxResponseSize }));
    middleware.use(express.urlencoded({ extended: true }));

    const proxyMiddleware = require('./middleware').default;
    middleware.all('**/_da/**', proxyMiddleware);
    middleware.id = 'danswer';

    config.settings.expressMiddleware = [
      ...config.settings.expressMiddleware,
      middleware,
    ];
  }

  config.settings.loadables = {
    ...config.settings.loadables,
    highlightJs: loadable.lib(() => import('highlight.js')),
    marked: loadable.lib(() => import('marked')),

    // rehypePrism: loadable.lib(() => import('rehype-prism-plus')),
    // remarkGfm: loadable.lib(() => import('remark-gfm')),
    // fastJsonPatch: loadable.lib(() => import('fast-json-patch')),
    // fetchEventSource: loadable.lib(() =>
    //   import('@microsoft/fetch-event-source'),
    // ),
  };

  installChatBlock(config);

  return config;
};

export default applyConfig;
