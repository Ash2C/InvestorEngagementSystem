import { del } from '@vercel/blob';
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { briefingId, investorSlug, clientToken } = req.query;

    if (!briefingId && !investorSlug) {
      return res.status(400).json({
        error: 'Either briefingId or investorSlug is required'
      });
    }

    // If client token provided, validate and get client ID for scoped lookups
    let clientId = null;
    if (clientToken) {
      const tokenClientId = await kv.get(`client-by-token:${clientToken}`);
      if (tokenClientId) {
        const client = await kv.get(`client:${tokenClientId}`);
        if (client && client.isActive) {
          clientId = tokenClientId;
        }
      }
    }

    // Get briefing ID from latest if not provided
    let actualBriefingId = briefingId;
    if (!actualBriefingId && investorSlug) {
      // Check client-scoped storage first if we have a client ID
      if (clientId) {
        actualBriefingId = await kv.get(`client-latest-briefing:${clientId}:${investorSlug}`);
      }
      // Fall back to global storage
      if (!actualBriefingId) {
        actualBriefingId = await kv.get(`latest-briefing:${investorSlug}`);
      }
      if (!actualBriefingId) {
        return res.status(404).json({
          error: 'No briefing found for this investor'
        });
      }
    }

    // Get briefing data from KV
    const briefing = await kv.get(actualBriefingId);
    if (!briefing) {
      return res.status(404).json({
        error: 'Briefing not found'
      });
    }

    // Delete file from Blob storage
    if (briefing.blobUrl) {
      try {
        await del(briefing.blobUrl);
      } catch (blobError) {
        console.error('Failed to delete blob:', blobError);
        // Continue even if blob deletion fails
      }
    }

    // Delete from KV
    await kv.del(actualBriefingId);

    // Delete the latest reference (check client-scoped first)
    if (briefing.clientId) {
      const clientLatestKey = `client-latest-briefing:${briefing.clientId}:${briefing.investorSlug}`;
      const clientLatestBriefingId = await kv.get(clientLatestKey);
      if (clientLatestBriefingId === actualBriefingId) {
        await kv.del(clientLatestKey);
      }
    } else {
      const latestKey = `latest-briefing:${briefing.investorSlug}`;
      const latestBriefingId = await kv.get(latestKey);
      if (latestBriefingId === actualBriefingId) {
        await kv.del(latestKey);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Briefing deleted successfully',
      deletedId: actualBriefingId
    });

  } catch (error) {
    console.error('Delete briefing error:', error);
    return res.status(500).json({
      error: 'Failed to delete briefing',
      details: error.message
    });
  }
}
