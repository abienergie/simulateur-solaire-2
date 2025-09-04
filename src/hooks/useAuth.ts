import { useState, useCallback } from 'react';
import { OAuth2Client } from '../utils/auth/oauth';

const config = {
  clientId: process.env.VITE_OAUTH_CLIENT_ID || '',
  authorizeUrl: process.env.VITE_OAUTH_AUTHORIZE_URL || '',
  tokenUrl: process.env.VITE_OAUTH_TOKEN_URL || '',
  redirectUri: `${window.location.origin}/oauth/callback`,
  scope: 'openid profile email'
};

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const client = new OAuth2Client(config);

  const login = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await client.initiateLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCallback = useCallback(async (code: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const tokens = await client.handleCallback(code);
      
      // Store tokens securely
      localStorage.setItem('access_token', tokens.access_token);
      if (tokens.refresh_token) {
        localStorage.setItem('refresh_token', tokens.refresh_token);
      }
      
      setIsAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to handle callback');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
  }, []);

  return {
    isAuthenticated,
    isLoading,
    error,
    login,
    handleCallback,
    logout
  };
}