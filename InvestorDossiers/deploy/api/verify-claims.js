import { kv } from '@vercel/kv';
import { parse as parseYaml } from 'yaml';

// Shared investor dossier content - in production, centralize this
const INVESTOR_DOSSIERS = {
  'yoko-li': `---
name: "Yoko Li"
firm: "Andreessen Horowitz (a16z)"
portfolio_companies:
  - "Resend"
  - "Clerk"
  - "Mintlify"
  - "Inngest"
  - "Stainless"
  - "Upstash"
  - "Nx"
  - "Svix"
  - "Arcjet"
---`,
  'saurabh-gupta': `---
name: "Saurabh Gupta"
firm: "DST Global"
portfolio_companies:
  - "Brex"
  - "Swiggy"
  - "Udaan"
  - "Rappi"
  - "Airbnb"
  - "Safe Superintelligence"
  - "Mistral AI"
  - "Poolside"
  - "Harvey"
  - "Anysphere"
  - "Cursor"
  - "Chime"
  - "Whatnot"
  - "Facebook"
  - "Twitter"
  - "WhatsApp"
  - "Spotify"
  - "Alibaba"
  - "Nubank"
  - "Klarna"
---`
};

function parseInvestorYaml(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    throw new Error('Invalid dossier format');
  }
  return parseYaml(match[1]);
}

function extractCompanyMentions(text) {
  // Extract potential company names (capitalized words, common patterns)
  const companyPatterns = [
    /(?:backed|invested in|portfolio company|led investment in|board observer at)\s+([A-Z][a-zA-Z0-9\s&.]+?)(?:\s*[,.\-]|$)/gi,
    /(?:like|similar to|just as|same as)\s+([A-Z][a-zA-Z0-9\s&.]+?)(?:\s+(?:did|does|is|was|has)|[,.\-]|$)/gi,
  ];

  const mentions = new Set();

  for (const pattern of companyPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const company = match[1].trim();
      if (company.length > 1 && company.length < 50) {
        mentions.add(company);
      }
    }
  }

  return Array.from(mentions);
}

function normalizeCompanyName(name) {
  return name.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '')
    .replace(/inc$/, '')
    .replace(/corp$/, '')
    .replace(/ai$/, '');
}

function isCompanyInPortfolio(companyName, portfolioCompanies) {
  const normalizedInput = normalizeCompanyName(companyName);

  for (const portfolioCompany of portfolioCompanies) {
    const normalizedPortfolio = normalizeCompanyName(portfolioCompany);

    // Exact match or substring match
    if (normalizedInput === normalizedPortfolio ||
        normalizedInput.includes(normalizedPortfolio) ||
        normalizedPortfolio.includes(normalizedInput)) {
      return { verified: true, matchedCompany: portfolioCompany };
    }
  }

  return { verified: false };
}

function verifyAnalysisClaims(analysis, investorData) {
  const portfolioCompanies = investorData.portfolio_companies || [];
  const verifiedClaims = [];
  const unverifiedClaims = [];
  const warnings = [];

  // Check portfolio analogies
  const analogies = analysis.pitchRecommendations?.portfolioAnalogies || [];
  for (const analogy of analogies) {
    const result = isCompanyInPortfolio(analogy.company, portfolioCompanies);
    if (result.verified) {
      verifiedClaims.push({
        claim: `Portfolio analogy: ${analogy.company}`,
        source: 'portfolio_companies',
        matchedTo: result.matchedCompany
      });
    } else {
      unverifiedClaims.push({
        claim: `Portfolio analogy: ${analogy.company}`,
        reason: 'Company not found in investor portfolio',
        severity: 'high'
      });
    }
  }

  // Check opening hook for company mentions
  const openingHook = analysis.pitchRecommendations?.openingHook || '';
  const hookMentions = extractCompanyMentions(openingHook);
  for (const company of hookMentions) {
    const result = isCompanyInPortfolio(company, portfolioCompanies);
    if (!result.verified) {
      // Check if it might be claiming a backed relationship
      if (openingHook.toLowerCase().includes('backed') ||
          openingHook.toLowerCase().includes('invested')) {
        unverifiedClaims.push({
          claim: `Opening hook mentions: ${company}`,
          reason: 'Company mentioned in investment context but not verified in portfolio',
          severity: 'high',
          context: openingHook
        });
      }
    }
  }

  // Check key alignments for potentially fabricated claims
  const alignments = analysis.keyAlignments || [];
  for (const alignment of alignments) {
    const mentions = extractCompanyMentions(alignment.explanation || '');
    for (const company of mentions) {
      const result = isCompanyInPortfolio(company, portfolioCompanies);
      if (!result.verified && company !== investorData.firm) {
        warnings.push({
          section: 'keyAlignments',
          area: alignment.area,
          mention: company,
          warning: 'Company mentioned but not in known portfolio - verify accuracy'
        });
      }
    }
  }

  // Check for specific valuation/dollar claims that should be verified
  const dollarPattern = /\$[\d,.]+[BMK]?\s*(?:valuation|investment|round|exit|acquisition)/gi;
  const fullText = JSON.stringify(analysis);
  const dollarClaims = fullText.match(dollarPattern) || [];

  if (dollarClaims.length > 0) {
    for (const claim of dollarClaims) {
      warnings.push({
        section: 'general',
        warning: `Specific dollar claim detected: "${claim}" - ensure this is sourced`,
        severity: 'medium'
      });
    }
  }

  return {
    verifiedClaims,
    unverifiedClaims,
    warnings,
    summary: {
      totalVerified: verifiedClaims.length,
      totalUnverified: unverifiedClaims.length,
      totalWarnings: warnings.length,
      overallStatus: unverifiedClaims.some(c => c.severity === 'high') ? 'FLAGGED' :
                     warnings.length > 0 ? 'REVIEW' : 'PASSED'
    }
  };
}

export default async function handler(req, res) {
  // Set CORS headers
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
    const { briefingId, investorSlug, analysis } = req.body;

    if (!investorSlug) {
      return res.status(400).json({ error: 'investorSlug is required' });
    }

    // Get analysis from briefing if not provided directly
    let analysisToVerify = analysis;
    if (!analysisToVerify && briefingId) {
      const briefing = await kv.get(briefingId);
      if (!briefing || !briefing.positioningAnalysis) {
        return res.status(404).json({ error: 'No analysis found for this briefing' });
      }
      analysisToVerify = briefing.positioningAnalysis;
    }

    if (!analysisToVerify) {
      return res.status(400).json({ error: 'Either briefingId or analysis is required' });
    }

    // Get investor dossier
    const dossierContent = INVESTOR_DOSSIERS[investorSlug];
    if (!dossierContent) {
      return res.status(404).json({ error: `Investor dossier not found: ${investorSlug}` });
    }

    const investorData = parseInvestorYaml(dossierContent);

    // Verify claims
    const verificationResult = verifyAnalysisClaims(analysisToVerify, investorData);

    return res.status(200).json({
      success: true,
      investorSlug,
      verification: verificationResult
    });

  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({
      error: 'Failed to verify claims',
      details: error.message
    });
  }
}
