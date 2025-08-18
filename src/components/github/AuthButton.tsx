// src/components/github/AuthButton.tsx
import React, { useState, useEffect, useCallback } from 'react';
import type { GitHubUser } from '../../services/github/types';
import { getGitHubAuthService, isOAuthCallback, handleOAuthCallback } from '../../services/github/auth';

interface AuthButtonProps {
  onAuthChange?: (isAuthenticated: boolean, user: GitHubUser | null) => void;
  className?: string;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  onAuthChange,
  className = '',
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callbackHandled, setCallbackHandled] = useState(false);

  const authService = getGitHubAuthService();

  const checkAuthStatus = useCallback(async () => {
    try {
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        
        // Validate token in background
        const isValid = await authService.validateToken();
        if (!isValid) {
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    } catch (err) {
      console.error('Failed to check auth status:', err);
      setIsAuthenticated(false);
      setUser(null);
    }
  }, [authService]);

  const handleAuthCallback = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await handleOAuthCallback();
      await checkAuthStatus();
    } catch (err) {
      console.error('OAuth callback failed:', err);
      setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [checkAuthStatus]);

  const handleLogin = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.initiateLogin();
    } catch (err) {
      console.error('Login failed:', err);
      setError('Failed to start authentication. Please try again.');
      setIsLoading(false);
    }
  }, [authService]);

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setError(null);
  };

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
    
    // Handle OAuth callback if present (only once)
    if (isOAuthCallback() && !callbackHandled) {
      setCallbackHandled(true);
      handleAuthCallback();
    }
  }, [callbackHandled, checkAuthStatus, handleAuthCallback]); // Run when dependencies change

  // Notify parent component of auth changes
  useEffect(() => {
    if (onAuthChange) {
      onAuthChange(isAuthenticated, user);
    }
  }, [isAuthenticated, user, onAuthChange]);

  if (isLoading) {
    return (
      <div className={`auth-button loading ${className}`}>
        <span className="auth-loading-spinner">⟳</span>
        <span>Authenticating...</span>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className={`auth-button authenticated ${className}`}>
        <div className="user-info">
          <img
            src={user.avatar_url}
            alt={`${user.login} avatar`}
            className="user-avatar"
            width="24"
            height="24"
          />
          <div className="user-details">
            <span className="user-name">{user.name || user.login}</span>
            <span className="user-login">@{user.login}</span>
          </div>
        </div>
        <button
          className="logout-button"
          onClick={handleLogout}
          title="Sign out of GitHub"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className={`auth-button unauthenticated ${className}`}>
      <button
        className="login-button"
        onClick={handleLogin}
        disabled={isLoading}
        title="Sign in with GitHub"
      >
        <span className="github-icon">🐙</span>
        <span>Sign in with GitHub</span>
      </button>
      {error && (
        <div className="auth-error">
          <span className="error-text">{error}</span>
          <button
            className="error-dismiss"
            onClick={() => setError(null)}
            title="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default AuthButton;