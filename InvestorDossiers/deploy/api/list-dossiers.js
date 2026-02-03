import { kv } from '@vercel/kv';

export default async function handler(req, res) {
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
    // Get the list of generated dossiers
    const listKey = 'generated-dossiers-list';
    const dossierList = await kv.get(listKey) || [];

    // Sort by generation date (most recent first)
    const sortedList = dossierList.sort((a, b) => {
      return new Date(b.generatedAt) - new Date(a.generatedAt);
    });

    return res.status(200).json({
      success: true,
      dossiers: sortedList,
      count: sortedList.length
    });

  } catch (error) {
    console.error('List dossiers error:', error);
    return res.status(500).json({
      error: 'Failed to list dossiers',
      details: error.message
    });
  }
}
