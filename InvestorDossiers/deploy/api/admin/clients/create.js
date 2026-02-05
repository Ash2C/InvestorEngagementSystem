import { kv } from '@vercel/kv';
import crypto from 'crypto';

export const config = {
  runtime: 'nodejs',
};

// Generate client token: tok_{22-char-base64url}
function generateClientToken() {
  return 'tok_' + crypto.randomBytes(16).toString('base64url').slice(0, 22);
}

// Generate client ID
function generateClientId() {
  return 'cli_' + crypto.randomBytes(8).toString('base64url');
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
    const { name, email, authorizedDossiers = [] } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    // Validate and normalize email if provided
    const normalizedEmail = email ? email.trim().toLowerCase() : null;
    if (normalizedEmail) {
      // Check if email is already in use
      const existingClientId = await kv.get(`client-by-email:${normalizedEmail}`);
      if (existingClientId) {
        return res.status(400).json({ error: 'This email is already assigned to another client' });
      }
    }

    const clientId = generateClientId();
    const token = generateClientToken();
    const now = new Date().toISOString();

    const client = {
      id: clientId,
      name: name.trim(),
      email: normalizedEmail,
      token,
      authorizedDossiers: Array.isArray(authorizedDossiers) ? authorizedDossiers : [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    // Store client data
    await kv.set(`client:${clientId}`, client);

    // Store token -> clientId mapping for fast lookup
    await kv.set(`client-by-token:${token}`, clientId);

    // Store email -> clientId mapping for Google Sign-In lookup
    if (normalizedEmail) {
      await kv.set(`client-by-email:${normalizedEmail}`, clientId);
    }

    // Add to client list
    const clientList = await kv.get('client-list') || [];
    clientList.push(clientId);
    await kv.set('client-list', clientList);

    return res.status(201).json({
      success: true,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        token: client.token,
        authorizedDossiers: client.authorizedDossiers,
        isActive: client.isActive,
        createdAt: client.createdAt,
      },
      portalUrl: `/portal?t=${token}`,
    });

  } catch (error) {
    console.error('Create client error:', error);
    return res.status(500).json({ error: 'Failed to create client' });
  }
}
