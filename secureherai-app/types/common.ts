/**
 * Common TypeScript types used across the application
 */

// UUID type alias for better type safety
export type UUID = string;

// Common API response structure
export interface BaseApiResponse {
  success: boolean;
  message?: string;
}

export interface SuccessResponse<T = any> extends BaseApiResponse {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse extends BaseApiResponse {
  success: false;
  error: string;
  message?: string;
}

// Combined response type for API calls
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// Helper type guards for API responses
export function isSuccessResponse<T = any>(response: ApiResponse<T>): response is SuccessResponse<T> {
  return response.success === true;
}

export function isErrorResponse(response: ApiResponse): response is ErrorResponse {
  return response.success === false;
}
