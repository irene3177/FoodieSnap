import { describe, it, expect, vi } from 'vitest';
import { handleApiError } from '../../../utils/apiErrorHandler';
import { isAxiosError } from 'axios';

// Mock axios error detection
vi.mock('axios', async () => {
  const actual = await vi.importActual('axios');
  return {
    ...actual,
    isAxiosError: vi.fn(),
  };
});

describe('handleApiError', () => {
  it('should handle axios error with response data error', () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        data: {
          error: 'Invalid credentials',
        },
      },
      message: 'Request failed',
    };
    
    vi.mocked(isAxiosError).mockReturnValue(true);
    
    const result = handleApiError(axiosError);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid credentials');
  });

  it('should handle axios error with response data message', () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        data: {
          message: 'User not found',
        },
      },
      message: 'Request failed',
    };
    
    vi.mocked(isAxiosError).mockReturnValue(true);
    
    const result = handleApiError(axiosError);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });

  it('should handle axios error with only message', () => {
    const axiosError = {
      isAxiosError: true,
      message: 'Network Error',
    };
    
    vi.mocked(isAxiosError).mockReturnValue(true);
    
    const result = handleApiError(axiosError);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network Error');
  });

  it('should handle regular Error object', () => {
    const regularError = new Error('Something went wrong');
    
    vi.mocked(isAxiosError).mockReturnValue(false);
    
    const result = handleApiError(regularError);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Something went wrong');
  });

  it('should handle unknown error type', () => {
    const unknownError = { some: 'object' };
    
    vi.mocked(isAxiosError).mockReturnValue(false);
    
    const result = handleApiError(unknownError);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('An unexpected error occurred');
  });

  it('should handle null or undefined', () => {
    vi.mocked(isAxiosError).mockReturnValue(false);
    
    const result = handleApiError(null);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('An unexpected error occurred');
  });
});