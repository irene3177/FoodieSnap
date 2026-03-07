export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}