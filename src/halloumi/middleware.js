import fetch from 'node-fetch';
import debug from 'debug';
import { isPathAllowed } from '../middleware';

const log = debug('halloumi');

const MSG_INVALID_CONFIGURATION =
  'Invalid configuration: missing RAG_FACT_CHECKER_URL';

// Allowed paths for _v1_ha proxy.
// When adding new endpoints, update this list.
const ALLOWED_HALLOUMI_PATHS = [{ path: '/generate', methods: ['POST'] }];

const RAG_FACT_CHECKER_URL =
  process.env.RAG_FACT_CHECKER_URL || 'http://localhost:8000';

export default async function middleware(req, res, next) {
  const path = req.url.replace('/_v1_ha/', '/');

  // Reject paths not on the allowlist — prevents Confused Deputy attacks
  if (!isPathAllowed(path, req.method, ALLOWED_HALLOUMI_PATHS)) {
    res.statusCode = 404;
    res.statusMessage = 'Not Found';
    res.send({ error: 'Not Found' });
    return;
  }

  if (!RAG_FACT_CHECKER_URL) {
    res.send({
      error: MSG_INVALID_CONFIGURATION,
    });
    return;
  }

  const body = req.body;
  const { sources, answer, maxContextSegments = 0 } = body;

  log('Halloumi request body', {
    answer,
    sources: sources?.length,
    maxContextSegments,
  });

  res.set('Content-Type', 'application/json');

  try {
    const response = await fetch(`${RAG_FACT_CHECKER_URL}/halloumi/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answer,
        sources,
        max_context_segments: maxContextSegments,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      log('Halloumi error response', result);
      res.status(response.status).send({
        error: `Fact-checker error: ${result.detail || result.error || 'unknown error'}`,
      });
      return;
    }

    log('Halloumi response', result);
    res.send(result);
  } catch (error) {
    log('Halloumi fetch error', error);
    res.status(502).send({
      error: `Fact-checker unavailable: ${error.message || 'connection failed'}`,
    });
  }
}
