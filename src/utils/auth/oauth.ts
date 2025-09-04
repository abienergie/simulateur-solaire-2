import { generateCodeVerifier, generateCodeChallenge } from './pkce';

export interface OAuthConfig {
  clientId: string;
  authorizeUrl: string;
  tokenUrl: string;
  redirectUri: string;
  scope: string;
}

export class OAuth2Client {
  private config: OAuthConfig;
  private codeVerifier: string;

  constructor(config: OAuthConfig) {
    this.config = config;
    this.codeVerifier = generateCodeVerifier();
  }

  async initiateLogin(): Promise<void> {
    const codeChallenge = await generateCodeChallenge(this.codeVerifier);
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state: crypto.randomUUID()
    });

    window.location.href = `${this.config.authorizeUrl}?${params.toString()}`;
  }

  async handleCallback(code: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  }> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      code_verifier: this.codeVerifier
    });

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    return response.json();
  }

  async refreshToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  }> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId
    });

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    return response.json();
  }
}