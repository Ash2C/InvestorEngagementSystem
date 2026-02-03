import { kv } from '@vercel/kv';
import crypto from 'crypto';

export const config = {
  runtime: 'nodejs',
};

// Generate a secure session ID
function generateSessionId() {
  return 'sess_' + crypto.randomBytes(32).toString('base64url');
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Validate against environment variable
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('ADMIN_PASSWORD environment variable not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    if (password !== adminPassword) {
      // Add small delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 500));
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Create session
    const sessionId = generateSessionId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const sessionData = {
      sessionId,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    // Store session in KV with 24-hour expiry
    await kv.set(`admin-session:${sessionId}`, sessionData, { ex: 86400 }); // 86400 seconds = 24 hours

    return res.status(200).json({
      success: true,
      sessionId,
      expiresAt: expiresAt.toISOString(),
    });

  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
}
