import {
  getClaimsFromResponse,
  getTokenProbabilitiesFromLogits,
} from './postprocessing';

describe('getClaimsFromResponse', () => {
  describe('well-formed responses', () => {
    it('should parse a single well-formed supported claim', () => {
      const response =
        '<|r1|><The weather is sunny.><|subclaims|><The weather is being described.><end||subclaims><|cite|><|s1|><end||cite><|supported|><|explain|><The document states it is sunny.><end||explain><end||r>';

      const claims = getClaimsFromResponse(response);

      expect(claims).toHaveLength(1);
      expect(claims[0].claimId).toBe(1);
      expect(claims[0].claimString).toBe('The weather is sunny.');
      expect(claims[0].subclaims).toEqual(['The weather is being described.']);
      expect(claims[0].segments).toEqual([1]);
      expect(claims[0].supported).toBe(true);
      expect(claims[0].explanation).toBe('The document states it is sunny.');
    });

    it('should parse a single well-formed unsupported claim', () => {
      const response =
        '<|r1|><The document mentions cats.><|subclaims|><The document makes some mention of cats.><end||subclaims><|cite|><None><end||cite><|unsupported|><|explain|><There is no mention of cats.><end||explain><end||r>';

      const claims = getClaimsFromResponse(response);

      expect(claims).toHaveLength(1);
      expect(claims[0].claimId).toBe(1);
      expect(claims[0].supported).toBe(false);
      expect(claims[0].segments).toEqual([]);
    });

    it('should parse multiple well-formed claims', () => {
      const response =
        '<|r1|><First claim.><|subclaims|><Sub1.><end||subclaims><|cite|><|s1|><end||cite><|supported|><|explain|><Explanation 1.><end||explain><end||r>' +
        '<|r2|><Second claim.><|subclaims|><Sub2.><end||subclaims><|cite|><|s2|,|s3|><end||cite><|unsupported|><|explain|><Explanation 2.><end||explain><end||r>' +
        '<|r3|><Third claim.><|subclaims|><Sub3.><end||subclaims><|cite|><|s4|><end||cite><|supported|><|explain|><Explanation 3.><end||explain><end||r>';

      const claims = getClaimsFromResponse(response);

      expect(claims).toHaveLength(3);
      expect(claims[0].claimId).toBe(1);
      expect(claims[0].supported).toBe(true);
      expect(claims[1].claimId).toBe(2);
      expect(claims[1].supported).toBe(false);
      expect(claims[1].segments).toEqual([2, 3]);
      expect(claims[2].claimId).toBe(3);
      expect(claims[2].supported).toBe(true);
    });

    it('should parse multiple subclaims correctly', () => {
      const response =
        '<|r1|><Main claim.><|subclaims|><Subclaim one.><Subclaim two.><Subclaim three.><end||subclaims><|cite|><|s1|><end||cite><|supported|><|explain|><Explanation.><end||explain><end||r>';

      const claims = getClaimsFromResponse(response);

      expect(claims).toHaveLength(1);
      expect(claims[0].subclaims).toEqual([
        'Subclaim one.',
        'Subclaim two.',
        'Subclaim three.',
      ]);
    });
  });

  describe('citation parsing', () => {
    it('should parse comma-separated citations', () => {
      const response =
        '<|r1|><Claim.><|subclaims|><Sub.><end||subclaims><|cite|><|s1|,|s2|,|s3|,|s4|><end||cite><|supported|><|explain|><Exp.><end||explain><end||r>';

      const claims = getClaimsFromResponse(response);

      expect(claims[0].segments).toEqual([1, 2, 3, 4]);
    });

    it('should parse citation ranges with dash', () => {
      const response =
        '<|r1|><Claim.><|subclaims|><Sub.><end||subclaims><|cite|><|s1-s5|><end||cite><|supported|><|explain|><Exp.><end||explain><end||r>';

      const claims = getClaimsFromResponse(response);

      expect(claims[0].segments).toEqual([1, 2, 3, 4, 5]);
    });

    it('should parse citation ranges with "to"', () => {
      const response =
        '<|r1|><Claim.><|subclaims|><Sub.><end||subclaims><|cite|><|s1 to s49|><end||cite><|supported|><|explain|><Exp.><end||explain><end||r>';

      const claims = getClaimsFromResponse(response);

      expect(claims[0].segments).toHaveLength(49);
      expect(claims[0].segments[0]).toBe(1);
      expect(claims[0].segments[48]).toBe(49);
    });

    it('should handle "None" citations', () => {
      const response =
        '<|r1|><Claim.><|subclaims|><Sub.><end||subclaims><|cite|><None><end||cite><|unsupported|><|explain|><Exp.><end||explain><end||r>';

      const claims = getClaimsFromResponse(response);

      expect(claims[0].segments).toEqual([]);
    });

    it('should parse mixed citation formats', () => {
      const response =
        '<|r1|><Claim.><|subclaims|><Sub.><end||subclaims><|cite|><|s1|,|s3-s5|,|s10|><end||cite><|supported|><|explain|><Exp.><end||explain><end||r>';

      const claims = getClaimsFromResponse(response);

      expect(claims[0].segments).toEqual([1, 3, 4, 5, 10]);
    });
  });

  describe('malformed responses with orphan segments', () => {
    it('should merge orphan segment with preceding claim', () => {
      // Malformed: subclaims appear after <end||r>
      const response =
        '<|r1|><First claim with proper format.><|subclaims|><Sub1.><end||subclaims><|cite|><|s1|><end||cite><|supported|><|explain|><Exp1.><end||explain><end||r>' +
        '<|r2|><Second claim without subclaims.><end||r>' +
        '<|subclaims|><Sub2.><end||subclaims><|cite|><|s2|><end||cite><|supported|><|explain|><Exp2.><end||explain><end||r>';

      const claims = getClaimsFromResponse(response);

      expect(claims).toHaveLength(2);
      expect(claims[0].claimId).toBe(1);
      expect(claims[0].claimString).toBe('First claim with proper format.');
      expect(claims[0].subclaims).toEqual(['Sub1.']);

      expect(claims[1].claimId).toBe(2);
      expect(claims[1].claimString).toBe('Second claim without subclaims.');
      expect(claims[1].subclaims).toEqual(['Sub2.']);
      expect(claims[1].segments).toEqual([2]);
      expect(claims[1].supported).toBe(true);
    });

    it('should handle multiple consecutive malformed claims', () => {
      const response =
        '<|r1|><Claim 1.><end||r>' +
        '<|subclaims|><Sub1.><end||subclaims><|cite|><|s1|><end||cite><|supported|><|explain|><Exp1.><end||explain><end||r>' +
        '<|r2|><Claim 2.><end||r>' +
        '<|subclaims|><Sub2.><end||subclaims><|cite|><|s2|><end||cite><|unsupported|><|explain|><Exp2.><end||explain><end||r>' +
        '<|r3|><Claim 3.><end||r>' +
        '<|subclaims|><Sub3.><end||subclaims><|cite|><|s3|><end||cite><|supported|><|explain|><Exp3.><end||explain><end||r>';

      const claims = getClaimsFromResponse(response);

      expect(claims).toHaveLength(3);
      expect(claims[0].claimId).toBe(1);
      expect(claims[0].subclaims).toEqual(['Sub1.']);
      expect(claims[0].supported).toBe(true);

      expect(claims[1].claimId).toBe(2);
      expect(claims[1].subclaims).toEqual(['Sub2.']);
      expect(claims[1].supported).toBe(false);

      expect(claims[2].claimId).toBe(3);
      expect(claims[2].subclaims).toEqual(['Sub3.']);
      expect(claims[2].supported).toBe(true);
    });

    it('should skip orphan segments that are not associated with claims', () => {
      const response =
        '<|subclaims|><Orphan subclaim.><end||subclaims><|cite|><|s1|><end||cite><|supported|><|explain|><Orphan exp.><end||explain><end||r>' +
        '<|r1|><Valid claim.><|subclaims|><Sub.><end||subclaims><|cite|><|s2|><end||cite><|supported|><|explain|><Exp.><end||explain><end||r>';

      const claims = getClaimsFromResponse(response);

      expect(claims).toHaveLength(1);
      expect(claims[0].claimId).toBe(1);
      expect(claims[0].claimString).toBe('Valid claim.');
    });
  });

  describe('edge cases', () => {
    it('should return empty array for empty response', () => {
      const claims = getClaimsFromResponse('');
      expect(claims).toEqual([]);
    });

    it('should return empty array for response with only end tags', () => {
      const claims = getClaimsFromResponse('<end||r><end||r><end||r>');
      expect(claims).toEqual([]);
    });

    it('should handle response without cite tag', () => {
      const response =
        '<|r1|><Claim.><|subclaims|><Sub.><end||subclaims><|supported|><|explain|><Exp.><end||explain><end||r>';

      const claims = getClaimsFromResponse(response);

      expect(claims).toHaveLength(1);
      expect(claims[0].segments).toEqual([]);
    });

    it('should handle response without explain tag', () => {
      const response =
        '<|r1|><Claim.><|subclaims|><Sub.><end||subclaims><|cite|><|s1|><end||cite><|supported|><end||r>';

      const claims = getClaimsFromResponse(response);

      expect(claims).toHaveLength(1);
      expect(claims[0].explanation).toBe('');
    });

    it('should handle response without supported/unsupported tag (defaults to true)', () => {
      const response =
        '<|r1|><Claim.><|subclaims|><Sub.><end||subclaims><|cite|><|s1|><end||cite><|explain|><Exp.><end||explain><end||r>';

      const claims = getClaimsFromResponse(response);

      expect(claims).toHaveLength(1);
      expect(claims[0].supported).toBe(true);
    });

    it('should handle malformed claim without orphan (missing all verification data)', () => {
      const response = '<|r1|><Claim without any verification data.><end||r>';

      const claims = getClaimsFromResponse(response);

      expect(claims).toHaveLength(1);
      expect(claims[0].claimId).toBe(1);
      expect(claims[0].claimString).toBe(
        'Claim without any verification data.',
      );
      expect(claims[0].subclaims).toEqual([]);
      expect(claims[0].segments).toEqual([]);
      expect(claims[0].explanation).toBe('');
      expect(claims[0].supported).toBe(true); // defaults to true
    });

    it('should handle claims with special characters in content', () => {
      const response =
        '<|r1|><CO₂ emissions ≈ 417 Mt (–30% vs. 1990).><|subclaims|><Emissions data with special chars: €, £, ¥.><end||subclaims><|cite|><|s1|><end||cite><|supported|><|explain|><Unicode: émissions, naïve.><end||explain><end||r>';

      const claims = getClaimsFromResponse(response);

      expect(claims).toHaveLength(1);
      expect(claims[0].claimString).toBe(
        'CO₂ emissions ≈ 417 Mt (–30% vs. 1990).',
      );
      expect(claims[0].subclaims).toEqual([
        'Emissions data with special chars: €, £, ¥.',
      ]);
    });

    it('should handle claims with markdown table content', () => {
      const response =
        '<|r1|><| Year | Emissions |><|subclaims|><Table data.><end||subclaims><|cite|><|s1|><end||cite><|supported|><|explain|><Contains table.><end||explain><end||r>';

      const claims = getClaimsFromResponse(response);

      expect(claims).toHaveLength(1);
      expect(claims[0].claimString).toBe('| Year | Emissions |');
    });
  });

  describe('real-world examples', () => {
    it('should parse the example from the code comments', () => {
      const response =
        '<|r1|><There is no information about the average lifespan of a giant squid in the deep waters of the Pacific Ocean in the provided document.><|subclaims|><The document contains information about the average lifespan of a giant squid.><The information about giant squid lifespan is related to the Pacific Ocean.><end||subclaims><|cite|><|s1 to s49|><end||cite><|explain|><Upon reviewing the entire document, there is no mention of giant squid or any related topic, including their average lifespan or the Pacific Ocean. The document is focused on international relations, diplomacy, and conflict resolution.><end||explain><|supported|><end||r>' +
        "<|r2|><The document is focused on international relations, diplomacy, and conflict resolution, and does not mention giant squid or any related topic.><|subclaims|><The document is focused on international relations, diplomacy, and conflict resolution.><The document does not mention giant squid or any related topic.><end||subclaims><|cite|><|s1|,|s2|,|s3|,|s4|><end||cite><|explain|><The first four sentences clearly establish the document's focus on international relations, diplomacy, and conflict resolution, and there is no mention of giant squid or any related topic throughout the document.><end||explain><|supported|><end||r>" +
        '<|r3|><The document mentions cats.><|subclaims|><The document makes some mention of cats.><end||subclaims><|cite|><None><end||cite><|explain|><There is no mention of cats anywhere in the document.><end||explain><|unsupported|><end||r>';

      const claims = getClaimsFromResponse(response);

      expect(claims).toHaveLength(3);

      // Claim 1
      expect(claims[0].claimId).toBe(1);
      expect(claims[0].subclaims).toHaveLength(2);
      expect(claims[0].segments).toHaveLength(49);
      expect(claims[0].supported).toBe(true);

      // Claim 2
      expect(claims[1].claimId).toBe(2);
      expect(claims[1].segments).toEqual([1, 2, 3, 4]);
      expect(claims[1].supported).toBe(true);

      // Claim 3
      expect(claims[2].claimId).toBe(3);
      expect(claims[2].segments).toEqual([]);
      expect(claims[2].supported).toBe(false);
    });
  });
});

describe('getTokenProbabilitiesFromLogits', () => {
  const tokenChoices = new Set(['supported', 'unsupported']);

  it('should extract probabilities for matching tokens', () => {
    const logits = [
      {
        token: 'supported',
        logprob: -0.1,
        top_logprobs: [
          { token: 'supported', logprob: -0.1 },
          { token: 'unsupported', logprob: -2.5 },
        ],
      },
    ];

    const probabilities = getTokenProbabilitiesFromLogits(logits, tokenChoices);

    expect(probabilities).toHaveLength(1);
    expect(probabilities[0].get('supported')).toBeGreaterThan(0.5);
    expect(probabilities[0].get('unsupported')).toBeLessThan(0.5);
  });

  it('should skip non-matching tokens', () => {
    const logits = [
      {
        token: '<',
        logprob: -0.001,
        top_logprobs: [{ token: '<', logprob: -0.001 }],
      },
      {
        token: '|',
        logprob: -0.001,
        top_logprobs: [{ token: '|', logprob: -0.001 }],
      },
      {
        token: 'supported',
        logprob: -0.1,
        top_logprobs: [
          { token: 'supported', logprob: -0.1 },
          { token: 'unsupported', logprob: -2.5 },
        ],
      },
      {
        token: '|',
        logprob: -0.001,
        top_logprobs: [{ token: '|', logprob: -0.001 }],
      },
    ];

    const probabilities = getTokenProbabilitiesFromLogits(logits, tokenChoices);

    expect(probabilities).toHaveLength(1);
  });

  it('should handle multiple supported/unsupported tokens', () => {
    const logits = [
      {
        token: 'supported',
        logprob: -0.1,
        top_logprobs: [
          { token: 'supported', logprob: -0.1 },
          { token: 'unsupported', logprob: -3.0 },
        ],
      },
      {
        token: 'unsupported',
        logprob: -0.2,
        top_logprobs: [
          { token: 'unsupported', logprob: -0.2 },
          { token: 'supported', logprob: -2.8 },
        ],
      },
      {
        token: 'supported',
        logprob: -0.5,
        top_logprobs: [
          { token: 'supported', logprob: -0.5 },
          { token: 'unsupported', logprob: -1.5 },
        ],
      },
    ];

    const probabilities = getTokenProbabilitiesFromLogits(logits, tokenChoices);

    expect(probabilities).toHaveLength(3);
    // First token: strongly supported
    expect(probabilities[0].get('supported')).toBeGreaterThan(0.9);
    // Second token: strongly unsupported
    expect(probabilities[1].get('unsupported')).toBeGreaterThan(0.9);
    // Third token: moderately supported
    expect(probabilities[2].get('supported')).toBeGreaterThan(0.5);
  });

  it('should return empty array for empty logits', () => {
    const probabilities = getTokenProbabilitiesFromLogits([], tokenChoices);
    expect(probabilities).toEqual([]);
  });

  it('should return empty array when no matching tokens', () => {
    const logits = [
      {
        token: 'other',
        logprob: -0.1,
        top_logprobs: [{ token: 'other', logprob: -0.1 }],
      },
    ];

    const probabilities = getTokenProbabilitiesFromLogits(logits, tokenChoices);
    expect(probabilities).toEqual([]);
  });

  it('should handle missing token in top_logprobs', () => {
    const logits = [
      {
        token: 'supported',
        logprob: -0.1,
        top_logprobs: [
          { token: 'supported', logprob: -0.1 },
          // 'unsupported' not in top_logprobs
        ],
      },
    ];

    const probabilities = getTokenProbabilitiesFromLogits(logits, tokenChoices);

    expect(probabilities).toHaveLength(1);
    // Should still have both keys
    expect(probabilities[0].has('supported')).toBe(true);
    expect(probabilities[0].has('unsupported')).toBe(true);
    // Supported should have high probability since unsupported is estimated lower
    expect(probabilities[0].get('supported')).toBeGreaterThan(0.5);
  });

  it('should apply softmax correctly', () => {
    const logits = [
      {
        token: 'supported',
        logprob: 0, // e^0 = 1
        top_logprobs: [
          { token: 'supported', logprob: 0 },
          { token: 'unsupported', logprob: 0 }, // e^0 = 1
        ],
      },
    ];

    const probabilities = getTokenProbabilitiesFromLogits(logits, tokenChoices);

    // With equal logprobs, softmax should give 0.5 each
    expect(probabilities[0].get('supported')).toBeCloseTo(0.5, 5);
    expect(probabilities[0].get('unsupported')).toBeCloseTo(0.5, 5);
  });
});
