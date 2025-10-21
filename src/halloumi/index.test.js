import { halloumiGenerativeAPI } from './index';
import fs from 'fs';
import path from 'path';

// Mock the getLLMResponse function directly for testing its mocking behavior
// Since getLLMResponse is not exported, we need to mock the internal behavior
// or test halloumiGenerativeAPI which uses getLLMResponse.
// For this test, we will mock the fs.readFileSync to control the mock file content.

describe('halloumiGenerativeAPI with MOCK_LLM_CALL', () => {
  const originalEnv = process.env;
  const mockFilePath = path.join(
    path.dirname(require.resolve('@eeacms/volto-chatbot')),
    'dummy/qa-raw-test.json',
  );

  beforeEach(() => {
    jest.resetModules(); // Most important - reset modules between test runs
    process.env = { ...originalEnv, MOCK_LLM_CALL: 'true', MOCK_INDEX: 'test' };

    // Mock fs.readFileSync to return our dummy content
    jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(
      JSON.stringify({
        choices: [
          {
            message: {
              content: 'This is a mocked LLM response.',
            },
            logprobs: {
              content: [],
            },
          },
        ],
      }),
    );
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

    expect(fs.readFileSync).toHaveBeenCalledWith(mockFilePath, 'utf-8');
    expect(response[0].claim).toEqual('This is a test claim.');
    expect(response[0].citations).toEqual([1]);
    expect(response[0].explanation).toEqual('Test explanation.');
    expect(response[0].probabilities.get('supported')).toBeDefined();
    expect(response[0].probabilities.get('unsupported')).toBeDefined();
  });
});
