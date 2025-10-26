import {
  halloumiGenerativeAPI,
  convertGenerativesClaimToVerifyClaimResponse,
} from './generative';
import path from 'path';

describe('halloumiGenerativeAPI reads from mock file', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules(); // Most important - reset modules between test runs
    process.env = {
      ...originalEnv,
      MOCK_HALLOUMI_FILE_PATH: path.join(__dirname, '../dummy/qa-raw-3.json'),
    };
  });

  afterEach(() => {
    process.env = originalEnv; // Restore original env
    jest.restoreAllMocks(); // Restore all mocks
  });

  it('should read from the mock file when MOCK_LLM_CALL is true', async () => {
    const model = { name: 'test-model', apiUrl: 'http://test.com' };
    const prompt = {
      prompt: 'test-prompt',
      contextOffsets: new Map([[1, { startOffset: 0, endOffset: 10 }]]),
      responseOffsets: new Map([[1, { startOffset: 0, endOffset: 20 }]]),
    };

    // We are testing halloumiGenerativeAPI which internally calls getLLMResponse
    // and getLLMResponse uses the MOCK_LLM_CALL env variable.
    const response = await halloumiGenerativeAPI(model, prompt);

    expect(response[0].claimString).toEqual(
      '**France – total waste generation (latest available data)**  \n',
    );
    expect(response[0].segments).toEqual([
      38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
    ]);
  });
});

describe('convertGenerativesClaimToVerifyClaimResponse', () => {
  it('should correctly convert generative claims to verify claim response', () => {
    const generativeClaims = [
      {
        claimId: 1,
        claimString: 'Test claim string',
        subclaims: ['subclaim1', 'subclaim2'],
        segments: [1, 2, 3],
        explanation: 'Test explanation',
        supported: true,
        probabilities: new Map([
          ['supported', 0.9],
          ['unsupported', 0.1],
        ]),
      },
    ];

    const prompt = {
      contextOffsets: new Map([[1, { startOffset: 0, endOffset: 10 }]]),
      responseOffsets: new Map([[1, { startOffset: 100, endOffset: 120 }]]),
    };

    const result = convertGenerativesClaimToVerifyClaimResponse(
      generativeClaims,
      prompt,
    );

    expect(result).toEqual({
      claims: [
        {
          startOffset: 100,
          endOffset: 120,
          rationale: 'Test explanation',
          segmentIds: ['1', '2', '3'],
          score: 0.9,
        },
      ],
      segments: {
        1: { id: '1', startOffset: 0, endOffset: 10 },
      },
    });
  });
});
