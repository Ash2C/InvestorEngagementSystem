import { kv } from '@vercel/kv';

export const config = {
  runtime: 'nodejs',
};

// Helper to validate client token
async function validateClientToken(token) {
  if (!token || !token.startsWith('tok_')) {
    return { valid: false, error: 'Invalid token format' };
  }

  try {
    const clientId = await kv.get(`client-by-token:${token}`);

    if (!clientId) {
      return { valid: false, error: 'Token not found' };
    }

    const client = await kv.get(`client:${clientId}`);

    if (!client) {
      return { valid: false, error: 'Client not found' };
    }

    if (!client.isActive) {
      return { valid: false, error: 'Client access has been disabled' };
    }

    return { valid: true, client };
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false, error: 'Token validation failed' };
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { token, investorSlug, briefingId } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  // Validate client token
  const authResult = await validateClientToken(token);
  if (!authResult.valid) {
    return res.status(401).json({ error: authResult.error });
  }

  const client = authResult.client;

  // Verify client has access to this investor
  if (investorSlug && !client.authorizedDossiers.includes(investorSlug)) {
    return res.status(403).json({ error: 'Not authorized to access this investor' });
  }

  if (req.method === 'GET') {
    return handleGetBriefing(req, res, client, investorSlug, briefingId);
  }

  if (req.method === 'POST') {
    return handleSaveBriefing(req, res, client, investorSlug);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGetBriefing(req, res, client, investorSlug, briefingId) {
  try {
    // If briefingId provided, get specific briefing
    if (briefingId) {
      const briefing = await kv.get(briefingId);
      if (!briefing) {
        return res.status(404).json({ error: 'Briefing not found' });
      }

      // Verify this briefing belongs to this client
      if (!briefingId.startsWith(`client-briefing:${client.id}:`)) {
        return res.status(403).json({ error: 'Not authorized to access this briefing' });
      }

      return res.status(200).json({ briefing });
    }

    // Get latest briefing for investor
    if (investorSlug) {
      const latestBriefingId = await kv.get(`client-latest-briefing:${client.id}:${investorSlug}`);

      if (!latestBriefingId) {
        return res.status(200).json({ briefing: null, message: 'No briefing found' });
      }

      const briefing = await kv.get(latestBriefingId);
      return res.status(200).json({ briefing, briefingId: latestBriefingId });
    }

    // List all briefings for this client
    const briefings = [];
    for (const slug of client.authorizedDossiers) {
      const latestBriefingId = await kv.get(`client-latest-briefing:${client.id}:${slug}`);
      if (latestBriefingId) {
        const briefing = await kv.get(latestBriefingId);
        if (briefing) {
          briefings.push({
            ...briefing,
            briefingId: latestBriefingId,
          });
        }
      }
    }

    return res.status(200).json({ briefings, count: briefings.length });

  } catch (error) {
    console.error('Get briefing error:', error);
    return res.status(500).json({ error: 'Failed to get briefing' });
  }
}

async function handleSaveBriefing(req, res, client, investorSlug) {
  if (!investorSlug) {
    return res.status(400).json({ error: 'investorSlug is required' });
  }

  // Verify client has access to this investor
  if (!client.authorizedDossiers.includes(investorSlug)) {
    return res.status(403).json({ error: 'Not authorized to access this investor' });
  }

  try {
    const { positioningAnalysis, companyName, extractedText, blobUrl } = req.body;

    const timestamp = Date.now();
    const briefingId = `client-briefing:${client.id}:${investorSlug}:${timestamp}`;

    const briefingData = {
      id: briefingId,
      clientId: client.id,
      investorSlug,
      companyName,
      extractedText,
      blobUrl,
      positioningAnalysis,
      createdAt: new Date().toISOString(),
    };

    // Store the briefing
    await kv.set(briefingId, briefingData);

    // Update the latest briefing reference
    await kv.set(`client-latest-briefing:${client.id}:${investorSlug}`, briefingId);

    return res.status(201).json({
      success: true,
      briefingId,
      message: 'Briefing saved successfully',
    });

  } catch (error) {
    console.error('Save briefing error:', error);
    return res.status(500).json({ error: 'Failed to save briefing' });
  }
}
