// src/services/github/api.ts
import type {
  ApiRequestConfig,
  ApiResponse,
  GitHubError,
  RateLimitInfo,
  GitHubAuthToken,
} from './types';

export class GitHubApiError extends Error {
  public status: number;
  public response?: any;
  public rateLimitInfo?: RateLimitInfo;

  constructor(message: string, status: number, response?: any, rateLimitInfo?: RateLimitInfo) {
    super(message);
    this.name = 'GitHubApiError';
    this.status = status;
    this.response = response;
    this.rateLimitInfo = rateLimitInfo;
  }
}

export class GitHubApiClient {
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number;
  private getToken: () => string | null;

  constructor(
    baseUrl: string = 'https://api.github.com',
    timeout: number = 10000,
    maxRetries: number = 3,
    getToken: () => string | null
  ) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.maxRetries = maxRetries;
    this.getToken = getToken;
  }

  /**
   * Make an authenticated request to the GitHub API
   */
  async request<T = any>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    const url = this.buildUrl(config.url);
    const headers = this.buildHeaders(config.headers);

    const requestConfig: RequestInit = {
      method: config.method,
      headers,
      signal: AbortSignal.timeout(this.timeout),
    };

    // Add body for POST/PUT/PATCH requests
    if (config.data && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
      requestConfig.body = JSON.stringify(config.data);
    }

    // Add query parameters for GET requests
    const finalUrl = config.params ? this.addQueryParams(url, config.params) : url;

    return this.executeWithRetry(() => this.executeRequest<T>(finalUrl, requestConfig));
  }

  /**
   * GET request wrapper
   */
  async get<T = any>(url: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'GET',
      url,
      params,
      headers,
    });
  }

  /**
   * POST request wrapper
   */
  async post<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
      headers,
    });
  }

  /**
   * PUT request wrapper
   */
  async put<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
      headers,
    });
  }

  /**
   * DELETE request wrapper
   */
  async delete<T = any>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url,
      headers,
    });
  }

  /**
   * Check rate limit status
   */
  async getRateLimit(): Promise<RateLimitInfo> {
    const response = await this.get<{ rate: RateLimitInfo }>('/rate_limit');
    return response.data.rate;
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<T>(
    requestFn: () => Promise<ApiResponse<T>>,
    attempt: number = 1
  ): Promise<ApiResponse<T>> {
    try {
      return await requestFn();
    } catch (error) {
      if (error instanceof GitHubApiError) {
        // Don't retry on certain status codes
        const noRetryStatuses = [400, 401, 403, 404, 422];
        if (noRetryStatuses.includes(error.status) || attempt >= this.maxRetries) {
          throw error;
        }

        // Handle rate limiting
        if (error.status === 429 || (error.status === 403 && error.rateLimitInfo)) {
          const resetTime = error.rateLimitInfo?.reset;
          if (resetTime) {
            const waitTime = Math.max(0, resetTime * 1000 - Date.now());
            if (waitTime > 0 && waitTime < 60000) { // Don't wait more than 1 minute
              console.warn(`Rate limited. Waiting ${waitTime}ms before retry...`);
              await this.delay(waitTime);
              return this.executeWithRetry(requestFn, attempt + 1);
            }
          }
        }

        // Exponential backoff for server errors
        if (error.status >= 500) {
          const backoffTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.warn(`Server error. Retrying in ${backoffTime}ms...`);
          await this.delay(backoffTime);
          return this.executeWithRetry(requestFn, attempt + 1);
        }
      }

      // For network errors, retry with exponential backoff
      if (attempt < this.maxRetries) {
        const backoffTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.warn(`Network error. Retrying in ${backoffTime}ms...`);
        await this.delay(backoffTime);
        return this.executeWithRetry(requestFn, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Execute the actual HTTP request
   */
  private async executeRequest<T>(url: string, config: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, config);
      
      // Extract rate limit info from headers
      const rateLimitInfo = this.extractRateLimitInfo(response.headers);

      // Handle different response types
      let data: T;
      const contentType = response.headers.get('content-type') || '';
      
      if (response.status === 204) {
        // No content
        data = null as T;
      } else if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text() as T;
      }

      if (!response.ok) {
        const error = data as GitHubError;
        throw new GitHubApiError(
          error.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          error,
          rateLimitInfo
        );
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: this.headersToObject(response.headers),
      };
    } catch (error) {
      if (error instanceof GitHubApiError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new GitHubApiError('Network error: Unable to connect to GitHub API', 0);
      }

      // Handle timeout errors
      if (error.name === 'AbortError') {
        throw new GitHubApiError('Request timeout', 408);
      }

      throw new GitHubApiError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        0
      );
    }
  }

  /**
   * Build the complete URL
   */
  private buildUrl(endpoint: string): string {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.baseUrl}/${cleanEndpoint}`;
  }

  /**
   * Build request headers with authentication
   */
  private buildHeaders(customHeaders: Record<string, string> = {}): Headers {
    const headers = new Headers({
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'DocGround-Editor/1.0',
      ...customHeaders,
    });

    // Add authentication header if token is available
    const token = this.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  /**
   * Add query parameters to URL
   */
  private addQueryParams(url: string, params: Record<string, any>): string {
    const urlObject = new URL(url);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlObject.searchParams.set(key, String(value));
      }
    });
    return urlObject.toString();
  }

  /**
   * Extract rate limit information from response headers
   */
  private extractRateLimitInfo(headers: Headers): RateLimitInfo | undefined {
    const limit = headers.get('x-ratelimit-limit');
    const remaining = headers.get('x-ratelimit-remaining');
    const reset = headers.get('x-ratelimit-reset');
    const used = headers.get('x-ratelimit-used');
    const resource = headers.get('x-ratelimit-resource');

    if (limit && remaining && reset) {
      return {
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        reset: parseInt(reset),
        used: used ? parseInt(used) : 0,
        resource: resource || 'core',
      };
    }

    return undefined;
  }

  /**
   * Convert Headers object to plain object
   */
  private headersToObject(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Utility function to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create a configured GitHub API client instance
 */
export function createGitHubApiClient(getToken: () => string | null): GitHubApiClient {
  const baseUrl = import.meta.env.VITE_GITHUB_API_BASE_URL || 'https://api.github.com';
  const timeout = parseInt(import.meta.env.VITE_GITHUB_API_TIMEOUT || '10000');
  const maxRetries = parseInt(import.meta.env.VITE_GITHUB_API_MAX_RETRIES || '3');

  return new GitHubApiClient(baseUrl, timeout, maxRetries, getToken);
}

/**
 * Singleton instance for global use
 */
let apiClientInstance: GitHubApiClient | null = null;

export function getGitHubApiClient(getToken?: () => string | null): GitHubApiClient {
  if (!apiClientInstance) {
    if (!getToken) {
      throw new Error('GitHub API client not initialized. Call createGitHubApiClient first.');
    }
    apiClientInstance = createGitHubApiClient(getToken);
  }
  return apiClientInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetGitHubApiClient(): void {
  apiClientInstance = null;
}