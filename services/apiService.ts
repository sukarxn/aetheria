/**
 * API Service - Centralized management of all backend API calls
 * This service handles all HTTP requests to the backend server
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

// Base API configuration
const BASE_URL = 'https://ey-002a.onrender.com';
const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Generic API call handler with error handling and timeout support
 */
const apiCall = async <T>(
  endpoint: string,
  config: ApiRequestConfig = {}
): Promise<ApiResponse<T>> => {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = DEFAULT_TIMEOUT,
  } = config;

  const url = `${BASE_URL}${endpoint}`;
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method,
      headers: defaultHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `API Error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return {
      success: true,
      data: data as T,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    console.error(`API Error [${method} ${endpoint}]:`, errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Query API - External service for research queries
 */
export const queryApi = {
  /**
   * Send a research query to the external API
   */
  sendQuery: async (queryData: {
    query: string;
    agent_type: string;
    session_id: string;
  }) => {
    return apiCall('/api/query', {
      method: 'POST',
      body: queryData,
    });
  },
};

export default {
  apiCall,
  queryApi,
};
