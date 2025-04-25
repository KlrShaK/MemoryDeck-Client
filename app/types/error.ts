export interface ApplicationError extends Error {
  info?: string;
  status?: number;
  response?: {
    status: number;
  };
}
