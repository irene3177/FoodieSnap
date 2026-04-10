import axios, { Method, AxiosRequestConfig } from 'axios';
import { config } from '../config';
import { handleApiError } from './apiErrorHandler';
import { selectIsLoggingOut } from '../store/authSlice';
import { store } from '../store/store';
import { ApiBody, ApiParams, ApiResponse } from '../types';

const apiClient = axios.create({
  baseURL: config.apiUrl,
  timeout: config.timeout,
  withCredentials: true
});
// let isRedirecting = false;
let isHandling401 = false;

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Do not log out in case network errors (server is restarting)
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      return Promise.reject(error);
    }

    const state = store.getState();
    const isLoggingOut = selectIsLoggingOut(state);
    // const isAuthenticated = selectIsAuthenticated(state);

    const isAuthEndpoint = error.config?.url?.includes('/auth/login') || 
                          error.config?.url?.includes('/auth/register');
    
    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    const isMeEndpoint = error.config?.url?.includes('/auth/me');

    if (error.response?.status === 401 && !isLoggingOut && !isHandling401) {

      if (isMeEndpoint) {
        return Promise.reject(error);
      }
      
      isHandling401 = true;
      setTimeout(() => {
        isHandling401 = false;
      }, 1000);
      // isRedirecting = true;
      // if (isAuthenticated) {
      //   store.dispatch(logout());
      // }

      // setTimeout(() => {
      //   isRedirecting = false;
      //   if (!window.location.pathname.includes('/')) {
      //     window.location.href = '/?logout=true';
      //   }
      // }, 100);
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

// Basic request helper
async function request<T>(
  method: Method,
  url: string,
  data?: ApiBody,
  params?: ApiParams
): Promise<ApiResponse<T>> {
  try {
    const axiosConfig: AxiosRequestConfig = {
      method,
      url,
      ...(params && { params }),
      ...(data && { data })
    };
    
    const response = await apiClient(axiosConfig);
    
    // Check if response is in the expected format
    if (response.data && typeof response.data === 'object') {
      if ('success' in response.data && response.data.success === true && 'data' in response.data) {
        return { success: true, data: response.data.data as T };
      }
    }
    
    // If response is not in the expected format, but request is successful
    return { success: true, data: response.data as T };
  } catch (error) {
    return handleApiError(error);
  }
}

// GET request
export async function get<T>(
  url: string,
  params?: ApiParams
): Promise<ApiResponse<T>> {
  return request<T>('GET', url, undefined, params);
}

// POST request
export async function post<T>(
  url: string,
  data?: ApiBody
): Promise<ApiResponse<T>> {
  return request<T>('POST', url, data);
}

// PUT request
export async function put<T>(
  url: string,
  data?: ApiBody
): Promise<ApiResponse<T>> {
  return request<T>('PUT', url, data);
}

// DELETE request
export async function del<T>(
  url: string,
  params?: ApiParams
): Promise<ApiResponse<T>> {
  return request<T>('DELETE', url, undefined, params);
}

// PATCH request
export async function patch<T>(
  url: string,
  data?: ApiBody
): Promise<ApiResponse<T>> {
  return request<T>('PATCH', url, data);
}


// POST request with FormData (multipart/form-data)
export async function postWithFormData<T>(
  url: string,
  formData: FormData
): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (response.data && typeof response.data === 'object') {
      if ('success' in response.data && response.data.success === true && 'data' in response.data) {
        return { success: true, data: response.data.data as T };
      }
    }
    
    return { success: true, data: response.data as T };
  } catch (error) {
    return handleApiError(error);
  }
}