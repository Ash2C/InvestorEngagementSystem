import { kv } from '@vercel/kv';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Missing credential' });
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    return res.status(500).json({ error: 'Google Sign-In is not configured' });
  }

  try {
    // Verify the Google ID token
    const tokenInfoResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );

    if (!tokenInfoResponse.ok) {
      return res.status(401).json({ error: 'Invalid Google credential' });
    }

    const tokenInfo = await tokenInfoResponse.json();

    // Validate the audience matches our client ID
    if (tokenInfo.aud !== googleClientId) {
      return res.status(401).json({ error: 'Token was not issued for this application' });
    }

    const email = tokenInfo.email;
    if (!email) {
      return res.status(401).json({ error: 'No email found in Google credential' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Look up client by email
    const clientId = await kv.get(`client-by-email:${normalizedEmail}`);

    if (!clientId) {
      return res.status(404).json({
        success: false,
        error: 'No account found for this email address. Please contact your administrator.',
      });
    }

    // Load client data
    const client = await kv.get(`client:${clientId}`);

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Account configuration error. Please contact your administrator.',
      });
    }

    if (!client.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been deactivated. Please contact your administrator.',
      });
    }

    return res.status(200).json({
      success: true,
      token: client.token,
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
    return res.status(500).json({ error: 'Sign-in failed. Please try again.' });
  }
}
