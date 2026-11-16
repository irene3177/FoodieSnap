import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------- Mocks ----------

const mockAxiosInstance = Object.assign(vi.fn(), {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
});
const mockResponseInterceptor = vi.fn();

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => {
      const instance: any = mockAxiosInstance;
      instance.interceptors = {
        response: {
          use: mockResponseInterceptor,
        },
      };
      return instance;
    }),
  },
}));

vi.mock('@/config', () => ({
  config: {
    apiUrl: '/api',
    timeout: 5000,
  },
}));

vi.mock('./apiErrorHandler', () => ({
  handleApiError: vi.fn(),
}));

vi.mock('@/store/store', () => ({
  store: {
    getState: vi.fn(() => ({
      auth: { isLoggingOut: false },
    })),
  },
}));

vi.mock('@/store/authSlice', () => ({
  selectIsLoggingOut: (state: any) => state.auth.isLoggingOut,
}));

// ---------- Helpers ----------

// Import AFTER mocks
const importApiClient = async () => {
  vi.resetModules();
  return import('./apiClient');
};

// Capture interceptor handler
let interceptorHandler: ((error: any) => Promise<never>) | null = null;

beforeEach(() => {
  vi.clearAllMocks();
  interceptorHandler = null;

  // Capture the error interceptor (second argument of response.use)
  mockResponseInterceptor.mockImplementation((_onFulfilled: any, onRejected: any) => {
    interceptorHandler = onRejected;
  });
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------- Tests ----------

describe('apiClient', () => {
  // ---- request helpers ----

  describe('request helpers', () => {
    it('get sends GET with params and returns data', async () => {
      const { get } = await importApiClient();
      mockAxiosInstance.mockResolvedValueOnce({
        data: { success: true, data: { id: 1 } },
      });

      const result = await get('/test', { page: 1 });

      expect(mockAxiosInstance).toHaveBeenCalledWith({
        method: 'GET',
        url: '/test',
        params: { page: 1 },
      });
      expect(result).toEqual({ success: true, data: { id: 1 } });
    });

    it('post sends POST with body', async () => {
      const { post } = await importApiClient();
      mockAxiosInstance.mockResolvedValueOnce({
        data: { success: true, data: { ok: true } },
      });

      const result = await post('/test', { name: 'x' });

      expect(mockAxiosInstance).toHaveBeenCalledWith({
        method: 'POST',
        url: '/test',
        data: { name: 'x' },
      });
      expect(result).toEqual({ success: true, data: { ok: true } });
    });

    it('put sends PUT with body', async () => {
      const { put } = await importApiClient();
      mockAxiosInstance.mockResolvedValueOnce({
        data: { success: true, data: { updated: true } },
      });

      const result = await put('/test/1', { name: 'y' });

      expect(mockAxiosInstance).toHaveBeenCalledWith({
        method: 'PUT',
        url: '/test/1',
        data: { name: 'y' },
      });
      expect(result).toEqual({ success: true, data: { updated: true } });
    });

    it('del sends DELETE with params', async () => {
      const { del } = await importApiClient();
      mockAxiosInstance.mockResolvedValueOnce({
        data: { success: true, data: { deleted: true } },
      });

      const result = await del('/test/1', { force: true });

      expect(mockAxiosInstance).toHaveBeenCalledWith({
        method: 'DELETE',
        url: '/test/1',
        params: { force: true },
      });
      expect(result).toEqual({ success: true, data: { deleted: true } });
    });

    it('patch sends PATCH with body', async () => {
      const { patch } = await importApiClient();
      mockAxiosInstance.mockResolvedValueOnce({
        data: { success: true, data: { patched: true } },
      });

      const result = await patch('/test/1', { field: 'x' });

      expect(mockAxiosInstance).toHaveBeenCalledWith({
        method: 'PATCH',
        url: '/test/1',
        data: { field: 'x' },
      });
      expect(result).toEqual({ success: true, data: { patched: true } });
    });
  });

  // ---- Response format handling ----

  describe('response format handling', () => {
    it('wraps raw response (no success/data keys)', async () => {
      const { get } = await importApiClient();
      mockAxiosInstance.mockResolvedValueOnce({
        data: { message: 'raw' },
      });

      const result = await get('/test');

      expect(result).toEqual({ success: true, data: { message: 'raw' } });
    });

    it('unwraps { success: true, data: X } response', async () => {
      const { get } = await importApiClient();
      mockAxiosInstance.mockResolvedValueOnce({
        data: { success: true, data: { userId: 42 } },
      });

      const result = await get('/test');

      expect(result).toEqual({ success: true, data: { userId: 42 } });
    });

    it('treats { success: false, ... } as raw data (not error)', async () => {
      // NOTE: the client only unwraps when success === true
      const { get } = await importApiClient();
      mockAxiosInstance.mockResolvedValueOnce({
        data: { success: false, error: 'something' },
      });

      const result = await get('/test');

      // The whole response is returned as data
      expect(result).toEqual({
        success: true,
        data: { success: false, error: 'something' },
      });
    });
  });

  // ---- Error handling ----

  describe('error handling', () => {
    it('delegates to handleApiError on axios rejection', async () => {
      const { handleApiError } = await import('./apiErrorHandler');
      (handleApiError as any).mockReturnValue({
        success: false,
        error: 'Handled',
      });

      const { get } = await importApiClient();
      const networkError = new Error('Network');
      mockAxiosInstance.mockRejectedValueOnce(networkError);

      const result = await get('/test');

      expect(handleApiError).toHaveBeenCalledWith(networkError);
      expect(result).toEqual({ success: false, error: 'Handled' });
    });
  });

  // ---- postWithFormData ----

  describe('postWithFormData', () => {
    it('sends FormData with multipart Content-Type', async () => {
      const { postWithFormData } = await importApiClient();

      const formData = new FormData();
      formData.append('file', 'x');

      // mockAxiosInstance.post returns a promise
      mockAxiosInstance.post = vi.fn().mockResolvedValue({
        data: { success: true, data: { uploaded: true } },
      });

      const result = await postWithFormData('/upload', formData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      expect(result).toEqual({ success: true, data: { uploaded: true } });
    });

    it('unwraps { success: true, data: X } for FormData requests', async () => {
      const { postWithFormData } = await importApiClient();

      const formData = new FormData();
      mockAxiosInstance.post = vi.fn().mockResolvedValue({
        data: { success: true, data: { id: 'abc' } },
      });

      const result = await postWithFormData('/upload', formData);

      expect(result).toEqual({ success: true, data: { id: 'abc' } });
    });

    it('delegates to handleApiError on rejection', async () => {
      const { handleApiError } = await import('./apiErrorHandler');
      (handleApiError as any).mockReturnValue({
        success: false,
        error: 'Upload failed',
      });

      const { postWithFormData } = await importApiClient();

      const formData = new FormData();
      const error = new Error('Upload error');
      mockAxiosInstance.post = vi.fn().mockRejectedValue(error);

      const result = await postWithFormData('/upload', formData);

      expect(handleApiError).toHaveBeenCalledWith(error);
      expect(result).toEqual({ success: false, error: 'Upload failed' });
    });
  });

  // ---- 401 interceptor ----

  describe('response interceptor (401 handling)', () => {
    it('rejects network errors without extra processing', async () => {
      await importApiClient();

      expect(interceptorHandler).not.toBeNull();

      const error = { code: 'ERR_NETWORK', config: { url: '/auth/me' } };
      await expect(interceptorHandler!(error)).rejects.toBe(error);
    });

    it('rejects ECONNABORTED errors without extra processing', async () => {
      await importApiClient();

      const error = { code: 'ECONNABORTED', config: { url: '/auth/me' } };
      await expect(interceptorHandler!(error)).rejects.toBe(error);
    });

    it('rejects 401 for /auth/login without triggering handling', async () => {
      await importApiClient();

      const error = {
        response: { status: 401 },
        config: { url: '/auth/login' },
      };

      await expect(interceptorHandler!(error)).rejects.toBe(error);
    });

    it('rejects 401 for /auth/register without triggering handling', async () => {
      await importApiClient();

      const error = {
        response: { status: 401 },
        config: { url: '/auth/register' },
      };

      await expect(interceptorHandler!(error)).rejects.toBe(error);
    });

    it('rejects 401 for /auth/me without triggering handling', async () => {
      await importApiClient();

      const error = {
        response: { status: 401 },
        config: { url: '/auth/me' },
      };

      await expect(interceptorHandler!(error)).rejects.toBe(error);
    });

    it('rejects 401 when isLoggingOut=true', async () => {
      const { store } = await import('../store/store');
      (store.getState as any).mockReturnValue({
        auth: { isLoggingOut: true },
      });

      await importApiClient();

      const error = {
        response: { status: 401 },
        config: { url: '/some/protected' },
      };

      await expect(interceptorHandler!(error)).rejects.toBe(error);
    });

    it('rejects 401 on protected route normally when isLoggingOut=false', async () => {
      const { store } = await import('../store/store');
      (store.getState as any).mockReturnValue({
        auth: { isLoggingOut: false },
      });

      await importApiClient();

      const error = {
        response: { status: 401 },
        config: { url: '/protected/data' },
      };

      await expect(interceptorHandler!(error)).rejects.toBe(error);
    });

    it('ignores repeated 401s within the debounce window (isHandling401)', async () => {
      vi.useFakeTimers();

      const { store } = await import('../store/store');
      (store.getState as any).mockReturnValue({
        auth: { isLoggingOut: false },
      });

      await importApiClient();

      const error1 = {
        response: { status: 401 },
        config: { url: '/protected/1' },
      };
      const error2 = {
        response: { status: 401 },
        config: { url: '/protected/2' },
      };

      await expect(interceptorHandler!(error1)).rejects.toBe(error1);
      // Second 401 within window should also just reject
      await expect(interceptorHandler!(error2)).rejects.toBe(error2);

      // Advance time past the debounce window
      vi.advanceTimersByTime(1100);

      const error3 = {
        response: { status: 401 },
        config: { url: '/protected/3' },
      };
      await expect(interceptorHandler!(error3)).rejects.toBe(error3);
    });
  });
});