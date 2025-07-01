import installChatBlock from './ChatBlock';
import loadable from '@loadable/component';

const applyConfig = (config) => {
  if (__SERVER__) {
    const express = require('express');
    const middleware = express.Router();

    middleware.use(express.json({ limit: config.settings.maxResponseSize }));
    middleware.use(express.urlencoded({ extended: true }));

    const proxyMiddleware = require('./middleware').default;
    const halloumiMiddleware = require('./halloumi/middleware').default;

    middleware.all('**/_da/**', proxyMiddleware);
    middleware.all('**/_ha/**', halloumiMiddleware);

    middleware.id = 'chatbot';

    config.settings.expressMiddleware = [
      ...config.settings.expressMiddleware,
      middleware,
    ];
  }

  config.settings.loadables = {
    ...config.settings.loadables,
    rehypePrism: loadable.lib(() => import('rehype-prism-plus')),
    remarkGfm: loadable.lib(() => import('remark-gfm')),
    luxon: loadable.lib(() => import('luxon')),

    // highlightJs: loadable.lib(() => import('highlight.js')),
    // marked: loadable.lib(() => import('marked')),

    // fastJsonPatch: loadable.lib(() => import('fast-json-patch')),
    // fetchEventSource: loadable.lib(() =>
    //   import('@microsoft/fetch-event-source'),
    // ),
  };

  installChatBlock(config);

  return config;
};

export default applyConfig;
