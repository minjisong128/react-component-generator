import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { handleRequest, CORS_HEADERS } from '../index.ts';
import { resolveApiKey } from '../utils/index.ts';

describe('Routes Integration Tests', () => {
  // CORS verification helper
  const verifyCorsHeaders = (response: Response) => {
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe(
      'GET, POST, OPTIONS'
    );
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe(
      'Content-Type'
    );
  };

  describe('OPTIONS request', () => {
    it('returns 200 status with CORS headers', async () => {
      const req = new Request('http://localhost:3002/api/generate', {
        method: 'OPTIONS',
      });

      const response = await handleRequest(req);

      expect(response.status).toBe(200);
      verifyCorsHeaders(response);
    });
  });

  describe('GET /api/config', () => {
    it('returns 200 status', async () => {
      const req = new Request('http://localhost:3002/api/config', {
        method: 'GET',
      });

      const response = await handleRequest(req);

      expect(response.status).toBe(200);
    });

    it('returns envKeys object with anthropic and google keys', async () => {
      const req = new Request('http://localhost:3002/api/config', {
        method: 'GET',
      });

      const response = await handleRequest(req);
      const data = (await response.json()) as {
        envKeys: { anthropic: boolean; google: boolean };
      };

      expect(data).toHaveProperty('envKeys');
      expect(typeof data.envKeys.anthropic).toBe('boolean');
      expect(typeof data.envKeys.google).toBe('boolean');
    });

    it('includes CORS headers in response', async () => {
      const req = new Request('http://localhost:3002/api/config', {
        method: 'GET',
      });

      const response = await handleRequest(req);

      verifyCorsHeaders(response);
    });
  });

  describe('POST /api/generate validation', () => {
    it('returns 400 when prompt is missing', async () => {
      const req = new Request('http://localhost:3002/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: 'test-key',
          provider: 'anthropic',
        }),
      });

      const response = await handleRequest(req);

      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Prompt is required');
    });

    it('returns 400 when prompt is empty string', async () => {
      const req = new Request('http://localhost:3002/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: '',
          apiKey: 'test-key',
          provider: 'anthropic',
        }),
      });

      const response = await handleRequest(req);

      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Prompt is required');
    });

    it('returns 400 when prompt is only whitespace', async () => {
      const req = new Request('http://localhost:3002/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: '   ',
          apiKey: 'test-key',
          provider: 'anthropic',
        }),
      });

      const response = await handleRequest(req);

      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe('Prompt is required');
    });

    it('returns 400 when API key is missing and not in env', async () => {
      const originalKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      const req = new Request('http://localhost:3002/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'blue button',
          provider: 'anthropic',
        }),
      });

      const response = await handleRequest(req);

      if (originalKey) process.env.ANTHROPIC_API_KEY = originalKey;

      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toContain('API key is required');
    });

    it('includes CORS headers on validation error responses', async () => {
      const req = new Request('http://localhost:3002/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: '',
          apiKey: 'test-key',
        }),
      });

      const response = await handleRequest(req);

      verifyCorsHeaders(response);
    });
  });

  describe('404 Not Found', () => {
    it('returns 404 for unmatched routes', async () => {
      const req = new Request('http://localhost:3002/api/unknown', {
        method: 'GET',
      });

      const response = await handleRequest(req);

      expect(response.status).toBe(404);
    });

    it('returns error object with "Not found" message', async () => {
      const req = new Request('http://localhost:3002/invalid/path', {
        method: 'POST',
      });

      const response = await handleRequest(req);
      const data = (await response.json()) as { error: string };

      expect(data.error).toBe('Not found');
    });

    it('includes CORS headers on 404 responses', async () => {
      const req = new Request('http://localhost:3002/unknown', {
        method: 'GET',
      });

      const response = await handleRequest(req);

      verifyCorsHeaders(response);
    });
  });

  describe('resolveApiKey utility function', () => {
    it('returns client API key when provided', () => {
      const result = resolveApiKey('anthropic', 'client-key');

      expect(result).toBe('client-key');
    });

    it('prioritizes client key over environment variable', () => {
      process.env.ANTHROPIC_API_KEY = 'env-key';

      const result = resolveApiKey('anthropic', 'client-key');

      expect(result).toBe('client-key');
    });

    it('returns environment key when client key is not provided', () => {
      process.env.ANTHROPIC_API_KEY = 'env-key';

      const result = resolveApiKey('anthropic');

      expect(result).toBe('env-key');
    });

    it('returns null when no key is available', () => {
      const originalKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      const result = resolveApiKey('anthropic');

      if (originalKey) process.env.ANTHROPIC_API_KEY = originalKey;

      expect(result).toBeNull();
    });

    it('works for google provider', () => {
      const result = resolveApiKey('google', 'google-client-key');

      expect(result).toBe('google-client-key');
    });
  });
});
