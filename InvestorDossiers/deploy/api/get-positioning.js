import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { briefingId, investorSlug } = req.query;

    if (!briefingId && !investorSlug) {
      return res.status(400).json({
        error: 'Either briefingId or investorSlug is required'
      });
    }

    // Get briefing ID from latest if not provided
    let actualBriefingId = briefingId;
    if (!actualBriefingId && investorSlug) {
      actualBriefingId = await kv.get(`latest-briefing:${investorSlug}`);
      if (!actualBriefingId) {
        return res.status(404).json({
          error: 'No briefing found for this investor',
          hasBriefing: false
        });
      }
    }

    // Get briefing data from KV
    const briefing = await kv.get(actualBriefingId);
    if (!briefing) {
      return res.status(404).json({
        error: 'Briefing not found',
        hasBriefing: false
      });
    }

    // Return briefing metadata, analysis, and verification (without the full extracted text)
    return res.status(200).json({
      success: true,
      hasBriefing: true,
      briefing: {
        id: briefing.id,
        investorSlug: briefing.investorSlug,
        companyName: briefing.companyName,
        filename: briefing.filename,
        fileType: briefing.fileType,
        fileSize: briefing.fileSize,
        blobUrl: briefing.blobUrl,
        createdAt: briefing.createdAt,
        analyzedAt: briefing.analyzedAt || null,
        hasAnalysis: !!briefing.positioningAnalysis
      },
      analysis: briefing.positioningAnalysis || null,
      verification: briefing.verification || null
    });

  } catch (error) {
    console.error('Get positioning error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve positioning data',
      details: error.message
    });
  }
}
