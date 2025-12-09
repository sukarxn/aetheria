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

/**
 * External Research API - For querying the EY research endpoint
 */
export const executeResearchQuery = async (queryText: string, threadId?: string, internalDocument?: string): Promise<string> => {
  const url = 'https://ey-test.onrender.com/query';
  
  const requestBody = {
    query: queryText,
    stream: false,
    thread_id: threadId || 'string',
    internal_document: ''
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for research

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
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
    
    // Extract the document/result from the response
    // The API returns markdown in a 'response' field
    const document = JSON.stringify(data.response);
    
    return typeof document === 'string' ? document : JSON.stringify(document, null, 2);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('External Research Query Error:', errorMessage);
    throw error;
  }
};

export default {
  apiCall,
  queryApi,
};
