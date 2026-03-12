/**
 * Standard API Response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: PaginationMeta;
}

/**
 * Error response
 */
export interface ErrorResponse {
  success: false;
  error: string;
  details?: Record<string, any>;
  status?: number;
}
