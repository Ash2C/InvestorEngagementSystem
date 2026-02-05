import { kv } from '@vercel/kv';
import {
  generateSlug,
  getExistingProfile,
  generateAndStoreProfile
} from '../../lib/generate-dossier-core.js';

// Helper to validate client token (same pattern as briefing.js)
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

    return { valid: true, client, clientId };
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false, error: 'Token validation failed' };
  }
}

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
    const { firstName, lastName, company, clientToken } = req.body;

    // Validate client token
    if (!clientToken) {
      return res.status(400).json({ error: 'clientToken is required' });
    }

    const authResult = await validateClientToken(clientToken);
    if (!authResult.valid) {
      return res.status(401).json({ error: authResult.error });
    }

    const client = authResult.client;
    const clientId = authResult.clientId;

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

    const investorSlug = generateSlug(trimmedFirstName, trimmedLastName);

    // Check if profile already exists in KV
    let result;
    let reused = false;
    const existing = await getExistingProfile(investorSlug);

    if (existing && existing.profile) {
      // Reuse existing profile
      result = {
        investorSlug,
        profile: existing.profile,
        verification: existing.verification,
        generatedAt: existing.generatedAt
      };
      reused = true;
    } else {
      // Generate new profile
      result = await generateAndStoreProfile({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        company: trimmedCompany
      });
    }

    // Add slug to client's authorizedDossiers if not already present
    if (!client.authorizedDossiers.includes(investorSlug)) {
      client.authorizedDossiers.push(investorSlug);
      await kv.set(`client:${clientId}`, client);
    }

    return res.status(200).json({
      success: true,
      investorSlug,
      profile: result.profile,
      verification: result.verification,
      generatedAt: result.generatedAt,
      reused,
      viewUrl: `/portal-dossier.html?t=${encodeURIComponent(client.token)}&investor=${encodeURIComponent(investorSlug)}`
    });

  } catch (error) {
    console.error('Client dossier generation error:', error);
    return res.status(500).json({
      error: 'Failed to generate dossier',
      details: error.message
    });
  }
}
