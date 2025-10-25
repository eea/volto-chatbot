import {
  createHalloumiPrompt,
  splitIntoSentences,
  annotate,
  getOffsets,
} from './preprocessing';

describe('splitIntoSentences', () => {
  it('should split a basic text into sentences', () => {
    const text =
      'This is sentence one. This is sentence two. This is sentence three.';
    const expected = [
      'This is sentence one. ',
      'This is sentence two. ',
      'This is sentence three.',
    ];
    expect(splitIntoSentences(text)).toEqual(expected);
  });

  it('should handle short sentences by merging them', () => {
    const text = 'Short. This is a longer sentence. Also short.';
    const expected = ['Short. This is a longer sentence. ', 'Also short.'];
    expect(splitIntoSentences(text)).toEqual(expected);
  });

  it('should return an empty array for an empty string', () => {
    expect(splitIntoSentences('')).toEqual([]);
  });

  it('should handle a single sentence', () => {
    const text = 'This is a single sentence.';
    expect(splitIntoSentences(text)).toEqual(['This is a single sentence.']);
  });

  it('should handle text without punctuation', () => {
    const text = 'This is a sentence without punctuation';
    expect(splitIntoSentences(text)).toEqual([
      'This is a sentence without punctuation',
    ]);
  });

  it('should not merge sentences when maxSegments is 0', () => {
    const text = 'One. Two. Three. Four. Five.';
    const expected = ['One. Two. ', 'Three. Four. ', 'Five.'];
    expect(splitIntoSentences(text, 0)).toEqual(expected);
  });

  it('should not merge sentences when finalSentences.length <= maxSegments', () => {
    const text = 'One. Two. Three.';
    const expected = ['One. Two. ', 'Three.'];
    expect(splitIntoSentences(text, 3)).toEqual(expected);
  });

  it('should merge sentences when finalSentences.length > maxSegments', () => {
    const text = 'One. Two. Three. Four. Five.';
    const expected = ['One. Two. Three. Four. ', 'Five.'];
    expect(splitIntoSentences(text, 2)).toEqual(expected);
  });

  it('should merge sentences into a single segment if maxSegments is 1', () => {
    const text = 'One. Two. Three. Four. Five.';
    const expected = ['One. Two. Three. Four. Five.'];
    expect(splitIntoSentences(text, 1)).toEqual(expected);
  });
});

describe('annotate', () => {
  it('should annotate multiple sentences correctly', () => {
    const sentences = ['Sentence one.', 'Sentence two.'];
    const annotationChar = 's';
    const expected =
      '<|s1|><Sentence one.><end||s><|s2|><Sentence two.><end||s>';
    expect(annotate(sentences, annotationChar)).toEqual(expected);
  });

  it('should handle an empty array of sentences', () => {
    const sentences = [];
    const annotationChar = 's';
    expect(annotate(sentences, annotationChar)).toEqual('');
  });

  it('should annotate a single sentence', () => {
    const sentences = ['Single sentence.'];
    const annotationChar = 'r';
    const expected = '<|r1|><Single sentence.><end||r>';
    expect(annotate(sentences, annotationChar)).toEqual(expected);
  });

  it('should use different annotation characters', () => {
    const sentences = ['Hello.'];
    const annotationChar = 'x';
    const expected = '<|x1|><Hello.><end||x>';
    expect(annotate(sentences, annotationChar)).toEqual(expected);
  });
});

describe('getOffsets', () => {
  it('should calculate correct offsets for multiple sentences', () => {
    const originalString = 'First sentence. Second sentence. Third sentence.';
    const sentences = [
      'First sentence. ',
      'Second sentence. ',
      'Third sentence.',
    ];
    const expected = new Map([
      [1, { startOffset: 0, endOffset: 16 }],
      [2, { startOffset: 16, endOffset: 33 }],
      [3, { startOffset: 33, endOffset: 48 }],
    ]);
    expect(getOffsets(originalString, sentences)).toEqual(expected);
  });

  it('should handle empty original string and sentences', () => {
    const originalString = '';
    const sentences = [];
    expect(getOffsets(originalString, sentences)).toEqual(new Map());
  });

  it('should handle original string matching sentences exactly', () => {
    const originalString = 'Hello world.';
    const sentences = ['Hello world.'];
    const expected = new Map([[1, { startOffset: 0, endOffset: 12 }]]);
    expect(getOffsets(originalString, sentences)).toEqual(expected);
  });

  it('should handle original string with leading/trailing spaces', () => {
    const originalString = '  Sentence one.  Sentence two.  ';
    const sentences = ['Sentence one.  ', 'Sentence two.  '];
    const expected = new Map([
      [1, { startOffset: 2, endOffset: 17 }],
      [2, { startOffset: 17, endOffset: 32 }],
    ]);
    expect(getOffsets(originalString, sentences)).toEqual(expected);
  });

  it('should handle sentences with special characters', () => {
    const originalString = 'Sentence with !@#$%^&*() special characters.';
    const sentences = ['Sentence with !@#$%^&*() special characters.'];
    const expected = new Map([[1, { startOffset: 0, endOffset: 44 }]]);
    expect(getOffsets(originalString, sentences)).toEqual(expected);
  });
});

describe('createHalloumiPrompt', () => {
  it('should create a Halloumi prompt with annotated context and response', () => {
    const sources = [
      'This is the first source. This is its second sentence.',
      'This is the second source.',
    ];
    const response = 'This is the response. It has two sentences.';
    const request = 'Test request.';

    const result = createHalloumiPrompt({ sources, response, request });

    // Expect the prompt to contain annotated context and response
    expect(result.prompt).toContain(
      '<|context|><|s1|><This is the first source. ><end||s><|s2|><This is its second sentence.><end||s><|s3|><This is the second source.><end||s><end||context>',
    );
    expect(result.prompt).toContain('<|request|><Test request.><end||request>');
    expect(result.prompt).toContain(
      '<|response|><|r1|><This is the response. ><end||r><|r2|><It has two sentences.><end||r><end||response>',
    );

    // Expect contextOffsets and responseOffsets to be correctly populated
    expect(result.contextOffsets).toBeInstanceOf(Map);
    const s1 = 'This is the first source. ';
    const s2 = 'This is its second sentence.';
    const s3 = 'This is the second source.';

    expect(result.contextOffsets.get(1)).toEqual({
      startOffset: 0,
      endOffset: s1.length,
    });
    expect(result.contextOffsets.get(2)).toEqual({
      startOffset: s1.length,
      endOffset: s1.length + s2.length,
    });
    expect(result.contextOffsets.get(3)).toEqual({
      startOffset: s1.length + s2.length + 1, // +1 for the space between sentences
      endOffset: s1.length + s2.length + 1 + s3.length,
    });

    expect(result.responseOffsets).toBeInstanceOf(Map);
    const r1 = 'This is the response. ';
    const r2 = 'It has two sentences.';

    expect(result.responseOffsets.get(1)).toEqual({
      startOffset: 0,
      endOffset: r1.length,
    });
    expect(result.responseOffsets.get(2)).toEqual({
      startOffset: r1.length,
      endOffset: r1.length + r2.length,
    });
  });

  it('should handle empty sources, response, and request', () => {
    const sources = [];
    const response = '';
    const request = '';

    const result = createHalloumiPrompt({ sources, response, request });

    expect(result.prompt).toBe(
      '<|context|><end||context><|request|><Make one or more claims about information in the documents.><end||request><|response|><end||response>',
    );
    expect(result.contextOffsets).toBeInstanceOf(Map);
    expect(result.contextOffsets.size).toBe(0);
    expect(result.responseOffsets).toBeInstanceOf(Map);
    expect(result.responseOffsets.size).toBe(0);
  });

  it('should handle maxContextSegments correctly', () => {
    const sources = [
      'Sentence one. Sentence two. Sentence three. Sentence four.',
    ];
    const response = 'Response one. Response two.';
    const request = 'Test request.';
    const maxContextSegments = 2;

    const result = createHalloumiPrompt({
      sources,
      response,
      request,
      maxContextSegments,
    });

    // With maxContextSegments = 2, the 4 sentences should be merged into 2.
    // "Sentence one. Sentence two." and "Sentence three. Sentence four."
    expect(result.prompt).toContain(
      '<|context|><|s1|><Sentence one. Sentence two. ><end||s><|s2|><Sentence three. Sentence four.><end||s><end||context>',
    );
    const mergedS1 = 'Sentence one. Sentence two. ';
    const mergedS2 = 'Sentence three. Sentence four.';

    expect(result.contextOffsets.get(1)).toEqual({
      startOffset: 0,
      endOffset: mergedS1.length,
    });
    expect(result.contextOffsets.get(2)).toEqual({
      startOffset: mergedS1.length,
      endOffset: mergedS1.length + mergedS2.length,
    });
  });
});
