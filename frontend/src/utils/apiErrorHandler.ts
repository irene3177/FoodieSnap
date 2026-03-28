import { isAxiosError } from 'axios';

export interface ApiErrorResponse {
  success: false;
  error: string;
}

export const handleApiError = (error: unknown): ApiErrorResponse => {
  if (isAxiosError(error)) {
    // Server-side error
    return {
      success: false,
      error: error.response?.data?.error ||
            error.response?.data?.message ||
            error.message ||
            'Request failed'
    };
  }

  if (error instanceof Error) {
    // JS error
    return {
      success: false,
      error: error.message
    };
  }

  // Unexpected error
  return {
    success: false,
    error: 'An unexpected error occurred'
  };
};
