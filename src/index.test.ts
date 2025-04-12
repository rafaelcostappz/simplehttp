import { describe, it, expect, vi, afterAll } from 'vitest';
import http, { 
  get, 
  post, 
  put, 
  del, 
  patch, 
  createClient, 
  SimpleHttpError, 
  TimeoutError,
  VERSION
} from './index';

// Mock global fetch to avoid actual network requests
const originalFetch = global.fetch;
global.fetch = vi.fn().mockImplementation(() => {
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob())
  });
});

// Mock URL to avoid "Invalid URL" errors
const originalURL = global.URL;
global.URL = vi.fn() as any;
(global.URL as any).prototype.toString = vi.fn().mockReturnValue('https://example.com/test');
(global.URL as any).prototype.search = '';

describe('Library exports', () => {
  it('should export a default HTTP client', () => {
    expect(http).toBeDefined();
    expect(http.get).toBeTypeOf('function');
    expect(http.post).toBeTypeOf('function');
    expect(http.put).toBeTypeOf('function');
    expect(http.delete).toBeTypeOf('function');
    expect(http.patch).toBeTypeOf('function');
  });

  it('should export individual HTTP methods', () => {
    expect(get).toBeTypeOf('function');
    expect(post).toBeTypeOf('function');
    expect(put).toBeTypeOf('function');
    expect(del).toBeTypeOf('function');
    expect(patch).toBeTypeOf('function');
  });

  it('should export createClient function', () => {
    expect(createClient).toBeTypeOf('function');
    
    const client = createClient();
    expect(client).toHaveProperty('get');
    expect(client).toHaveProperty('post');
    expect(client).toHaveProperty('put');
    expect(client).toHaveProperty('delete');
    expect(client).toHaveProperty('patch');
  });

  it('should export error classes', () => {
    expect(SimpleHttpError).toBeDefined();
    expect(TimeoutError).toBeDefined();
    
    expect(new SimpleHttpError('test')).toBeInstanceOf(Error);
    expect(new TimeoutError(1000)).toBeInstanceOf(SimpleHttpError);
  });

  it('should export VERSION constant', () => {
    expect(VERSION).toBeDefined();
    expect(typeof VERSION).toBe('string');
  });
});

// Restore original implementations after tests
afterAll(() => {
  global.fetch = originalFetch;
  global.URL = originalURL;
});