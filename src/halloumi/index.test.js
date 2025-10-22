import { halloumiGenerativeAPI } from './index';

describe('halloumiGenerativeAPI with MOCK_LLM_CALL', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules(); // Most important - reset modules between test runs
    process.env = { ...originalEnv, MOCK_LLM_CALL: 'true', MOCK_INDEX: '3' };
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
    expect(response[0].citations).toEqual([
      38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
    ]);
  });
});
