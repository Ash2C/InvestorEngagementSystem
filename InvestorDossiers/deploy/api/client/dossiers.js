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

// Static dossier data (for yoko-li and saurabh-gupta)
// These link directly to the hand-crafted static HTML pages
const STATIC_DOSSIERS = {
  'yoko-li': {
    slug: 'yoko-li',
    name: 'Yoko Li',
    company: 'Andreessen Horowitz (a16z)',
    role: 'Partner, AI & Infrastructure',
    isStatic: true,
    staticUrl: '/index.html'  // Yoko Li is the main index page
  },
  'saurabh-gupta': {
    slug: 'saurabh-gupta',
    name: 'Saurabh Gupta',
    company: 'DST Global',
    role: 'Co-Founder & Managing Partner',
    isStatic: true,
    staticUrl: '/saurabh-gupta.html'
  }
};

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

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  // Validate client token
  const authResult = await validateClientToken(token);
  if (!authResult.valid) {
    return res.status(401).json({ error: authResult.error });
  }

  const client = authResult.client;
  const authorizedSlugs = client.authorizedDossiers || [];

  try {
    // Fetch dossier data for authorized slugs
    const dossiers = [];

    for (const slug of authorizedSlugs) {
      // Check if it's a static dossier
      if (STATIC_DOSSIERS[slug]) {
        dossiers.push({
          ...STATIC_DOSSIERS[slug],
          viewUrl: null  // Portal will use staticUrl for these
        });
        continue;
      }

      // Check if it's a generated dossier
      const profile = await kv.get(`investor-profile:${slug}`);
      if (profile && profile.profile) {
        dossiers.push({
          slug,
          name: profile.profile.name || 'Unknown Investor',
          company: profile.profile.firm || 'Unknown Firm',
          role: profile.profile.role || 'Investor',
          isStatic: false,
          generatedAt: profile.generatedAt,
          sourceCoverage: profile.verification?.sourceStats?.sourceCoveragePercent || null,
          viewUrl: '/portal-dossier.html'
        });
      }
    }

    return res.status(200).json({
      client: {
        name: client.name,
      },
      dossiers,
      count: dossiers.length,
    });

  } catch (error) {
    console.error('Get client dossiers error:', error);
    return res.status(500).json({ error: 'Failed to get dossiers' });
  }
}
