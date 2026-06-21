import middleware from './middleware';
import { isPathAllowed } from '../middleware';

jest.mock('./generative');

describe('halloumi middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      url: '/_v1_ha/generate',
      method: 'POST',
      body: {
        sources: ['source1', 'source2'],
        answer: 'test answer',
        maxContextSegments: 3,
      },
      headers: {},
      ip: '127.0.0.1',
    };
    res = {
      send: jest.fn(),
      set: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns error when LLMGW_TOKEN is missing', async () => {
    const origToken = process.env.LLMGW_TOKEN;
    const origUrl = process.env.LLMGW_URL;
    delete process.env.LLMGW_TOKEN;
    delete process.env.LLMGW_URL;

    await middleware(req, res, next);

    expect(res.send).toHaveBeenCalledWith({
      error: 'Invalid configuration: missing LLMGW_TOKEN or LLMGW_URL',
    });

    process.env.LLMGW_TOKEN = origToken;
    process.env.LLMGW_URL = origUrl;
  });

  it('rejects disallowed paths with 404', async () => {
    req.url = '/_v1_ha/admin/config';
    req.method = 'POST';

    await middleware(req, res, next);

    expect(res.statusCode).toBe(404);
    expect(res.send).toHaveBeenCalledWith({ error: 'Not Found' });
  });

  it('rejects allowed path with wrong HTTP method', async () => {
    req.url = '/_v1_ha/generate';
    req.method = 'GET';

    await middleware(req, res, next);

    expect(res.statusCode).toBe(404);
    expect(res.send).toHaveBeenCalledWith({ error: 'Not Found' });
  });
});

// These tests need a fresh module loaded with env vars set so that
// LLMGW_TOKEN and LLMGW_URL are defined at module load time,
// allowing the code to reach getVerifyClaimResponse.
describe('halloumi middleware - dynamic import', () => {
  const buildReq = () => ({
    url: '/_v1_ha/generate',
    method: 'POST',
    body: {
      sources: ['source1', 'source2'],
      answer: 'test answer',
      maxContextSegments: 3,
    },
    headers: {},
    ip: '127.0.0.1',
  });

  const buildRes = () => ({
    send: jest.fn(),
    set: jest.fn(),
    status: jest.fn().mockReturnThis(),
  });

  it('sends response on successful getVerifyClaimResponse', async () => {
    const origToken = process.env.LLMGW_TOKEN;
    const origUrl = process.env.LLMGW_URL;
    process.env.LLMGW_TOKEN = 'test-token';
    process.env.LLMGW_URL = 'http://test-url';

    jest.resetModules();

    const mockGetVerifyClaimResponse = jest
      .fn()
      .mockResolvedValue({ claims: [], segments: {} });

    jest.setMock('./generative', {
      getVerifyClaimResponse: mockGetVerifyClaimResponse,
    });

    const middlewareMod = require('./middleware').default;

    const req = buildReq();
    const res = buildRes();

    await middlewareMod(req, res, jest.fn());

    expect(mockGetVerifyClaimResponse).toHaveBeenCalled();
    expect(res.set).toHaveBeenCalledWith('Content-Type', 'application/json');
    expect(res.send).toHaveBeenCalledWith({ claims: [], segments: {} });

    process.env.LLMGW_TOKEN = origToken;
    process.env.LLMGW_URL = origUrl;
  });

  it('handles errors from getVerifyClaimResponse', async () => {
    const origToken = process.env.LLMGW_TOKEN;
    const origUrl = process.env.LLMGW_URL;
    process.env.LLMGW_TOKEN = 'test-token';
    process.env.LLMGW_URL = 'http://test-url';

    jest.resetModules();

    const mockGetVerifyClaimResponse = jest
      .fn()
      .mockRejectedValue(new Error('LLM error'));

    jest.setMock('./generative', {
      getVerifyClaimResponse: mockGetVerifyClaimResponse,
    });

    const middlewareMod = require('./middleware').default;

    const req = buildReq();
    const res = buildRes();

    await middlewareMod(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('LLM error') }),
    );

    process.env.LLMGW_TOKEN = origToken;
    process.env.LLMGW_URL = origUrl;
  });
});

describe('halloumi path allowlist', () => {
  // Mirror of ALLOWED_HALLOUMI_PATHS from middleware.js
  const ALLOWED_HALLOUMI_PATHS = [
    { path: '/generate', methods: ['POST'] },
    { path: '/classify', methods: ['POST'] },
  ];

  it('allows /generate with POST', () => {
    expect(isPathAllowed('/generate', 'POST', ALLOWED_HALLOUMI_PATHS)).toBe(
      true,
    );
  });

  it('allows /classify with POST', () => {
    expect(isPathAllowed('/classify', 'POST', ALLOWED_HALLOUMI_PATHS)).toBe(
      true,
    );
  });

  it('rejects /generate with wrong method', () => {
    expect(isPathAllowed('/generate', 'GET', ALLOWED_HALLOUMI_PATHS)).toBe(
      false,
    );
  });

  it('rejects disallowed paths', () => {
    expect(isPathAllowed('/admin/config', 'POST', ALLOWED_HALLOUMI_PATHS)).toBe(
      false,
    );
    expect(
      isPathAllowed('/../../etc/passwd', 'POST', ALLOWED_HALLOUMI_PATHS),
    ).toBe(false);
  });
});
