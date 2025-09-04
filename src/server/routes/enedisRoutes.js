import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initiate OAuth flow
router.get('/auth', (req, res) => {
  const state = Math.random().toString(36).substring(7);
  const authUrl = `${process.env.ENEDIS_AUTH_URL}?response_type=code&client_id=${process.env.ENEDIS_CLIENT_ID}&state=${state}&redirect_uri=${encodeURIComponent(process.env.ENEDIS_REDIRECT_URI)}&scope=${process.env.ENEDIS_SCOPE}`;
  res.json({ authUrl });
});

// Handle OAuth callback
router.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code missing' });
  }

  try {
    const tokenResponse = await axios.post(
      process.env.ENEDIS_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.ENEDIS_CLIENT_ID,
        client_secret: process.env.ENEDIS_CLIENT_SECRET,
        redirect_uri: process.env.ENEDIS_REDIRECT_URI
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    res.json({
      access_token: tokenResponse.data.access_token,
      token_type: tokenResponse.data.token_type,
      expires_in: tokenResponse.data.expires_in
    });
  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to exchange authorization code' });
  }
});

// Get consumption data
router.get('/consumption/:usagePointId', async (req, res) => {
  const { usagePointId } = req.params;
  const { start, end } = req.query;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authorization token missing' });
  }

  try {
    const response = await axios.get(
      `${process.env.ENEDIS_API_URL}/daily_consumption?usage_point_id=${usagePointId}&start=${start}&end=${end}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch consumption data' });
  }
});

export default router;