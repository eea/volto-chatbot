import debug from 'debug';
import fetch from 'node-fetch';
import fs from 'fs';
import {
  getClaimsFromResponse,
  getTokenProbabilitiesFromLogits,
} from './postprocessing';
import { createHalloumiPrompt } from './preprocessing';

const log = debug('halloumi');

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

export function applyPlattScaling(platt, probability) {
  probability = Math.min(Math.max(probability, 1e-6), 1 - 1e-6);
  const log_prob = Math.log(probability / (1 - probability));
  return sigmoid(-1 * (platt.a * log_prob + platt.b));
}

export async function getVerifyClaimResponse(
  model,
  context,
  claims,
  maxContextSegments = 0,
) {
  if (!context || !claims) {
    const response = {
      claims: [],
      citations: {},
    };
    return response;
  }
  const prompt = createHalloumiPrompt({
    context,
    response: claims,
    maxContextSegments,
    request: undefined,
  });

  log('Halloumi prompt', JSON.stringify(prompt, null, 2));

  const rawClaims = await halloumiGenerativeAPI(model, prompt);
  log('Raw claims', rawClaims);
  const result = {
    ...convertGenerativesClaimToVerifyClaimResponse(rawClaims, prompt),
    rawClaims,
    halloumiPrompt: prompt,
  };

  return result;
}

const tokenChoices = new Set(['supported', 'unsupported']);

/**
 * Fetches a response from the LLM.
 *
 * @param {object} model The model configuration.
 * @param {object} prompt The prompt to send to the LLM.
 * @returns {Promise<object>} The JSON response from the LLM.
 *
 * Environment Variables:
 * - `MOCK_HALLOUMI_FILE_PATH`: If set, the function reads the LLM response from the specified file path instead of making an API call.
 * - `DUMP_HALLOUMI_REQ_FILE_PATH`: If set, the LLM request (URL and parameters) is dumped to the specified file path.
 * - `DUMP_HALLOUMI_FILE_PATH`: If set, the LLM response is dumped to the specified file path.
 */
async function getLLMResponse(model, prompt) {
  let jsonData;

  if (process.env.MOCK_HALLOUMI_FILE_PATH) {
    const filePath = process.env.MOCK_HALLOUMI_FILE_PATH;
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    jsonData = JSON.parse(fileContent);
    return jsonData;
  }

  const data = {
    messages: [{ role: 'user', content: prompt.prompt }],
    temperature: 0.0,
    model: model.name,
    logprobs: true,
    top_logprobs: 3,
  };
  const headers = {
    'Content-Type': 'application/json',
    accept: 'application/json',
  };
  if (model.apiKey) {
    headers['Authorization'] = `Bearer ${model.apiKey}`;
  }

  const params = {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(data),
  };
  if (process.env.DUMP_HALLOUMI_REQ_FILE_PATH) {
    const filePath = process.env.DUMP_HALLOUMI_REQ_FILE_PATH;
    fs.writeFileSync(
      filePath,
      JSON.stringify(
        { url: model.apiUrl, params: { ...params, body: data } },
        null,
        2,
      ),
    );
    log(`Dumped halloumi response: ${filePath}`);
  }

  const response = await fetch(model.apiUrl, params);
  jsonData = await response.json();

  if (process.env.DUMP_HALLOUMI_FILE_PATH) {
    const filePath = process.env.DUMP_HALLOUMI_FILE_PATH;
    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
    log(`Dumped halloumi response: ${filePath}`);
  }

  return jsonData;
}

/**
 * Gets all claims from a response.
 * @param response A string containing all claims and their information.
 * @returns A list of claim objects.
 */
export async function halloumiGenerativeAPI(model, prompt) {
  const jsonData = await getLLMResponse(model, prompt);

  log('Generative response', jsonData);
  log('Logprobs', jsonData.choices[0].logprobs.content);

  const logits = jsonData.choices[0].logprobs.content;
  const tokenProbabilities = getTokenProbabilitiesFromLogits(
    logits,
    tokenChoices,
  );
  const parsedResponse = getClaimsFromResponse(
    jsonData.choices[0].message.content,
  );

  if (parsedResponse.length !== tokenProbabilities.length) {
    throw new Error('Token probabilities and claims do not match.');
  }

  for (let i = 0; i < parsedResponse.length; i++) {
    const scoreMap = tokenProbabilities[i];
    if (model.plattScaling) {
      const platt = model.plattScaling;
      const unsupportedScore = applyPlattScaling(
        platt,
        scoreMap.get('unsupported'),
      );
      const supportedScore = 1 - unsupportedScore;
      scoreMap.set('supported', supportedScore);
      scoreMap.set('unsupported', unsupportedScore);
    }
    parsedResponse[i].probabilities = scoreMap;
  }

  return parsedResponse;
}

export function convertGenerativesClaimToVerifyClaimResponse(
  generativeClaims,
  prompt,
) {
  const citations = {};
  const claims = [];

  for (const offset of prompt.contextOffsets) {
    const citation = {
      startOffset: offset[1].startOffset,
      endOffset: offset[1].endOffset,
      id: offset[0].toString(),
    };
    citations[offset[0].toString()] = citation;
  }

  for (const generativeClaim of generativeClaims) {
    const citationIds = [];
    for (const citation of generativeClaim.citations) {
      citationIds.push(citation.toString());
    }

    const claimId = generativeClaim.claimId;
    if (!prompt.responseOffsets.has(claimId)) {
      throw new Error(`Claim ${claimId} not found in response offsets.`);
    }

    const claimResponseWindow = prompt.responseOffsets.get(claimId);
    const score = generativeClaim.probabilities.get('supported');
    const claim = {
      startOffset: claimResponseWindow.startOffset,
      endOffset: claimResponseWindow.endOffset,
      citationIds: citationIds,
      score: score,
      rationale: generativeClaim.explanation,
    };
    claims.push(claim);
  }

  const response = {
    claims: claims,
    citations: citations,
  };

  return response;
}

// this is not normally used
// if (model.isEmbeddingModel) {
//   return halloumiClassifierAPI(model, context, claims).then((response) => {
//     const parsedResponse = {
//       claims: response.claims,
//       citations: {},
//     };
//     return parsedResponse;
//   });
// }
// export async function halloumiClassifierAPI(model, context, claims) {
//   const classifierPrompts = createHalloumiClassifierPrompts(context, claims);
//   const headers = {
//     'Content-Type': 'application/json',
//     accept: 'application/json',
//   };
//   if (model.apiKey) {
//     headers['Authorization'] = `Bearer ${model.apiKey}`;
//   }
//   const data = {
//     input: classifierPrompts.prompts,
//     model: model.name,
//   };
//
//   const response = await fetch(model.apiUrl, {
//     method: 'POST',
//     headers: headers,
//     body: JSON.stringify(data),
//   });
//   const jsonData = await response.json();
//   const output = {
//     claims: [],
//   };
//   for (let i = 0; i < classifierPrompts.prompts.length; i++) {
//     const embedding = jsonData.data[i].embedding;
//     const probs = getClassifierProbabilitiesFromLogits(embedding);
//     if (model.plattScaling) {
//       const platt = model.plattScaling;
//       const unsupportedScore = applyPlattScaling(platt, probs[1]);
//       const supportedScore = 1 - unsupportedScore;
//       probs[0] = supportedScore;
//       probs[1] = unsupportedScore;
//     }
//     const offset = classifierPrompts.responseOffsets.get(i + 1);
//     // 0-th index is the supported class.
//     // 1-th index is the unsupported class.
//     output.claims.push({
//       startOffset: offset.startOffset,
//       endOffset: offset.endOffset,
//       citationIds: [],
//       score: probs[0],
//       rationale: '',
//     });
//   }
//
//   return output;
// }
