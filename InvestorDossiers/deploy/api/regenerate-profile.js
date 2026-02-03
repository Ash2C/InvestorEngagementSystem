import { kv } from '@vercel/kv';
import Anthropic from '@anthropic-ai/sdk';

// Source URLs for each investor - used for verification
const INVESTOR_SOURCES = {
  'saurabh-gupta': {
    name: 'Saurabh Gupta',
    firm: 'DST Global',
    sources: [
      'https://www.linkedin.com/in/saurabh-gupta-1a54b15/',
      'https://www.crunchbase.com/person/saurabh-gupta',
      'https://signal.nfx.com/investors/saurabh-gupta_1',
      'https://en.wikipedia.org/wiki/DST_Global',
      'https://dst-global.com/'
    ],
    knownPortfolio: [
      'Facebook', 'Twitter', 'WhatsApp', 'Spotify', 'Alibaba', 'Airbnb',
      'Nubank', 'Klarna', 'Brex', 'Swiggy', 'Udaan', 'Rappi', 'Chime',
      'Whatnot', 'Safe Superintelligence', 'Mistral AI', 'Poolside',
      'Harvey', 'Anysphere', 'Cursor'
    ]
  },
  'yoko-li': {
    name: 'Yoko Li',
    firm: 'Andreessen Horowitz (a16z)',
    sources: [
      'https://www.linkedin.com/in/yokoli/',
      'https://a16z.com/author/yoko-li/',
      'https://github.com/ykhli',
      'https://x.com/stuffyokodraws'
    ],
    knownPortfolio: [
      'Clerk', 'Resend', 'Mintlify', 'Inngest', 'Stainless',
      'Upstash', 'Nx', 'Svix', 'Arcjet'
    ]
  }
};

function buildProfilePrompt(investorSlug) {
  const investor = INVESTOR_SOURCES[investorSlug];
  if (!investor) {
    throw new Error(`Unknown investor: ${investorSlug}`);
  }

  return `You are a research analyst creating an investor dossier. Research and compile a comprehensive profile for ${investor.name} at ${investor.firm}.

## CRITICAL INSTRUCTIONS - READ CAREFULLY:

1. **ONLY include information you can verify.** Do not fabricate any facts.
2. **For portfolio companies**, ONLY mention companies from this verified list: ${investor.knownPortfolio.join(', ')}
3. **Do NOT invent investment amounts, valuations, or exit values** unless you are certain they are accurate.
4. **Do NOT claim relationships or investments** that you cannot verify.
5. **Mark uncertain information** with "[Unverified]" prefix.

## INVESTOR TO RESEARCH:
- **Name:** ${investor.name}
- **Firm:** ${investor.firm}
- **Reference Sources:** ${investor.sources.join(', ')}
- **Known Portfolio:** ${investor.knownPortfolio.join(', ')}

## OUTPUT FORMAT:

Return a JSON object with this exact structure:

{
  "lastUpdated": "YYYY-MM-DD",
  "profile": {
    "name": "${investor.name}",
    "firm": "${investor.firm}",
    "role": "Their current role/title",
    "team": "Team or focus area if applicable"
  },
  "background": {
    "summary": "2-3 sentence overview of who they are",
    "careerHighlights": [
      { "company": "Company name", "role": "Role", "description": "Brief description", "source": "URL or 'LinkedIn'" }
    ],
    "education": [
      { "institution": "School name", "field": "Field of study", "source": "URL or 'LinkedIn'" }
    ],
    "uniqueTraits": ["What makes them unique - 3-5 bullet points"]
  },
  "investmentThesis": {
    "corePhilosophy": "Their core investment philosophy in 1-2 sentences",
    "keyConcepts": [
      { "name": "Concept name", "description": "Explanation" }
    ],
    "patterns": ["What they look for - 5-7 patterns"],
    "antiPatterns": ["What they avoid - 4-6 anti-patterns"]
  },
  "portfolio": {
    "boardSeats": [
      { "name": "Company", "description": "Brief description" }
    ],
    "boardObserver": [
      { "name": "Company", "description": "Brief description" }
    ],
    "notableInvestments": [
      { "name": "Company", "description": "Brief description", "stage": "Stage if known" }
    ],
    "historicExits": [
      { "name": "Company", "description": "Brief description", "outcome": "IPO/Acquisition/etc" }
    ]
  },
  "recentActivity": {
    "investments": [
      { "company": "Company name", "description": "Brief note", "date": "YYYY-MM or 'Recent'" }
    ],
    "speaking": [
      { "event": "Event name", "topic": "Topic", "date": "YYYY-MM", "url": "URL if available" }
    ],
    "writing": [
      { "title": "Article title", "topic": "Key themes", "date": "YYYY-MM", "url": "URL" }
    ]
  },
  "engagement": {
    "doList": ["How to engage effectively - 6-8 tips"],
    "dontList": ["What to avoid - 5-6 items"],
    "questionsTheyAsk": ["Typical questions they ask - 4-6 questions"]
  },
  "sources": ["List of sources used for this profile"]
}

Be thorough but accurate. It's better to have less information that is verified than more information that might be wrong.`;
}

// Verify the generated profile for hallucinations
function verifyProfile(profile, investorSlug) {
  const investor = INVESTOR_SOURCES[investorSlug];
  const knownPortfolio = new Set(investor.knownPortfolio.map(c => c.toLowerCase()));
  const warnings = [];

  // Helper to check company names
  const isKnownCompany = (name) => {
    const normalized = name.toLowerCase();
    for (const known of knownPortfolio) {
      if (normalized.includes(known) || known.includes(normalized)) {
        return true;
      }
    }
    return false;
  };

  // Check portfolio sections
  const portfolioSections = ['boardSeats', 'boardObserver', 'notableInvestments', 'historicExits'];
  for (const section of portfolioSections) {
    const companies = profile.portfolio?.[section] || [];
    for (const company of companies) {
      if (!isKnownCompany(company.name)) {
        warnings.push({
          field: `portfolio.${section}`,
          company: company.name,
          severity: 'high',
          message: `Unknown company "${company.name}" not in verified portfolio list`
        });
      }
    }
  }

  // Check recent investments
  const recentInvestments = profile.recentActivity?.investments || [];
  for (const inv of recentInvestments) {
    if (!isKnownCompany(inv.company)) {
      warnings.push({
        field: 'recentActivity.investments',
        company: inv.company,
        severity: 'high',
        message: `Unknown company "${inv.company}" in recent investments`
      });
    }
  }

  // Check for dollar amount claims in text fields
  const dollarPattern = /\$[\d,.]+\s*[BMK]?\s*(?:billion|million)?/gi;
  const textToCheck = JSON.stringify(profile);
  const dollarMatches = textToCheck.match(dollarPattern) || [];

  for (const match of dollarMatches) {
    warnings.push({
      field: 'general',
      claim: match,
      severity: 'medium',
      message: `Dollar amount "${match}" should be verified against sources`
    });
  }

  return {
    isValid: warnings.filter(w => w.severity === 'high').length === 0,
    warnings,
    summary: {
      highSeverity: warnings.filter(w => w.severity === 'high').length,
      mediumSeverity: warnings.filter(w => w.severity === 'medium').length
    }
  };
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
    const { investorSlug } = req.body;

    if (!investorSlug) {
      return res.status(400).json({ error: 'investorSlug is required' });
    }

    if (!INVESTOR_SOURCES[investorSlug]) {
      return res.status(404).json({ error: `Unknown investor: ${investorSlug}` });
    }

    const prompt = buildProfilePrompt(investorSlug);

    // Call Claude API
    const anthropic = new Anthropic();
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const responseText = message.content[0].text;

    // Parse JSON from response
    let profile;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        profile = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
      return res.status(500).json({
        error: 'Failed to parse profile response',
        rawResponse: responseText.substring(0, 1000)
      });
    }

    // Verify the profile for hallucinations
    const verification = verifyProfile(profile, investorSlug);

    // Store in KV (overwrite previous)
    const storageKey = `investor-profile:${investorSlug}`;
    const storedData = {
      profile,
      verification,
      generatedAt: new Date().toISOString(),
      investorSlug
    };

    await kv.set(storageKey, storedData);

    return res.status(200).json({
      success: true,
      investorSlug,
      profile,
      verification,
      generatedAt: storedData.generatedAt
    });

  } catch (error) {
    console.error('Profile regeneration error:', error);
    return res.status(500).json({
      error: 'Failed to regenerate profile',
      details: error.message
    });
  }
}
