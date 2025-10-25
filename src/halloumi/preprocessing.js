const DEFAULT_HALLOUMI_REQUEST =
  'Make one or more claims about information in the documents.';

/**
 * Splits a given text into sentences using sentence-splitter.
 * @param text The input string to split.
 * @returns An array of sentence strings.
 */
export function splitIntoSentences(text, maxSegments = 0) {
  const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
  const segments = Array.from(segmenter.segment(text)).map((s) => s.segment);

  const initialSentences = [];
  let currentSentence = '';

  for (const segment of segments) {
    currentSentence += segment;
    if (currentSentence.trim().length > 8) {
      initialSentences.push(currentSentence);
      currentSentence = '';
    }
  }
  // Push any remaining part that didn't make it to 8 characters
  if (currentSentence) {
    initialSentences.push(currentSentence);
  }

  if (maxSegments <= 0) {
    return initialSentences;
  }

  if (initialSentences.length > maxSegments) {
    const groupSize = Math.ceil(initialSentences.length / maxSegments);
    const mergedSentences = [];
    for (let i = 0; i < initialSentences.length; i += groupSize) {
      const group = initialSentences.slice(i, i + groupSize);
      mergedSentences.push(group.join(''));
    }
    return mergedSentences;
  }

  return initialSentences;
}

/**
 * Annotate a set of sentences with a given annotation character.
 * @param sentences A list of sentences to annotate.
 * @param annotationChar The character to use for annotation.
 * @returns The annotated string with annotation characters + sentence number.
 */
export function annotate(sentences, annotationChar) {
  return sentences
    .map(
      (sentence, i) =>
        `<|${annotationChar}${i + 1}|><${sentence}><end||${annotationChar}>`,
    )
    .join('');
}

export function getOffsets(originalString, sentences) {
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
  sources,
  response,
  request,
  maxContextSegments = 0,
}) {
  const finalRequest = request || DEFAULT_HALLOUMI_REQUEST;
  const contextSentences = sources.flatMap((text) =>
    splitIntoSentences(text, maxContextSegments),
  );
  const joinedContext = sources.join('\n');
  // const contextSentences = splitIntoSentences(sources, maxContextSegments);
  const contextOffsets = getOffsets(joinedContext, contextSentences);

  const annotatedContextSentences = annotate(contextSentences, 's');

  const responseSentences = splitIntoSentences(response, maxContextSegments);
  const responseOffsets = getOffsets(response, responseSentences);
  const annotatedResponseSentences = annotate(responseSentences, 'r');

  const annotatedContext = `<|context|>${annotatedContextSentences}<end||context>`;
  const annotatedRequest = `<|request|><${finalRequest.trim()}><end||request>`;
  const annotatedResponse = `<|response|>${annotatedResponseSentences}<end||response>`;

  const prompt = `${annotatedContext}${annotatedRequest}${annotatedResponse}`;
  const halloumiPrompt = {
    prompt,
    contextOffsets, // used by convertGenerativesClaimToVerifyClaimResponse
    responseOffsets,
  };

  return halloumiPrompt;
}
