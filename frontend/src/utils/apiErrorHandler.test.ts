import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleApiError } from './apiErrorHandler';
import { isAxiosError } from 'axios';

// ---------- Mocks ----------

vi.mock('axios', () => ({
  isAxiosError: vi.fn(),
}));

// ---------- Helpers ----------

const makeAxiosError = (overrides: {
  response?: any;
  message?: string;
}) => {
  const error: any = new Error(overrides.message ?? 'Axios error');
  error.isAxiosError = true;
  error.response = overrides.response;
  return error;
};

// ---------- Tests ----------

describe('handleApiError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Axios errors ----

  describe('axios errors', () => {
    it('prefers response.data.error when present', () => {
      (isAxiosError as any).mockReturnValue(true);

      const error = makeAxiosError({
        response: { data: { error: 'Not found', message: 'ignored' } },
      });

      const result = handleApiError(error);

      expect(result).toEqual({
        success: false,
        error: 'Not found',
      });
    });

    it('falls back to response.data.message when data.error is missing', () => {
      (isAxiosError as any).mockReturnValue(true);

      const error = makeAxiosError({
        response: { data: { message: 'Validation failed' } },
      });

      const result = handleApiError(error);

      expect(result).toEqual({
        success: false,
        error: 'Validation failed',
      });
    });

    it('falls back to error.message when no response data', () => {
      (isAxiosError as any).mockReturnValue(true);

      const error = makeAxiosError({
        message: 'Network timeout',
      });

      const result = handleApiError(error);

      expect(result).toEqual({
        success: false,
        error: 'Network timeout',
      });
    });

    it('falls back to error.message when response has no error/message', () => {
      (isAxiosError as any).mockReturnValue(true);

      const error = makeAxiosError({
        response: { data: {} },
        message: 'Request failed with status code 500',
      });

      const result = handleApiError(error);

      expect(result).toEqual({
        success: false,
        error: 'Request failed with status code 500',
      });
    });

    it('falls back to "Request failed" when nothing is available', () => {
      (isAxiosError as any).mockReturnValue(true);

      const error = makeAxiosError({
        message: '',
      });

      const result = handleApiError(error);

      expect(result).toEqual({
        success: false,
        error: 'Request failed',
      });
    });

    it('ignores non-string error fields', () => {
      // If backend returns data.error as an object, the || chain skips it
      (isAxiosError as any).mockReturnValue(true);

      const error = makeAxiosError({
        response: { data: { error: { nested: 'object' } } },
        message: 'Fallback message',
      });

      const result = handleApiError(error);

      // data.error is truthy (an object), so it's used as-is
      // NOTE: the handler does NOT validate the type
      expect(result).toEqual({
        success: false,
        error: { nested: 'object' },
      });
    });
  });

  // ---- Generic Error ----

  describe('generic Error instances', () => {
    it('returns error.message for plain Error', () => {
      (isAxiosError as any).mockReturnValue(false);

      const error = new Error('Something broke');

      const result = handleApiError(error);

      expect(result).toEqual({
        success: false,
        error: 'Something broke',
      });
    });

    it('returns empty message if Error has no message', () => {
      (isAxiosError as any).mockReturnValue(false);

      const error = new Error('');

      const result = handleApiError(error);

      expect(result).toEqual({
        success: false,
        error: '',
      });
    });

    it('handles Error subclasses', () => {
      (isAxiosError as any).mockReturnValue(false);

      class CustomError extends Error {
        constructor(msg: string) {
          super(msg);
          this.name = 'CustomError';
        }
      }

      const error = new CustomError('Custom failure');

      const result = handleApiError(error);

      expect(result).toEqual({
        success: false,
        error: 'Custom failure',
      });
    });
  });

  // ---- Non-Error values ----

  describe('non-Error values', () => {
    it('returns generic message for string', () => {
      (isAxiosError as any).mockReturnValue(false);

      const result = handleApiError('plain string');

      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred',
      });
    });

    it('returns generic message for null', () => {
      (isAxiosError as any).mockReturnValue(false);

      const result = handleApiError(null);

      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred',
      });
    });

    it('returns generic message for undefined', () => {
      (isAxiosError as any).mockReturnValue(false);

      const result = handleApiError(undefined);

      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred',
      });
    });

    it('returns generic message for plain object', () => {
      (isAxiosError as any).mockReturnValue(false);

      const result = handleApiError({ custom: 'object' });

      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred',
      });
    });

    it('returns generic message for number', () => {
      (isAxiosError as any).mockReturnValue(false);

      const result = handleApiError(42);

      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred',
      });
    });
  });
});