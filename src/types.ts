/**
 * HTTP request methods supported by the client.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * Request options for the HTTP client.
 */
export interface RequestOptions extends Omit<RequestInit, 'method' | 'body'> {
  /**
   * Request parameters to be added to the URL as query string.
   */
  params?: Record<string, string | number | boolean>;
  
  /**
   * Request body. Objects will be automatically serialized to JSON.
   */
  data?: any;
  
  /**
   * Request timeout in milliseconds.
   */
  timeout?: number;
  
  /**
   * Base URL to prepend to the request path.
   */
  baseUrl?: string;
}

/**
 * Config object for SimpleHttp instance.
 */
export interface HttpConfig {
  /**
   * Base URL for all requests.
   */
  baseUrl?: string;
  
  /**
   * Default headers to include in all requests.
   */
  headers?: Record<string, string>;
  
  /**
   * Default timeout for all requests in milliseconds.
   */
  timeout?: number;
  
  /**
   * Function to run before the request is made.
   */
  beforeRequest?: (options: RequestOptions) => RequestOptions;
  
  /**
   * Function to run after the response is received.
   */
  afterResponse?: <T>(response: Response, data: T) => T;
}

/**
 * Response from the HTTP client.
 */
export interface HttpResponse<T = any> {
  /**
   * Response data.
   */
  data: T;
  
  /**
   * HTTP status code.
   */
  status: number;
  
  /**
   * HTTP status text.
   */
  statusText: string;
  
  /**
   * Response headers.
   */
  headers: Headers;
  
  /**
   * Original response object.
   */
  response: Response;
}

/**
 * Error thrown by the HTTP client.
 */
export interface HttpError extends Error {
  /**
   * HTTP status code if available.
   */
  status?: number;
  
  /**
   * Response data if available.
   */
  data?: any;
  
  /**
   * Original response if available.
   */
  response?: Response;
  
  /**
   * Request options used.
   */
  request?: RequestOptions;
}