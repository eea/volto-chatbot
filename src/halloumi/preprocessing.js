/**
 * Represents a prompt with appropriate metadata
 */

/**
 * Splits a given text into sentences using sentence-splitter.
 * @param text The input string to split.
 * @returns An array of sentence strings.
 */
function splitIntoSentences(text, maxSegments = 0) {
  const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
  const segments = segmenter.segment(text);

  const finalSentences = [];
  let shortSentenceString = '';
  for (const { segment } of segments) {
    // Assume that a sentence is more than 8 characters.
    if (segment.length > 8) {
      finalSentences.push(shortSentenceString + segment);
      shortSentenceString = '';
    } else {
      shortSentenceString += segment;
    }
  }

  if (maxSegments <= 0) {
    return finalSentences;
  }

  // we only want to have around maxSentences, so let's find out the group size and merge sentences if needed
  if (finalSentences.length > maxSegments) {
    const groupSize = Math.ceil(finalSentences.length / maxSegments);
    const mergedSentences = [];
    for (let i = 0; i < finalSentences.length; i += groupSize) {
      const group = finalSentences.slice(i, i + groupSize);
      mergedSentences.push(group.join(' '));
    }
    return mergedSentences;
  }

  return finalSentences;
}

/**
 * Annotate a set of sentences with a given annotation character.
 * @param sentences A list of sentences to annotate.
 * @param annotationChar The character to use for annotation.
 * @returns The annotated string with annotation characters + sentence number.
 */
function annotate(sentences, annotationChar) {
  const annotatedSentences = [];

  let sentenceNumber = 0;
  for (const sentence of sentences) {
    sentenceNumber++;
    const annotatedSentence = `<|${annotationChar}${sentenceNumber}|><${sentence}><end||${annotationChar}>`;
    annotatedSentences.push(annotatedSentence);
  }

  return annotatedSentences.join('');
}

function getOffsets(originalString, sentences) {
  const offsets = new Map();
  let stringProgressPointer = 0;
  let sentenceId = 1;
  for (const sentence of sentences) {
    const stringToSearch = originalString.slice(stringProgressPointer);
    const startOffset =
      stringToSearch.indexOf(sentence) + stringProgressPointer;
    const endOffset = startOffset + sentence.length;
    stringProgressPointer = endOffset;
    offsets.set(sentenceId, { startOffset: startOffset, endOffset: endOffset });
    sentenceId++;
  }
  return offsets;
}

/**
 * Creates a Halloumi prompt from a given context, request and response.
 * @param context The context or document to reference.
 * @param response The response to the request.
 * @param request The request or question that was used to produce the response.
 * @returns The Halloumi prompt.
 */
export function createHalloumiPrompt({
  context,
  response,
  request = 'Make one or more claims about information in the documents.',
  maxContextSegments = 0,
}) {
  const contextSentences = splitIntoSentences(context, maxContextSegments);
  const contextOffsets = getOffsets(context, contextSentences);

  const annotatedContextSentences = annotate(contextSentences, 's');

  const responseSentences = splitIntoSentences(response, maxContextSegments);
  const responseOffsets = getOffsets(response, responseSentences);
  const annotatedResponseSentences = annotate(responseSentences, 'r');

  const annotatedContext = `<|context|>${annotatedContextSentences}<end||context>`;
  const annotatedRequest = `<|request|><${request.trim()}><end||request>`;
  const annotatedResponse = `<|response|>${annotatedResponseSentences}<end||response>`;

  const prompt = `${annotatedContext}${annotatedRequest}${annotatedResponse}`;
  const halloumiPrompt = {
    prompt: prompt,
    contextOffsets: contextOffsets,
    responseOffsets: responseOffsets,
  };

  return halloumiPrompt;
}

/**
 * Creates a Halloumi prompt from a given context and response.
 * @param context The context or document to reference.
 * @param response The response to the request.
 * @returns The Halloumi Classifier prompt string.
 */
export function createHalloumiClassifierPrompt(context, response) {
  const annotatedContext = `<context>\n${context.trim()}\n</context>`;
  const annotatedResponse = `<claims>\n${response.trim()}\n</claims>`;

  const prompt = `${annotatedContext}\n\n${annotatedResponse}`;
  return prompt;
}

/**
 * Creates a Halloumi prompt from a given context and response.
 * @param context The context or document to reference.
 * @param response The response to the request.
 * @returns The Halloumi Classifier prompt strings.
 */
export function createHalloumiClassifierPrompts(context, response) {
  const responseSentences = splitIntoSentences(response);
  const responseOffsets = getOffsets(response, responseSentences);
  const prompts = [];
  for (const sentence of responseSentences) {
    const prompt = createHalloumiClassifierPrompt(context, sentence);
    prompts.push(prompt);
  }

  const halloumiPrompt = {
    prompts: prompts,
    sentences: responseSentences,
    responseOffsets: responseOffsets,
  };
  // console.log(halloumiPrompt);

  return halloumiPrompt;
}
