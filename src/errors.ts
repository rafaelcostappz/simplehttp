import { HttpError } from './types';

/**
 * Custom error class for HTTP client errors.
 */
export class SimpleHttpError extends Error implements HttpError {
  status?: number;
  data?: any;
  response?: Response;
  request?: RequestInit;

  constructor(message: string, options?: Partial<HttpError>) {
    super(message);
    this.name = 'SimpleHttpError';
    
    if (options) {
      this.status = options.status;
      this.data = options.data;
      this.response = options.response;
      this.request = options.request;
    }
    
    // This is needed for instanceof to work correctly in ES5
    Object.setPrototypeOf(this, SimpleHttpError.prototype);
  }

  /**
   * Converts the error to a plain object for logging or serialization.
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      data: this.data
    };
  }
}

/**
 * Error thrown when a request times out.
 */
export class TimeoutError extends SimpleHttpError {
  constructor(timeout: number, request?: RequestInit) {
    super(`Request timed out after3 ${timeout}ms`, { request });
    this.name = 'TimeoutError';
    
    // This is needed for instanceof to work correctly in ES5
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}