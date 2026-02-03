import { kv } from '@vercel/kv';
import crypto from 'crypto';

export const config = {
  runtime: 'nodejs',
};

// Generate client token: tok_{22-char-base64url}
function generateClientToken() {
  return 'tok_' + crypto.randomBytes(16).toString('base64url').slice(0, 22);
}

// Helper to validate admin session
async function validateAdminSession(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'No session provided' };
  }

  const sessionId = authHeader.slice(7);

  try {
    const session = await kv.get(`admin-session:${sessionId}`);

    if (!session) {
      return { valid: false, error: 'Session not found or expired' };
    }

    const expiresAt = new Date(session.expiresAt);
    if (expiresAt < new Date()) {
      await kv.del(`admin-session:${sessionId}`);
      return { valid: false, error: 'Session expired' };
    }

    return { valid: true, session };
  } catch (error) {
    console.error('Session validation error:', error);
    return { valid: false, error: 'Session validation failed' };
  }
}

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

  // Validate admin session
  const authResult = await validateAdminSession(req);
  if (!authResult.valid) {
    return res.status(401).json({ error: authResult.error });
  }

  try {
    const { clientId } = req.query;

    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    const client = await kv.get(`client:${clientId}`);

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const oldToken = client.token;
    const newToken = generateClientToken();

    // Delete old token lookup
    await kv.del(`client-by-token:${oldToken}`);

    // Update client with new token
    client.token = newToken;
    client.updatedAt = new Date().toISOString();
    await kv.set(`client:${clientId}`, client);

    // Create new token lookup
    await kv.set(`client-by-token:${newToken}`, clientId);

    return res.status(200).json({
      success: true,
      client: {
        id: client.id,
        name: client.name,
        token: client.token,
        authorizedDossiers: client.authorizedDossiers,
        isActive: client.isActive,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
      },
      portalUrl: `/portal?t=${newToken}`,
      message: 'Token regenerated. The old token is now invalid.',
    });

  } catch (error) {
    console.error('Regenerate token error:', error);
    return res.status(500).json({ error: 'Failed to regenerate token' });
  }
}
