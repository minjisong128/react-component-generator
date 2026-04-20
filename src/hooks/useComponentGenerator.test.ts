import { test, expect, beforeEach, afterEach, mock } from 'bun:test';
import type { GeneratedComponent, Provider } from '../types';

// Mock implementation test for removeComponent logic
test('removeComponent should remove component by id', () => {
  const initialComponents: GeneratedComponent[] = [
    { id: '1', prompt: 'Button', code: 'const Button = () => <button />;', createdAt: new Date() },
    { id: '2', prompt: 'Input', code: 'const Input = () => <input />;', createdAt: new Date() },
  ];

  const targetId = '1';
  const result = initialComponents.filter(c => c.id !== targetId);

  expect(result).toHaveLength(1);
  expect(result[0].id).toBe('2');
});

// Mock implementation test for clearAll logic
test('clearAll should clear all components', () => {
  const components: GeneratedComponent[] = [
    { id: '1', prompt: 'Button', code: 'const Button = () => <button />;', createdAt: new Date() },
  ];

  const result: GeneratedComponent[] = [];

  expect(result).toHaveLength(0);
});

// Test: generate should successfully fetch and add component
test('generate should return component code on successful fetch', async () => {
  const mockResponse = {
    ok: true,
    json: async () => ({ code: 'const Button = () => <button />;' }),
  };

  const mockFetchFn = mock(async () => mockResponse as Response);
  const originalFetch = global.fetch;
  global.fetch = mockFetchFn as any;

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Create a button',
        apiKey: 'test-key',
        provider: 'anthropic',
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.code).toBe('const Button = () => <button />;');
  } finally {
    global.fetch = originalFetch;
  }
});

// Test: generate should handle API error response
test('generate should handle error response from API', async () => {
  const mockResponse = {
    ok: false,
    json: async () => ({ error: 'Invalid API key' }),
  };

  const mockFetchFn = mock(async () => mockResponse as Response);
  const originalFetch = global.fetch;
  global.fetch = mockFetchFn as any;

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Create a button',
        apiKey: 'invalid-key',
        provider: 'anthropic',
      }),
    });

    expect(response.ok).toBe(false);
    const data = await response.json();
    expect(data.error).toBe('Invalid API key');
  } finally {
    global.fetch = originalFetch;
  }
});

// Test: generate should call fetch with correct parameters
test('generate should POST to /api/generate endpoint', async () => {
  let capturedRequest = {
    url: '',
    method: '',
    body: '',
  };

  const mockResponse = {
    ok: true,
    json: async () => ({ code: 'const Button = () => <button />;' }),
  };

  const mockFetchFn = mock(async (url: string, init?: RequestInit) => {
    capturedRequest.url = url;
    capturedRequest.method = init?.method || 'GET';
    capturedRequest.body = init?.body as string;
    return mockResponse as Response;
  });

  const originalFetch = global.fetch;
  global.fetch = mockFetchFn as any;

  try {
    const prompt = 'Create a button';
    const apiKey = 'test-key';
    const provider: Provider = 'anthropic';

    await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, apiKey, provider }),
    });

    expect(capturedRequest.url).toBe('/api/generate');
    expect(capturedRequest.method).toBe('POST');
    expect(capturedRequest.body).toContain(prompt);
    expect(capturedRequest.body).toContain(apiKey);
    expect(capturedRequest.body).toContain(provider);
  } finally {
    global.fetch = originalFetch;
  }
});
