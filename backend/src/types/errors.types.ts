export interface ErrorWithStatus extends Error {
  statusCode?: number;
  code?: number;
  keyValue?: Record<string, any>;
  errors?: any;
}

export type ErrorFactory = (message: string) => ErrorWithStatus;