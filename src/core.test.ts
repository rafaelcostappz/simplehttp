import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import { request, createClient } from './core';
import { SimpleHttpError, TimeoutError } from './errors';

// Mock global fetch
const originalFetch = global.fetch;
let mockFetch: ReturnType<typeof vi.fn>;

// Mock Response class for testing
class MockResponse {
  status: number;
  statusText: string;
  ok: boolean;
  headers: Headers;
  _body: any;

  constructor(body: any, options: ResponseInit = {}) {
    this.status = options.status || 200;
    this.statusText = options.statusText || 'OK';
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = new Headers(options.headers);
    this._body = body;
  }

  json() {
    return Promise.resolve(this._body);
  }

  text() {
    return Promise.resolve(
      typeof this._body === 'string' ? this._body : JSON.stringify(this._body)
    );
  }

  blob() {
    return Promise.resolve(new Blob([JSON.stringify(this._body)]));
  }
}

// Mock URL constructor to avoid "Invalid URL" errors
const originalURL = global.URL;
global.URL = vi.fn() as any;
(global.URL as any).prototype.toString = vi.fn().mockReturnValue('https://example.com/test');
(global.URL as any).prototype.search = '';

beforeEach(() => {
  // Initialize mock fetch
  mockFetch = vi.fn().mockImplementation(() => 
    Promise.resolve(new MockResponse({}))
  );
  global.fetch = mockFetch as unknown as typeof global.fetch;
});

afterEach(() => {
  // Reset mocks and restore originals
  vi.resetAllMocks();
});

// Restore originals after all tests
afterAll(() => {
  global.fetch = originalFetch;
  global.URL = originalURL;
});

describe('HTTP Client', () => {
  describe('request function', () => {
    it('should make a GET request', async () => {
      // Mock response
      const mockResponseData = { data: 'test data' };
      const mockResponseObj = new MockResponse(mockResponseData, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      mockFetch.mockResolvedValueOnce(mockResponseObj);

      // Make request
      const response = await request('GET', '/test');

      // Verify fetch was called with correct arguments
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][1].method).toBe('GET');
      
      // Verify response
      expect(response.data).toEqual(mockResponseData);
      expect(response.status).toBe(200);
    });

    it('should make a POST request with JSON data', async () => {
      // Mock response
      const mockResponseData = { success: true };
      mockFetch.mockResolvedValueOnce(
        new MockResponse(mockResponseData, {
          headers: { 'Content-Type': 'application/json' }
        })
      );

      // Request data
      const requestData = { name: 'Test', value: 123 };

      // Make request
      const response = await request('POST', '/test', {
        data: requestData
      });

      // Verify fetch was called with correct arguments
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][1].method).toBe('POST');
      expect(mockFetch.mock.calls[0][1].body).toBe(JSON.stringify(requestData));
      expect(mockFetch.mock.calls[0][1].headers['Content-Type']).toBe('application/json');
      
      // Verify response
      expect(response.data).toEqual(mockResponseData);
    });

    it('should handle query parameters correctly', async () => {
      // Mock response
      mockFetch.mockResolvedValueOnce(
        new MockResponse({ data: 'test' }, {
          headers: { 'Content-Type': 'application/json' }
        })
      );

      // Mock URL.toString to capture params
      const mockToString = vi.fn().mockReturnValue('https://example.com/test?param1=value1&param2=123&param3=true');
      const originalToString = (global.URL as any).prototype.toString;
      (global.URL as any).prototype.toString = mockToString;

      // Make request with query params
      await request('GET', '/test', {
        params: {
          param1: 'value1',
          param2: 123,
          param3: true
        }
      });

      // Verify that createQueryString was called
      expect(mockToString).toHaveBeenCalled();
      
      // Restore original toString
      (global.URL as any).prototype.toString = originalToString;
    });

    it('should handle timeouts', async () => {
      // Mock setTimeout
      const originalSetTimeout = global.setTimeout;
      const mockSetTimeout = vi.fn().mockImplementation((callback, _timeout) => {
        callback(); // Execute o callback imediatamente
        return 123; // ID do timeout fictício
      });
      global.setTimeout = mockSetTimeout as unknown as typeof global.setTimeout;
      
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      // Create a mock abort controller that we can spy on
      const mockAbort = vi.fn();
      const originalAbortController = global.AbortController;
      
      // Replace AbortController with our mock
      global.AbortController = vi.fn().mockImplementation(() => ({
        signal: 'mock-signal',
        abort: mockAbort
      })) as any;

      // Mock fetch to throw AbortError when called with our mock signal
      mockFetch.mockImplementationOnce((_url, options) => {
        if (options.signal === 'mock-signal') {
          const error = new Error('The operation was aborted');
          error.name = 'AbortError';
          return Promise.reject(error);
        }
        return Promise.resolve(new MockResponse({}));
      });
      
      // Não precisamos mais de timers falsos, pois estamos executando o callback imediatamente
      // Start the request with a timeout
      const promise = request('GET', '/test', { timeout: 1000 });
      
      // Expect the request to reject with TimeoutError
      await expect(promise).rejects.toThrow(TimeoutError);
      
      // Verify clearTimeout was called
      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      // Clean up
      global.AbortController = originalAbortController;
      global.setTimeout = originalSetTimeout;
    });

    it('should handle HTTP errors', async () => {
      // Mock error response
      const errorData = { error: 'Not Found' };
      mockFetch.mockResolvedValueOnce(
        new MockResponse(errorData, {
          status: 404,
          statusText: 'Not Found',
          headers: { 'Content-Type': 'application/json' }
        })
      );

      // Make request and expect it to throw
      try {
        await request('GET', '/test');
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        // Verify the error properties
        expect(error).toBeInstanceOf(SimpleHttpError);
        if (error instanceof SimpleHttpError) {
          expect(error.status).toBe(404);
          expect(error.data).toEqual(errorData);
        }
      }
    });
  });

  describe('createClient', () => {
    it('should create a client with the correct methods', () => {
      const client = createClient();
      expect(client.get).toBeTypeOf('function');
      expect(client.post).toBeTypeOf('function');
      expect(client.put).toBeTypeOf('function');
      expect(client.delete).toBeTypeOf('function');
      expect(client.patch).toBeTypeOf('function');
    });

    it('should apply baseUrl configuration', async () => {
      // Create client with baseUrl
      const client = createClient({
        baseUrl: 'https://api.example.com'
      });

      // Mock response
      mockFetch.mockResolvedValueOnce(
        new MockResponse({ data: 'test' }, {
          headers: { 'Content-Type': 'application/json' }
        })
      );

      // Set up a spy to check URL construction
      const urlConstructorSpy = vi.spyOn(global, 'URL');

      // Make request
      await client.get('/test');

      // Verify URL construction called with correct base URL
      expect(urlConstructorSpy).toHaveBeenCalled();
      expect(urlConstructorSpy.mock.calls[0][1]).toBe('https://api.example.com/');
    });

    it('should apply default headers', async () => {
      // Create client with default headers
      const client = createClient({
        headers: {
          'Authorization': 'Bearer token123',
          'X-Custom-Header': 'CustomValue'
        }
      });

      // Mock response
      mockFetch.mockResolvedValueOnce(
        new MockResponse({ data: 'test' }, {
          headers: { 'Content-Type': 'application/json' }
        })
      );

      // Make request
      await client.get('/test');

      // Verify headers
      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers['Authorization']).toBe('Bearer token123');
      expect(headers['X-Custom-Header']).toBe('CustomValue');
    });

    it('should allow overriding default headers', async () => {
      // Create client with default headers
      const client = createClient({
        headers: {
          'Authorization': 'Bearer default-token',
          'X-Custom-Header': 'DefaultValue'
        }
      });

      // Mock response
      mockFetch.mockResolvedValueOnce(
        new MockResponse({ data: 'test' }, {
          headers: { 'Content-Type': 'application/json' }
        })
      );

      // Make request with overridden headers
      await client.get('/test', {
        headers: {
          'Authorization': 'Bearer override-token'
        }
      });

      // Verify headers
      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers['Authorization']).toBe('Bearer override-token');
      expect(headers['X-Custom-Header']).toBe('DefaultValue');
    });
  });
});