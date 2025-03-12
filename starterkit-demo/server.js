import fs from 'node:fs/promises';
import express from 'express';
import proxyMiddleware from './onyx-proxy.js';

import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 5173;
const base = process.env.BASE || '/';

// Cached production assets
const templateHtml = isProduction
  ? await fs.readFile('./dist/client/index.html', 'utf-8')
  : await fs.readFile('./index.html', 'utf-8');

const app = express();

// Add Vite or respective production middlewares
/** @type {import('vite').ViteDevServer | undefined} */
let vite;
if (!isProduction) {
  const { createServer } = await import('vite');
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    base,
  });
  app.use(vite.middlewares);
} else {
  const compression = (await import('compression')).default;
  const sirv = (await import('sirv')).default;
  app.use(compression());
  app.use(base, sirv('./dist/client', { extensions: [] }));
}

const middleware = express.Router();

middleware.use(
  express.json({
    limit: 2000000000, // This is superagent default (200 mb)
  }),
);
middleware.use(express.urlencoded({ extended: true }));

middleware.all(/\/_da\/(.*)/, proxyMiddleware);
middleware.id = 'danswer';

app.use(middleware);

// See https://github.com/bluwy/create-vite-extra/blob/41db5fa889295e12f9a2dddc74e4c5318046abe4/template-ssr-react/server.js
app.use('*all', async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, '');
    const html = await vite.transformIndexHtml(url, templateHtml);
    res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    // eslint-disable-next-line no-console
    console.log(e.stack);
    res.status(500).end(e.stack);
  }
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server started at http://localhost:${port}`);
});
