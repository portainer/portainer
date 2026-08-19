import { AxiosError } from 'axios';

import { defaultErrorParser } from './parseAxiosError';
import { createMockAxiosError } from './test-utils';

describe('defaultErrorParser', () => {
  describe('structured error responses', () => {
    it('should extract from errors array format', () => {
      const axiosError = createMockAxiosError({
        errors: [
          { message: 'Validation failed', details: 'Email is required' },
        ],
      });

      const result = defaultErrorParser(axiosError);

      expect(result.error.message).toBe('Validation failed');
      expect(result.details).toBe('Email is required');
    });

    it('should use message as details fallback in errors array format', () => {
      const axiosError = createMockAxiosError({
        errors: [{ message: 'Validation failed' }],
      });

      const result = defaultErrorParser(axiosError);

      expect(result.error.message).toBe('Validation failed');
      expect(result.details).toBe('Validation failed');
    });

    it('should extract from array format', () => {
      const axiosError = createMockAxiosError([
        { message: 'Not found', details: 'Resource does not exist' },
      ]);

      const result = defaultErrorParser(axiosError);

      expect(result.error.message).toBe('Not found');
      expect(result.details).toBe('Resource does not exist');
    });

    it('should extract from standard object format', () => {
      const axiosError = createMockAxiosError({
        message: 'Unauthorized',
        details: 'Invalid credentials',
      });

      const result = defaultErrorParser(axiosError);

      expect(result.error.message).toBe('Unauthorized');
      expect(result.details).toBe('Invalid credentials');
    });

    it('should use message as details fallback in standard format', () => {
      const axiosError = createMockAxiosError({
        message: 'Unauthorized',
      });

      const result = defaultErrorParser(axiosError);

      expect(result.error.message).toBe('Unauthorized');
      expect(result.details).toBe('Unauthorized');
    });
  });

  describe('common error property names', () => {
    it('should extract from "error" property', () => {
      const axiosError = createMockAxiosError({
        error: 'Something went wrong',
      });

      const result = defaultErrorParser(axiosError);

      expect(result.error.message).toBe('Something went wrong');
      expect(result.details).toBe('Something went wrong');
    });

    it('should extract from "err" property', () => {
      const axiosError = createMockAxiosError({
        err: 'Connection timeout',
      });

      const result = defaultErrorParser(axiosError);

      expect(result.error.message).toBe('Connection timeout');
      expect(result.details).toBe('Connection timeout');
    });

    it('should extract from "msg" property', () => {
      const axiosError = createMockAxiosError({
        msg: 'Bad request',
      });

      const result = defaultErrorParser(axiosError);

      expect(result.error.message).toBe('Bad request');
      expect(result.details).toBe('Bad request');
    });

    it('should extract from "detail" property (singular)', () => {
      const axiosError = createMockAxiosError({
        detail: 'Not allowed',
      });

      const result = defaultErrorParser(axiosError);

      expect(result.error.message).toBe('Not allowed');
      expect(result.details).toBe('Not allowed');
    });
  });

  describe('unknown object structure', () => {
    it('should extract first meaningful string value from object', () => {
      const axiosError = createMockAxiosError({
        code: 404,
        reason: 'Resource not found',
        timestamp: 1234567890,
      });

      const result = defaultErrorParser(axiosError);

      expect(result.error.message).toBe('Resource not found');
      expect(result.details).toBe('Resource not found');
    });

    it('should skip empty strings when extracting from object', () => {
      const axiosError = createMockAxiosError({
        empty: '',
        code: 500,
        reason: 'Server error',
      });

      const result = defaultErrorParser(axiosError);

      expect(result.error.message).toBe('Server error');
      expect(result.details).toBe('Server error');
    });

    it('should fall back to status code message when no strings found', () => {
      const axiosError = createMockAxiosError(
        {
          code: 404,
          timestamp: 1234567890,
        },
        404
      );

      const result = defaultErrorParser(axiosError);

      expect(result.error.message).toBe('Server returned error: 404');
      expect(result.details).toBe('Server returned error: 404');
    });

    it('should handle nested objects without stringifying', () => {
      const axiosError = createMockAxiosError(
        {
          nested: { deep: { value: 'should not stringify this' } },
          count: 42,
        },
        500
      );

      const result = defaultErrorParser(axiosError);

      // Should fall back to status message instead of stringifying
      expect(result.error.message).toBe('Server returned error: 500');
      expect(result.details).toBe('Server returned error: 500');
    });
  });

  describe('string responses', () => {
    it('should handle plain string error', () => {
      const axiosError = createMockAxiosError('Plain error message');

      const result = defaultErrorParser(axiosError);

      expect(result.error.message).toBe('Plain error message');
      expect(result.details).toBe('Plain error message');
    });

    it('should handle HTML error response', () => {
      const axiosError = createMockAxiosError('<html>Error page</html>');

      const result = defaultErrorParser(axiosError);

      expect(result.error.message).toBe('<html>Error page</html>');
      expect(result.details).toBe('<html>Error page</html>');
    });
  });

  describe('primitive types', () => {
    it('should handle number response', () => {
      const axiosError = createMockAxiosError(404);

      const result = defaultErrorParser(axiosError);

      expect(result.error.message).toBe('404');
      expect(result.details).toBe('404');
    });
  });

  describe('no response data', () => {
    it('should use HTTP status text when available', () => {
      const axiosError = createMockAxiosError(undefined, 403, 'Forbidden');

      const result = defaultErrorParser(axiosError);

      expect(result.error.message).toBe('Forbidden');
      expect(result.details).toBe('Forbidden');
    });

    it('should use axios error message when no response', () => {
      const axiosError = createMockAxiosError(
        undefined,
        undefined,
        undefined,
        'Network timeout'
      );

      const result = defaultErrorParser(axiosError);

      expect(result.error.message).toBe('Network timeout');
      expect(result.details).toBe('Network timeout');
    });

    it('should use fallback message when nothing available', () => {
      const axiosError = {
        name: 'AxiosError',
        message: '',
        config: {} as never,
        isAxiosError: true,
        toJSON: () => ({}),
      } as AxiosError;

      const result = defaultErrorParser(axiosError);

      expect(result.error.message).toBe('An unknown error occurred');
      expect(result.details).toBe('An unknown error occurred');
    });
  });

  describe('edge cases', () => {
    it('should handle null response data', () => {
      const axiosError = createMockAxiosError(null, 500);

      const result = defaultErrorParser(axiosError);

      // Should fall back to HTTP status code instead of generic message
      expect(result.error.message).toBe('Server returned error: 500');
      expect(result.details).toBe('Server returned error: 500');
    });

    it('should handle empty object', () => {
      const axiosError = createMockAxiosError({}, 500);
      const result = defaultErrorParser(axiosError);

      expect(result.error.message).toBe('Server returned error: 500');
      expect(result.details).toBe('Server returned error: 500');
    });

    it('should handle empty array', () => {
      const axiosError = createMockAxiosError([], 500);
      const result = defaultErrorParser(axiosError);

      expect(result.error.message).toBe('Server returned error: 500');
      expect(result.details).toBe('Server returned error: 500');
    });

    it('should handle empty string in response data', () => {
      const axiosError = createMockAxiosError('', 404);

      const result = defaultErrorParser(axiosError);

      // Empty string is treated as no usable data, so we fall back to HTTP status code
      expect(result.error.message).toBe('Server returned error: 404');
      expect(result.details).toBe('Server returned error: 404');
    });
  });

  describe('real-world scenarios', () => {
    it('should handle Docker API error format', () => {
      const axiosError = createMockAxiosError({
        message: 'container not found',
      });

      const result = defaultErrorParser(axiosError);

      expect(result.error.message).toBe('container not found');
      expect(result.details).toBe('container not found');
    });

    it('should handle Kubernetes API error format', () => {
      const axiosError = createMockAxiosError({
        kind: 'Status',
        status: 'Failure',
        message: 'pods "nginx" not found',
        reason: 'NotFound',
        code: 404,
      });

      const result = defaultErrorParser(axiosError);

      // Should extract the "message" property through common error property check
      expect(result.error.message).toBe('pods "nginx" not found');
      expect(result.details).toBe('pods "nginx" not found');
    });

    it('should handle REST API validation error', () => {
      const axiosError = createMockAxiosError({
        errors: [
          {
            message: 'Invalid input',
            details: 'Field "name" is required',
          },
        ],
      });

      const result = defaultErrorParser(axiosError);

      expect(result.error.message).toBe('Invalid input');
      expect(result.details).toBe('Field "name" is required');
    });

    it('should handle generic HTTP error with only status', () => {
      const axiosError = createMockAxiosError(
        undefined,
        503,
        'Service Unavailable'
      );

      const result = defaultErrorParser(axiosError);

      expect(result.error.message).toBe('Service Unavailable');
      expect(result.details).toBe('Service Unavailable');
    });
  });
});
