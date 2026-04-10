export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ApiParams {
  [key: string]: unknown;
}

export type ApiBody = Record<string, unknown> | object;