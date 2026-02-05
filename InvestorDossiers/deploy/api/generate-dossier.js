import {
  generateAndStoreProfile
} from '../lib/generate-dossier-core.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firstName, lastName, company } = req.body;

    // Validate inputs
    if (!firstName || !firstName.trim()) {
      return res.status(400).json({ error: 'firstName is required' });
    }
    if (!lastName || !lastName.trim()) {
      return res.status(400).json({ error: 'lastName is required' });
    }
    if (!company || !company.trim()) {
      return res.status(400).json({ error: 'company is required' });
    }

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedCompany = company.trim();

    const result = await generateAndStoreProfile({
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      company: trimmedCompany
    });

    return res.status(200).json({
      success: true,
      investorSlug: result.investorSlug,
      profile: result.profile,
      verification: result.verification,
      generatedAt: result.generatedAt,
      viewUrl: `/dossier.html?investor=${result.investorSlug}`
    });

  } catch (error) {
    console.error('Dossier generation error:', error);
    const response = {
      error: 'Failed to generate dossier',
      details: error.message
    };
    if (error.rawResponse) {
      response.rawResponse = error.rawResponse;
    }
    return res.status(500).json(response);
  }
}
