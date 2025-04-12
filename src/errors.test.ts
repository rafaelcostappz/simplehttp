import { describe, it, expect } from 'vitest';
import { SimpleHttpError, TimeoutError } from './errors';

describe('Error Classes', () => {
  describe('SimpleHttpError', () => {
    it('should create a basic error with message', () => {
      const error = new SimpleHttpError('Test error message');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(SimpleHttpError);
      expect(error.message).toBe('Test error message');
      expect(error.name).toBe('SimpleHttpError');
    });

    it('should include HTTP properties when provided', () => {
      const mockResponse = {} as Response;
      const mockRequest = {} as RequestInit;
      
      const error = new SimpleHttpError('HTTP error', {
        status: 404,
        data: { error: 'Not found' },
        response: mockResponse,
        request: mockRequest
      });

      expect(error.status).toBe(404);
      expect(error.data).toEqual({ error: 'Not found' });
      expect(error.response).toBe(mockResponse);
      expect(error.request).toBe(mockRequest);
    });

    it('should serialize to JSON correctly', () => {
      const error = new SimpleHttpError('Error message', {
        status: 500,
        data: { message: 'Server error' }
      });

      const json = error.toJSON();
      
      expect(json).toEqual({
        name: 'SimpleHttpError',
        message: 'Error message',
        status: 500,
        data: { message: 'Server error' }
      });
    });
  });

  describe('TimeoutError', () => {
    it('should create a timeout error with correct message', () => {
      const error = new TimeoutError(5000);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(SimpleHttpError);
      expect(error).toBeInstanceOf(TimeoutError);
      expect(error.message).toBe('Request timed out after 5000ms');
      expect(error.name).toBe('TimeoutError');
    });

    it('should include request details when provided', () => {
      const mockRequest = { method: 'GET' } as RequestInit;
      const error = new TimeoutError(1000, mockRequest);
      
      expect(error.request).toBe(mockRequest);
    });
  });
});