import installChatBlock from './ChatBlock';

const applyConfig = (config) => {
  if (__SERVER__) {
    const express = require('express');
    const middleware = express.Router();
    const proxyMiddleware = require('./middleware').default;
    middleware.all('**/_danswer/**', proxyMiddleware);
    middleware.id = 'danswer';

    config.settings.expressMiddleware = [
      ...config.settings.expressMiddleware,
      middleware,
    ];
  }
  installChatBlock(config);

  return config;
};

export default applyConfig;
