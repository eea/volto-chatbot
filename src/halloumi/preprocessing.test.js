import { createHalloumiPrompt } from './preprocessing';

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
