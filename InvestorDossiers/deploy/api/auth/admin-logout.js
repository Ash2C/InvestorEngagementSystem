import { kv } from '@vercel/kv';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get session ID from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No session provided' });
    }

    const sessionId = authHeader.slice(7); // Remove 'Bearer ' prefix

    // Delete session from KV
    await kv.del(`admin-session:${sessionId}`);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });

  } catch (error) {
    console.error('Admin logout error:', error);
    return res.status(500).json({ error: 'Logout failed' });
  }
}
