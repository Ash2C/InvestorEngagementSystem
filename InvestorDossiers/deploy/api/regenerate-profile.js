import { kv } from '@vercel/kv';
import Anthropic from '@anthropic-ai/sdk';

// Trusted source domains for verification
const TRUSTED_DOMAINS = [
  'linkedin.com',
  'crunchbase.com',
  'techcrunch.com',
  'reuters.com',
  'bloomberg.com',
  'forbes.com',
  'wsj.com',
  'nytimes.com',
  'ft.com',
  'pitchbook.com',
  'cbinsights.com',
  'signal.nfx.com',
  'a16z.com',
  'dst-global.com',
  'wikipedia.org',
  'sec.gov',
  'github.com',
  'twitter.com',
  'x.com',
  'medium.com',
  'substack.com',
  'youtube.com',
  'businessinsider.com',
  'theinformation.com',
  'axios.com',
  'cnbc.com',
  'venturebeat.com',
  'sifted.eu',
  'dealstreetasia.com',
  'entrackr.com',
  'inc42.com',
  'tracxn.com',
  'baybrazil.org',
  'becocapital.com'
];

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
      'https://dst-global.com/',
      'https://tracxn.com/d/venture-capital/dst-global/__9mTBqRmKSkZg8xVhcwtufbL9L5mIfCFG4yg5KuVaD5Q',
      'https://www.baybrazil.org/saurabh-gupta-dst-global',
      'https://becocapital.com/fireside-chat-the-future-of-ai-investment-with-dst-global-s-saurabh-gupta/'
    ],
    knownPortfolio: [
      'Facebook', 'Twitter', 'WhatsApp', 'Spotify', 'Alibaba', 'Airbnb',
      'Nubank', 'Klarna', 'Brex', 'Swiggy', 'Udaan', 'Rappi', 'Chime',
      'Whatnot', 'Safe Superintelligence', 'Mistral AI', 'Poolside',
      'Harvey', 'Anysphere', 'Cursor', 'ByteDance'
    ]
  },
  'yoko-li': {
    name: 'Yoko Li',
    firm: 'Andreessen Horowitz (a16z)',
    sources: [
      'https://www.linkedin.com/in/yokoli/',
      'https://a16z.com/author/yoko-li/',
      'https://github.com/ykhli',
      'https://x.com/stuffyokodraws',
      'https://fly.io/blog/how-i-fly-yoko-li/'
    ],
    knownPortfolio: [
      'Clerk', 'Resend', 'Mintlify', 'Inngest', 'Stainless',
      'Upstash', 'Nx', 'Svix', 'Arcjet', 'HashiCorp', 'Terraform',
      'AppDynamics', 'Transposit'
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

1. **EVERY factual claim MUST have a source URL.** This is mandatory. No exceptions.
2. **ONLY include information you can verify** with a real, accessible URL.
3. **For portfolio companies**, ONLY mention companies from this verified list: ${investor.knownPortfolio.join(', ')}
4. **Do NOT invent investment amounts, valuations, or exit values** unless you have a source URL.
5. **Do NOT claim relationships or investments** that you cannot verify with a URL.
6. **Use these reference sources:** ${investor.sources.join(', ')}

## SOURCE URL REQUIREMENTS:

- Every claim must include a "source" field with a valid URL
- Acceptable source domains include: LinkedIn, Crunchbase, TechCrunch, Bloomberg, Forbes, Reuters, Wikipedia, company websites, SEC filings
- If you cannot provide a source URL for a claim, DO NOT include that claim
- Use the most authoritative source available (e.g., SEC filings > news articles > LinkedIn)

## INVESTOR TO RESEARCH:
- **Name:** ${investor.name}
- **Firm:** ${investor.firm}
- **Reference Sources:** ${investor.sources.join(', ')}
- **Known Portfolio:** ${investor.knownPortfolio.join(', ')}

## OUTPUT FORMAT:

Return a JSON object with this exact structure. Note that EVERY object with factual claims must have a "source" field:

{
  "lastUpdated": "YYYY-MM-DD",
  "profile": {
    "name": "${investor.name}",
    "firm": "${investor.firm}",
    "role": "Their current role/title",
    "roleSource": "URL verifying the role",
    "team": "Team or focus area if applicable"
  },
  "background": {
    "summary": "2-3 sentence overview of who they are",
    "summarySource": "Primary source URL for the summary",
    "careerHighlights": [
      {
        "company": "Company name",
        "role": "Role",
        "period": "Time period if known",
        "description": "Brief description",
        "source": "URL verifying this career highlight"
      }
    ],
    "education": [
      {
        "institution": "School name",
        "degree": "Degree type",
        "field": "Field of study",
        "year": "Graduation year if known",
        "source": "URL verifying education"
      }
    ],
    "uniqueTraits": [
      {
        "trait": "What makes them unique",
        "source": "URL supporting this trait"
      }
    ]
  },
  "investmentThesis": {
    "corePhilosophy": "Their core investment philosophy in 1-2 sentences",
    "philosophySource": "URL where they stated this philosophy",
    "keyConcepts": [
      {
        "name": "Concept name",
        "description": "Explanation",
        "source": "URL where they discussed this concept"
      }
    ],
    "patterns": [
      {
        "pattern": "What they look for",
        "source": "URL supporting this pattern"
      }
    ],
    "antiPatterns": [
      {
        "antiPattern": "What they avoid",
        "source": "URL if available, otherwise null"
      }
    ]
  },
  "portfolio": {
    "notableInvestments": [
      {
        "name": "Company",
        "description": "Brief description",
        "stage": "Stage if known",
        "role": "Board seat / Board observer / Investor",
        "source": "URL verifying this investment"
      }
    ],
    "recentInvestments": [
      {
        "name": "Company",
        "description": "Brief description",
        "date": "YYYY-MM",
        "amount": "Investment amount if public",
        "valuation": "Valuation if public",
        "source": "URL verifying this investment"
      }
    ],
    "historicExits": [
      {
        "name": "Company",
        "description": "Brief description",
        "outcome": "IPO/Acquisition/etc",
        "exitValue": "Exit value if public",
        "source": "URL verifying this exit"
      }
    ]
  },
  "recentActivity": {
    "speaking": [
      {
        "event": "Event name",
        "topic": "Topic",
        "date": "YYYY-MM",
        "source": "URL to video/article/announcement"
      }
    ],
    "writing": [
      {
        "title": "Article title",
        "topic": "Key themes",
        "date": "YYYY-MM",
        "source": "URL to the article"
      }
    ],
    "mediaAppearances": [
      {
        "outlet": "Media outlet",
        "title": "Title or topic",
        "date": "YYYY-MM",
        "source": "URL to the appearance"
      }
    ]
  },
  "engagement": {
    "doList": [
      {
        "tip": "How to engage effectively",
        "source": "URL supporting this tip, or null if general advice"
      }
    ],
    "dontList": [
      {
        "tip": "What to avoid",
        "source": "URL supporting this, or null if general advice"
      }
    ],
    "questionsTheyAsk": [
      {
        "question": "Typical question they ask",
        "source": "URL where they mentioned asking this, or null"
      }
    ]
  },
  "allSources": [
    {
      "url": "Full URL",
      "title": "Page/article title",
      "domain": "Domain name",
      "accessDate": "YYYY-MM-DD",
      "usedFor": ["List of claims this source supports"]
    }
  ]
}

## IMPORTANT NOTES:

1. The "allSources" array at the end should compile ALL unique sources used throughout the profile
2. Each source URL should be a real, accessible URL - do not make up URLs
3. If a source field is required but you have no source, set it to null - but try to avoid claims without sources
4. Be thorough but accurate - it's better to have fewer claims with sources than many claims without
5. For the "usedFor" field in allSources, list the specific claims that source verifies`;
}

// Validate that a URL is from a trusted domain
function isFromTrustedDomain(url) {
  if (!url || url === 'null' || url === null) return false;
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase().replace('www.', '');
    return TRUSTED_DOMAINS.some(domain => hostname.includes(domain));
  } catch {
    return false;
  }
}

// Extract domain from URL
function extractDomain(url) {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return null;
  }
}

// Verify the generated profile for hallucinations and source quality
function verifyProfile(profile, investorSlug) {
  const investor = INVESTOR_SOURCES[investorSlug];
  const knownPortfolio = new Set(investor.knownPortfolio.map(c => c.toLowerCase()));
  const warnings = [];
  const sourceStats = {
    totalClaims: 0,
    claimsWithSources: 0,
    claimsWithTrustedSources: 0,
    claimsWithoutSources: 0,
    uniqueSources: new Set(),
    untrustedSources: []
  };

  // Helper to check company names
  const isKnownCompany = (name) => {
    if (!name) return false;
    const normalized = name.toLowerCase();
    for (const known of knownPortfolio) {
      if (normalized.includes(known) || known.includes(normalized)) {
        return true;
      }
    }
    return false;
  };

  // Helper to validate a source URL and track stats
  const validateSource = (source, fieldPath, claimDescription) => {
    sourceStats.totalClaims++;

    if (!source || source === 'null' || source === null) {
      sourceStats.claimsWithoutSources++;
      warnings.push({
        field: fieldPath,
        claim: claimDescription,
        severity: 'medium',
        message: `No source provided for: "${claimDescription}"`
      });
      return { hasSource: false, isTrusted: false };
    }

    sourceStats.claimsWithSources++;
    sourceStats.uniqueSources.add(source);

    if (isFromTrustedDomain(source)) {
      sourceStats.claimsWithTrustedSources++;
      return { hasSource: true, isTrusted: true, url: source };
    } else {
      sourceStats.untrustedSources.push(source);
      warnings.push({
        field: fieldPath,
        source: source,
        severity: 'low',
        message: `Source from untrusted domain: ${extractDomain(source)}`
      });
      return { hasSource: true, isTrusted: false, url: source };
    }
  };

  // Check profile basics
  if (profile.profile?.roleSource) {
    validateSource(profile.profile.roleSource, 'profile.role', profile.profile.role);
  }

  // Check background section
  if (profile.background) {
    if (profile.background.summarySource) {
      validateSource(profile.background.summarySource, 'background.summary', 'Background summary');
    }

    // Career highlights
    (profile.background.careerHighlights || []).forEach((item, idx) => {
      validateSource(item.source, `background.careerHighlights[${idx}]`, `${item.role} at ${item.company}`);
    });

    // Education
    (profile.background.education || []).forEach((item, idx) => {
      validateSource(item.source, `background.education[${idx}]`, `${item.degree || 'Degree'} from ${item.institution}`);
    });

    // Unique traits
    (profile.background.uniqueTraits || []).forEach((item, idx) => {
      if (typeof item === 'object' && item.trait) {
        validateSource(item.source, `background.uniqueTraits[${idx}]`, item.trait);
      }
    });
  }

  // Check investment thesis
  if (profile.investmentThesis) {
    if (profile.investmentThesis.philosophySource) {
      validateSource(profile.investmentThesis.philosophySource, 'investmentThesis.corePhilosophy', 'Core philosophy');
    }

    (profile.investmentThesis.keyConcepts || []).forEach((item, idx) => {
      validateSource(item.source, `investmentThesis.keyConcepts[${idx}]`, item.name);
    });

    (profile.investmentThesis.patterns || []).forEach((item, idx) => {
      if (typeof item === 'object' && item.pattern) {
        validateSource(item.source, `investmentThesis.patterns[${idx}]`, item.pattern);
      }
    });
  }

  // Check portfolio sections
  if (profile.portfolio) {
    // Notable investments
    (profile.portfolio.notableInvestments || []).forEach((company, idx) => {
      if (!isKnownCompany(company.name)) {
        warnings.push({
          field: `portfolio.notableInvestments[${idx}]`,
          company: company.name,
          severity: 'high',
          message: `Unknown company "${company.name}" not in verified portfolio list`
        });
      }
      validateSource(company.source, `portfolio.notableInvestments[${idx}]`, `Investment in ${company.name}`);
    });

    // Recent investments
    (profile.portfolio.recentInvestments || []).forEach((inv, idx) => {
      if (!isKnownCompany(inv.name)) {
        warnings.push({
          field: `portfolio.recentInvestments[${idx}]`,
          company: inv.name,
          severity: 'high',
          message: `Unknown company "${inv.name}" in recent investments`
        });
      }
      validateSource(inv.source, `portfolio.recentInvestments[${idx}]`, `Recent investment in ${inv.name}`);
    });

    // Historic exits
    (profile.portfolio.historicExits || []).forEach((exit, idx) => {
      if (!isKnownCompany(exit.name)) {
        warnings.push({
          field: `portfolio.historicExits[${idx}]`,
          company: exit.name,
          severity: 'high',
          message: `Unknown company "${exit.name}" in historic exits`
        });
      }
      validateSource(exit.source, `portfolio.historicExits[${idx}]`, `Exit: ${exit.name}`);
    });
  }

  // Check recent activity
  if (profile.recentActivity) {
    (profile.recentActivity.speaking || []).forEach((item, idx) => {
      validateSource(item.source, `recentActivity.speaking[${idx}]`, `Speaking at ${item.event}`);
    });

    (profile.recentActivity.writing || []).forEach((item, idx) => {
      validateSource(item.source, `recentActivity.writing[${idx}]`, item.title);
    });

    (profile.recentActivity.mediaAppearances || []).forEach((item, idx) => {
      validateSource(item.source, `recentActivity.mediaAppearances[${idx}]`, `${item.outlet}: ${item.title}`);
    });
  }

  // Check for dollar amount claims without sources
  const dollarPattern = /\$[\d,.]+\s*[BMK]?\s*(?:billion|million)?/gi;
  const textToCheck = JSON.stringify(profile);
  const dollarMatches = textToCheck.match(dollarPattern) || [];

  // Calculate source coverage percentage
  const sourceCoverage = sourceStats.totalClaims > 0
    ? Math.round((sourceStats.claimsWithSources / sourceStats.totalClaims) * 100)
    : 0;

  const trustedSourceCoverage = sourceStats.totalClaims > 0
    ? Math.round((sourceStats.claimsWithTrustedSources / sourceStats.totalClaims) * 100)
    : 0;

  // Determine overall validity
  const highSeverityCount = warnings.filter(w => w.severity === 'high').length;
  const isValid = highSeverityCount === 0 && sourceCoverage >= 50;

  return {
    isValid,
    warnings,
    sourceStats: {
      totalClaims: sourceStats.totalClaims,
      claimsWithSources: sourceStats.claimsWithSources,
      claimsWithTrustedSources: sourceStats.claimsWithTrustedSources,
      claimsWithoutSources: sourceStats.claimsWithoutSources,
      uniqueSourceCount: sourceStats.uniqueSources.size,
      sourceCoveragePercent: sourceCoverage,
      trustedSourceCoveragePercent: trustedSourceCoverage,
      untrustedSources: sourceStats.untrustedSources
    },
    summary: {
      highSeverity: highSeverityCount,
      mediumSeverity: warnings.filter(w => w.severity === 'medium').length,
      lowSeverity: warnings.filter(w => w.severity === 'low').length
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

    // Verify the profile for hallucinations and source quality
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
