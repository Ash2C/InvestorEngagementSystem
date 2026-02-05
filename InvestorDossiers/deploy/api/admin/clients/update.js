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
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate admin session
  const authResult = await validateAdminSession(req);
  if (!authResult.valid) {
    return res.status(401).json({ error: authResult.error });
  }

  try {
    const { clientId } = req.query;
    const { name, email, emails: emailsInput, authorizedDossiers, isActive } = req.body;

    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    const client = await kv.get(`client:${clientId}`);

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Update fields if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Invalid client name' });
      }
      client.name = name.trim();
    }

    // Update emails if provided (support both `emails` array and `email` string)
    if (emailsInput !== undefined || email !== undefined) {
      let rawEmails = [];
      if (emailsInput !== undefined) {
        rawEmails = Array.isArray(emailsInput) ? emailsInput : [];
      } else if (email !== undefined) {
        rawEmails = email ? [email] : [];
      }

      // Normalize and deduplicate
      const newEmails = [...new Set(
        rawEmails.map(e => e.trim().toLowerCase()).filter(e => e.length > 0)
      )];

      // Get old emails (handle both old single-email and new multi-email format)
      const oldEmails = Array.isArray(client.emails)
        ? client.emails
        : (client.email ? [client.email] : []);

      // Check new emails for conflicts with other clients
      for (const e of newEmails) {
        if (!oldEmails.includes(e)) {
          const existingClientId = await kv.get(`client-by-email:${e}`);
          if (existingClientId && existingClientId !== clientId) {
            return res.status(400).json({ error: `Email ${e} is already assigned to another client` });
          }
        }
      }

      // Remove old email lookups that are no longer in the list
      for (const e of oldEmails) {
        if (!newEmails.includes(e)) {
          await kv.del(`client-by-email:${e}`);
        }
      }

      // Set new email lookups
      for (const e of newEmails) {
        await kv.set(`client-by-email:${e}`, clientId);
      }

      client.emails = newEmails;
      delete client.email; // Remove legacy field
    }

    if (authorizedDossiers !== undefined) {
      if (!Array.isArray(authorizedDossiers)) {
        return res.status(400).json({ error: 'authorizedDossiers must be an array' });
      }
      client.authorizedDossiers = authorizedDossiers;
    }

    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ error: 'isActive must be a boolean' });
      }
      client.isActive = isActive;
    }

    client.updatedAt = new Date().toISOString();

    // Save updated client
    await kv.set(`client:${clientId}`, client);

    return res.status(200).json({
      success: true,
      client: {
        id: client.id,
        name: client.name,
        emails: Array.isArray(client.emails) ? client.emails : (client.email ? [client.email] : []),
        token: client.token,
        authorizedDossiers: client.authorizedDossiers,
        isActive: client.isActive,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
      },
      portalUrl: `/portal?t=${client.token}`,
    });

  } catch (error) {
    console.error('Update client error:', error);
    return res.status(500).json({ error: 'Failed to update client' });
  }
}
