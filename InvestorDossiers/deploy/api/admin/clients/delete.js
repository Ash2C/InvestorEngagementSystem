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
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
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

    // Delete token lookup
    await kv.del(`client-by-token:${client.token}`);

    // Delete email lookups
    const emails = Array.isArray(client.emails) ? client.emails : (client.email ? [client.email] : []);
    for (const e of emails) {
      await kv.del(`client-by-email:${e}`);
    }

    // Delete client data
    await kv.del(`client:${clientId}`);

    // Remove from client list
    const clientList = await kv.get('client-list') || [];
    const updatedList = clientList.filter(id => id !== clientId);
    await kv.set('client-list', updatedList);

    // Note: We could also delete all client-scoped briefings here,
    // but for audit purposes, we'll leave them orphaned.
    // They can be cleaned up in a separate maintenance task if needed.

    return res.status(200).json({
      success: true,
      message: 'Client deleted successfully',
      deletedClientId: clientId,
    });

  } catch (error) {
    console.error('Delete client error:', error);
    return res.status(500).json({ error: 'Failed to delete client' });
  }
}
