import dotenv from 'dotenv';

dotenv.config();

export const ENEDIS_CONFIG = {
  clientId: 'KLQDH9UuXw7XFuC2swbBNhpekT4a',
  clientSecret: 'yQOC8Wgb8ab2PEhcdGN2XNjjm1oa',
  redirectUri: 'http://localhost:3000/oauth/callback',
  authUrl: 'https://gw.hml.api.enedis.fr/oauth2/authorize',
  tokenUrl: 'https://gw.hml.api.enedis.fr/oauth2/token',
  apiUrl: 'https://gw.hml.api.enedis.fr/v5/metering_data',
  scope: 'openid'
};