import { kv } from '@vercel/kv';

export const config = {
  runtime: 'nodejs',
};

// Helper function to validate client token - can be used by other endpoints
export async function validateClientToken(token) {
  if (!token || !token.startsWith('tok_')) {
    return { valid: false, error: 'Invalid token format' };
  }

  try {
    // Look up client ID from token
    const clientId = await kv.get(`client-by-token:${token}`);

    if (!clientId) {
      return { valid: false, error: 'Token not found' };
    }

    // Get client data
    const client = await kv.get(`client:${clientId}`);

    if (!client) {
      return { valid: false, error: 'Client not found' };
    }

    // Check if client is active
    if (!client.isActive) {
      return { valid: false, error: 'Client access has been disabled' };
    }

    return {
      valid: true,
      client: {
        id: client.id,
        name: client.name,
        authorizedDossiers: client.authorizedDossiers || [],
        createdAt: client.createdAt,
      }
    };
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false, error: 'Token validation failed' };
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get token from query parameter
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({
      valid: false,
      error: 'Token is required'
    });
  }

  const result = await validateClientToken(token);

  if (!result.valid) {
    return res.status(401).json({
      valid: false,
      error: result.error
    });
  }

  return res.status(200).json({
    valid: true,
    client: result.client,
  });
}
