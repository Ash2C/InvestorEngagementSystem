import { kv } from '@vercel/kv';

export const config = {
  runtime: 'nodejs',
};

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate admin session
  const authResult = await validateAdminSession(req);
  if (!authResult.valid) {
    return res.status(401).json({ error: authResult.error });
  }

  try {
    // Get list of client IDs
    const clientIds = await kv.get('client-list') || [];

    // Fetch all client data
    const clients = [];
    for (const clientId of clientIds) {
      const client = await kv.get(`client:${clientId}`);
      if (client) {
        clients.push({
          id: client.id,
          name: client.name,
          token: client.token,
          authorizedDossiers: client.authorizedDossiers || [],
          isActive: client.isActive,
          createdAt: client.createdAt,
          updatedAt: client.updatedAt,
        });
      }
    }

    // Sort by creation date (most recent first)
    clients.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      clients,
      count: clients.length,
    });

  } catch (error) {
    console.error('List clients error:', error);
    return res.status(500).json({ error: 'Failed to list clients' });
  }
}
