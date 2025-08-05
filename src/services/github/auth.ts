// src/services/github/auth.ts
import type { GitHubUser, GitHubAuthToken, OAuthConfig } from "./types";
import { getGitHubApiClient } from "./api";

export class GitHubAuthService {
  private config: OAuthConfig;
  private tokenKey = "github_auth_token";
  private userKey = "github_user";

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  /**
   * Initiate GitHub OAuth login flow
   */
  async initiateLogin(): Promise<void> {
    const state = this.generateRandomState();
    sessionStorage.setItem("github_oauth_state", state);

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope.join(" "),
      state,
      allow_signup: "true",
    });

    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

    // Redirect to GitHub OAuth
    window.location.href = authUrl;
  }

  /**
   * Handle OAuth callback and exchange code for token
   */
  async handleCallback(code: string, state: string): Promise<string> {
    // Verify state parameter to prevent CSRF attacks
    const savedState = sessionStorage.getItem("github_oauth_state");
    if (!savedState || savedState !== state) {
      console.error("OAuth state validation failed:", {
        savedState,
        receivedState: state,
      });
      throw new Error("Invalid OAuth state parameter. Possible CSRF attack.");
    }

    // Don't clear the state immediately to avoid race conditions in React StrictMode
    // It will be cleared in the URL cleanup later

    try {
      // Exchange authorization code for access token
      const tokenResponse = await this.exchangeCodeForToken(code);

      // Store the token
      this.storeToken(tokenResponse);

      // Fetch and store user information
      await this.fetchAndStoreUser();

      // Clear the state only after successful authentication
      sessionStorage.removeItem("github_oauth_state");

      return tokenResponse.access_token;
    } catch (error) {
      console.error("OAuth callback error:", error);
      throw new Error("Failed to complete GitHub authentication");
    }
  }

  /**
   * Get the current access token
   */
  getToken(): string | null {
    const tokenData = localStorage.getItem(this.tokenKey);
    if (!tokenData) return null;

    try {
      const token: GitHubAuthToken = JSON.parse(tokenData);

      // Check if token is expired
      if (token.expires_at && Date.now() > token.expires_at) {
        this.logout();
        return null;
      }

      return token.access_token;
    } catch (error) {
      console.error("Error parsing stored token:", error);
      this.logout();
      return null;
    }
  }

  /**
   * Get the current authenticated user
   */
  getCurrentUser(): GitHubUser | null {
    const userData = localStorage.getItem(this.userKey);
    if (!userData) return null;

    try {
      return JSON.parse(userData);
    } catch (error) {
      console.error("Error parsing stored user data:", error);
      return null;
    }
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null && this.getCurrentUser() !== null;
  }

  /**
   * Refresh the access token (if refresh token is available)
   */
  async refreshToken(): Promise<string> {
    const tokenData = localStorage.getItem(this.tokenKey);
    if (!tokenData) {
      throw new Error("No token available to refresh");
    }

    try {
      const token: GitHubAuthToken = JSON.parse(tokenData);

      if (!token.refresh_token) {
        throw new Error("No refresh token available");
      }

      // GitHub OAuth doesn't typically provide refresh tokens
      // This is a placeholder for future implementation if needed
      throw new Error("Token refresh not supported by GitHub OAuth");
    } catch (error) {
      console.error("Token refresh error:", error);
      this.logout();
      throw error;
    }
  }

  /**
   * Logout and clear stored authentication data
   */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    sessionStorage.removeItem("github_oauth_state");
  }

  /**
   * Validate the current token by making a test API call
   */
  async validateToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      const apiClient = getGitHubApiClient(() => token);
      await apiClient.get("/user");
      return true;
    } catch (error) {
      console.error("Token validation failed:", error);
      this.logout();
      return false;
    }
  }

  /**
   * Exchange authorization code for access token
   */
  private async exchangeCodeForToken(code: string): Promise<GitHubAuthToken> {
    // Use CORS proxy for development - GitHub doesn't allow direct browser requests
    const proxyUrl = "https://cors-anywhere.herokuapp.com/";
    const targetUrl = "https://github.com/login/oauth/access_token";

    const response = await fetch(proxyUrl + targetUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest", // Required by cors-anywhere
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: import.meta.env.VITE_GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      let errorMessage = `Token exchange failed: ${response.status} ${response.statusText}`;
      try {
        const error = await response.json();
        errorMessage = `Token exchange failed: ${
          error.error_description || error.error || errorMessage
        }`;
      } catch {
        // Use default error message if response is not JSON
      }
      throw new Error(errorMessage);
    }

    const tokenData = await response.json();

    if (tokenData.error) {
      throw new Error(
        `OAuth error: ${tokenData.error_description || tokenData.error}`
      );
    }

    // Add expiration time if not provided (GitHub tokens don't expire by default)
    const expiresIn = tokenData.expires_in;
    const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : undefined;

    return {
      access_token: tokenData.access_token,
      token_type: tokenData.token_type || "bearer",
      scope: tokenData.scope || "",
      refresh_token: tokenData.refresh_token,
      expires_in: expiresIn,
      expires_at: expiresAt,
    };
  }

  /**
   * Fetch user information and store it
   */
  private async fetchAndStoreUser(): Promise<void> {
    const token = this.getToken();
    if (!token) {
      throw new Error("No authentication token available");
    }

    try {
      const apiClient = getGitHubApiClient(() => token);
      const response = await apiClient.get<GitHubUser>("/user");

      localStorage.setItem(this.userKey, JSON.stringify(response.data));
    } catch (error) {
      console.error("Failed to fetch user information:", error);
      throw new Error("Failed to fetch user information");
    }
  }

  /**
   * Store authentication token securely
   */
  private storeToken(token: GitHubAuthToken): void {
    localStorage.setItem(this.tokenKey, JSON.stringify(token));
  }

  /**
   * Generate a random state parameter for OAuth security
   */
  private generateRandomState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      ""
    );
  }
}

/**
 * Create GitHub authentication service with environment configuration
 */
export function createGitHubAuthService(): GitHubAuthService {
  const config: OAuthConfig = {
    clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || "",
    redirectUri:
      import.meta.env.VITE_GITHUB_REDIRECT_URI ||
      `${window.location.origin}/auth/callback`,
    scope: [
      "repo", // Full control of private repositories
      "user:email", // Access to user email addresses
      "read:user", // Read access to a user's profile
    ],
  };

  if (!config.clientId) {
    throw new Error(
      "GitHub OAuth client ID is not configured. Please set VITE_GITHUB_CLIENT_ID environment variable."
    );
  }

  return new GitHubAuthService(config);
}

/**
 * Singleton instance for global use
 */
let authServiceInstance: GitHubAuthService | null = null;

export function getGitHubAuthService(): GitHubAuthService {
  if (!authServiceInstance) {
    authServiceInstance = createGitHubAuthService();
  }
  return authServiceInstance;
}

/**
 * Parse OAuth callback URL parameters
 */
export function parseOAuthCallback(): {
  code?: string;
  state?: string;
  error?: string;
} {
  const urlParams = new URLSearchParams(window.location.search);

  return {
    code: urlParams.get("code") || undefined,
    state: urlParams.get("state") || undefined,
    error: urlParams.get("error") || undefined,
  };
}

/**
 * Check if current URL is OAuth callback
 */
export function isOAuthCallback(): boolean {
  const { code, error } = parseOAuthCallback();
  return !!(code || error);
}

/**
 * Handle OAuth callback automatically
 */
export async function handleOAuthCallback(): Promise<string | null> {
  if (!isOAuthCallback()) {
    return null;
  }

  const { code, state, error } = parseOAuthCallback();

  if (error) {
    console.error("OAuth error:", error);
    throw new Error(`OAuth authentication failed: ${error}`);
  }

  if (!code || !state) {
    throw new Error("Invalid OAuth callback: missing code or state parameter");
  }

  const authService = getGitHubAuthService();
  const token = await authService.handleCallback(code, state);

  // Clean up URL by removing OAuth parameters
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  url.searchParams.delete("error");

  window.history.replaceState({}, document.title, url.toString());

  return token;
}
