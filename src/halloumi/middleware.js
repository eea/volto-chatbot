import debug from 'debug';
import { getVerifyClaimResponse } from '.';

const log = debug('halloumi');

const MSG_INVALID_CONFIGURATION =
  'Invalid configuration: missing LLMGW_TOKEN or LLMGW_URL';

const LLMGW_URL = process.env.LLMGW_URL;
const LLMGW_TOKEN = process.env.LLMGW_TOKEN;

const generativeModel = {
  name: 'Inhouse-LLM/HallOumi-8B',
  apiUrl: `${LLMGW_URL}/chat/completions`,
  plattScaling: {
    a: -0.5764390035379638,
    b: 0.16648741572432335,
  },
  isEmbeddingModel: false,
};

const classifyModel = {
  name: 'Inhouse-LLM/HallOumi-8B-classifier',
  apiUrl: `${LLMGW_URL}/v1/embeddings`,
  isEmbeddingModel: true,
  plattScaling: {
    a: -0.9468640744087437,
    b: -0.07379217647931409,
  },
};

export default async function middleware(req, res, next) {
  const path = req.url.replace('/_ha/', '/');

  if (!(LLMGW_TOKEN && LLMGW_URL)) {
    res.send({
      error: MSG_INVALID_CONFIGURATION,
    });
    return;
  }

  const model = {
    ...(path === '/classify' ? classifyModel : generativeModel),
    apiKey: LLMGW_TOKEN,
  };
  const body = req.body;

  log('Halloumi body', body);
  const { sources, answer, maxContextSegments = 0 } = body;

  res.set('Content-Type', 'application/json');

  try {
    const resp = await getVerifyClaimResponse(
      model,
      // TODO: map with citation id
      sources.join('\n---\n'),
      answer,
      maxContextSegments,
    );
    log('Halloumi response', resp);
    res.send(resp);
  } catch (error) {
    res.send({ error: `Halloumi error: ${error}` });
    throw error;
  }
}
