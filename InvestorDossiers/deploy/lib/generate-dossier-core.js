import { kv } from '@vercel/kv';
import Anthropic from '@anthropic-ai/sdk';

// Trusted source domains for verification
export const TRUSTED_DOMAINS = [
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
  'sequoiacap.com',
  'greylock.com',
  'benchmark.com',
  'kleinerperkins.com',
  'accel.com',
  'indexventures.com',
  'lightspeedvp.com',
  'generalcatalyst.com',
  'bessemer.com',
  'insightpartners.com',
  'founderfund.com'
];

// Generate investor slug from name
export function generateSlug(firstName, lastName) {
  const combined = `${firstName}-${lastName}`.toLowerCase();
  return combined.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// Build the comprehensive prompt for Claude to research the investor
function buildGenerationPrompt(firstName, lastName, company) {
  const fullName = `${firstName} ${lastName}`;

  return `You are a research analyst creating a comprehensive investor dossier. Your goal is to create a dossier similar in depth and quality to what would be created for a top-tier VC partner - comprehensive, well-sourced, and actionable for founders preparing to meet this investor.

## INVESTOR TO RESEARCH:
- **Name:** ${fullName}
- **Firm/Company:** ${company}

## CRITICAL INSTRUCTIONS:

1. **EVERY factual claim MUST have a source URL.** This is mandatory. No exceptions.
2. **ONLY include information you can verify** with a real, accessible URL.
3. **Research thoroughly** - look for LinkedIn profiles, Crunchbase entries, news articles, podcast appearances, blog posts, firm websites, Twitter/X, GitHub, and any published writing.
4. **Think like a founder** - what would they need to know to prepare for a meeting with this investor?
5. **Be specific** - generic advice is not helpful. Tailor everything to this specific investor's known preferences and history.

## RESEARCH STRATEGY:

Search for information about this investor from:
1. **LinkedIn** - Professional background, education, current role, career history
2. **Firm website** - Team page, blog posts, investment thesis, portfolio
3. **Crunchbase** - Investment history, portfolio companies, deal sizes
4. **News articles** - TechCrunch, Forbes, Bloomberg, WSJ, Reuters coverage
5. **Podcasts & interviews** - YouTube, podcast platforms, conference talks
6. **Twitter/X** - Recent thoughts, interactions, interests
7. **GitHub** - If they're technical, look for open source work
8. **Their own writing** - Blog posts, articles, newsletters
9. **SEC filings** - For public information about investments
10. **Wikipedia** - If they're notable enough

## OUTPUT FORMAT:

Return a JSON object with this comprehensive structure. EVERY claim must have a source field:

{
  "lastUpdated": "YYYY-MM-DD",

  "profile": {
    "name": "${fullName}",
    "firm": "${company}",
    "role": "Their current role/title",
    "roleSource": "URL verifying the role",
    "team": "Team or focus area if applicable (e.g., 'AI & Infrastructure', 'Consumer', 'Fintech')",
    "teamSource": "URL verifying the team"
  },

  "contactLinks": {
    "email": "email@firm.com or null if not found",
    "linkedin": "Full LinkedIn URL",
    "twitter": "Full Twitter/X URL or null",
    "github": "Full GitHub URL or null",
    "website": "Personal website or firm portfolio page URL",
    "other": [{ "label": "Label", "url": "URL" }]
  },

  "investmentFocus": {
    "areas": ["Area 1", "Area 2", "Area 3"],
    "areasSource": "URL verifying focus areas",
    "stages": ["Pre-seed", "Seed", "Series A", "Series B"],
    "stagesSource": "URL verifying stages",
    "checkSize": {
      "min": "$500K",
      "max": "$15M",
      "source": "URL verifying check size, or null if not publicly known"
    },
    "geographies": ["US", "Europe", "Global"],
    "geographiesSource": "URL or null"
  },

  "background": {
    "summary": "2-3 sentence overview of who they are and what makes them notable as an investor",
    "summarySource": "Primary source URL for the summary",
    "careerHighlights": [
      {
        "company": "Company name",
        "role": "Role",
        "period": "Time period if known",
        "description": "Brief description of what they did and why it matters",
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
        "trait": "What makes them unique - be specific and memorable",
        "description": "Why this matters for founders meeting them",
        "source": "URL supporting this trait"
      }
    ]
  },

  "investmentThesis": {
    "corePhilosophy": "Their core investment philosophy in 1-2 sentences - use a direct quote if possible",
    "philosophySource": "URL where they stated this philosophy",
    "keyConcepts": [
      {
        "name": "Concept name they've coined or championed",
        "description": "Detailed explanation of the concept",
        "whyItMatters": "Why founders should understand this",
        "source": "URL where they discussed this concept"
      }
    ],
    "patterns": [
      {
        "pattern": "Specific pattern they look for in investments",
        "examples": "Examples from their portfolio that demonstrate this",
        "source": "URL supporting this pattern"
      }
    ],
    "antiPatterns": [
      {
        "antiPattern": "What they explicitly avoid or have said they don't invest in",
        "reason": "Why they avoid this if known",
        "source": "URL if available, otherwise null"
      }
    ]
  },

  "portfolio": {
    "investmentPatterns": [
      {
        "pattern": "Common pattern across their investments",
        "description": "How this shows up across portfolio",
        "source": "URL or null"
      }
    ],
    "notableInvestments": [
      {
        "name": "Company",
        "description": "What the company does",
        "whyNotable": "Why this investment is notable (outcome, fit with thesis, etc.)",
        "stage": "Investment stage if known",
        "role": "Board seat / Board observer / Investor",
        "source": "URL verifying this investment"
      }
    ],
    "recentInvestments": [
      {
        "name": "Company",
        "description": "What the company does",
        "date": "YYYY-MM or year",
        "amount": "Investment amount if public",
        "source": "URL verifying this investment"
      }
    ],
    "historicExits": [
      {
        "name": "Company",
        "description": "What the company did",
        "outcome": "IPO/Acquisition/etc",
        "details": "Exit value or acquirer if known",
        "source": "URL verifying this exit"
      }
    ]
  },

  "recentActivity": {
    "currentFocus": "What they're currently most focused on or excited about (1-2 sentences)",
    "currentFocusSource": "URL",
    "podcasts": [
      {
        "title": "Episode/podcast title",
        "show": "Podcast name",
        "date": "YYYY-MM",
        "keyTopics": ["Topic 1", "Topic 2"],
        "source": "URL to episode"
      }
    ],
    "articles": [
      {
        "title": "Article title",
        "publication": "Where published",
        "date": "YYYY-MM",
        "keyThemes": ["Theme 1", "Theme 2"],
        "source": "URL to article"
      }
    ],
    "speaking": [
      {
        "event": "Conference/event name",
        "topic": "What they spoke about",
        "date": "YYYY-MM",
        "source": "URL to video/announcement"
      }
    ]
  },

  "positioning": {
    "framework": "How to position for this investor in 2-3 sentences - what's the key framing?",
    "frameworkSource": "URL supporting this, or null if derived from their thesis",
    "oneLinerTemplate": "A template one-liner that founders can customize: 'We're building the [X] for [Y] - just as [Portfolio Co] is [what they do]...'",
    "languageToUse": [
      {
        "term": "Term or phrase they use",
        "context": "When to use it",
        "source": "URL where they used this language, or null"
      }
    ],
    "languageToAvoid": [
      {
        "term": "Term or phrase to avoid",
        "reason": "Why to avoid it",
        "source": "URL if known, or null"
      }
    ],
    "portfolioAnalogies": [
      {
        "setup": "When discussing [topic]",
        "analogy": "Full analogy script: 'It's like how [Portfolio Co] does [X]...'",
        "source": "URL about the portfolio company, or null"
      }
    ]
  },

  "anticipatedQA": [
    {
      "question": "Likely question they'll ask based on their known interests and concerns",
      "whyTheyAsk": "Why this question matters to them specifically",
      "suggestedApproach": "How to approach answering this question",
      "exampleResponse": "Example response framework or key points to hit",
      "source": "URL where they've discussed this topic, or null if inferred from thesis"
    }
  ],

  "meetingPrep": {
    "technicalDepth": "How technical to go based on their background (high/medium/low)",
    "technicalDepthReason": "Why this level based on their background",
    "keyTopicsToAddress": ["Topic 1 based on their interests", "Topic 2", "Topic 3"],
    "thingsToHaveReady": ["Specific thing 1", "Specific thing 2", "Cohort data if they care about metrics"],
    "redFlags": ["Thing that would concern them based on their thesis", "Another red flag"]
  },

  "engagement": {
    "doList": [
      {
        "tip": "Specific, actionable tip for engaging with them",
        "reason": "Why this works for them specifically",
        "source": "URL supporting this tip, or null if general advice"
      }
    ],
    "dontList": [
      {
        "tip": "What to avoid",
        "reason": "Why this doesn't work for them",
        "source": "URL supporting this, or null if general advice"
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

## QUALITY STANDARDS:

1. **Be specific, not generic.** Every tip should be tailored to THIS investor based on their actual history, writing, and stated preferences.

2. **Portfolio analogies matter.** If they have portfolio companies, reference them specifically in positioning advice.

3. **Anticipate real questions.** Base Q&A on their known interests, things they've written about, or common themes in their investments.

4. **Cite everything.** The dossier should feel well-researched and credible. Every major claim needs a source.

5. **Think like a founder.** What would actually help someone prepare for a meeting? Generic VC advice is not helpful.

6. **Acknowledge limitations.** If information isn't available (e.g., check size not public), say so rather than making it up. Empty arrays are fine if you can't find verified information.

## IMPORTANT NOTES:

1. The "allSources" array should compile ALL unique sources used throughout the profile
2. Each source URL should be real and accessible - do not make up URLs
3. If you cannot find much information about this investor, still return valid JSON with what you can find
4. Focus on quality over quantity - fewer sourced claims are better than many unsourced claims
5. For less prominent investors, focus on whatever public information exists and note limitations`;
}

// Validate that a URL is from a trusted domain
export function isFromTrustedDomain(url) {
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

// Verify the generated profile for source quality
export function verifyProfile(profile) {
  const warnings = [];
  const sourceStats = {
    totalClaims: 0,
    claimsWithSources: 0,
    claimsWithTrustedSources: 0,
    claimsWithoutSources: 0,
    uniqueSources: new Set(),
    untrustedSources: []
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

    (profile.background.careerHighlights || []).forEach((item, idx) => {
      validateSource(item.source, `background.careerHighlights[${idx}]`, `${item.role} at ${item.company}`);
    });

    (profile.background.education || []).forEach((item, idx) => {
      validateSource(item.source, `background.education[${idx}]`, `${item.degree || 'Degree'} from ${item.institution}`);
    });

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
    (profile.portfolio.notableInvestments || []).forEach((company, idx) => {
      validateSource(company.source, `portfolio.notableInvestments[${idx}]`, `Investment in ${company.name}`);
    });

    (profile.portfolio.recentInvestments || []).forEach((inv, idx) => {
      validateSource(inv.source, `portfolio.recentInvestments[${idx}]`, `Recent investment in ${inv.name}`);
    });

    (profile.portfolio.historicExits || []).forEach((exit, idx) => {
      validateSource(exit.source, `portfolio.historicExits[${idx}]`, `Exit: ${exit.name}`);
    });
  }

  // Check recent activity
  if (profile.recentActivity) {
    (profile.recentActivity.podcasts || []).forEach((item, idx) => {
      validateSource(item.source, `recentActivity.podcasts[${idx}]`, item.title);
    });

    (profile.recentActivity.articles || []).forEach((item, idx) => {
      validateSource(item.source, `recentActivity.articles[${idx}]`, item.title);
    });

    (profile.recentActivity.speaking || []).forEach((item, idx) => {
      validateSource(item.source, `recentActivity.speaking[${idx}]`, `Speaking at ${item.event}`);
    });
  }

  // Check anticipated Q&A
  (profile.anticipatedQA || []).forEach((item, idx) => {
    if (item.source) {
      validateSource(item.source, `anticipatedQA[${idx}]`, item.question);
    }
  });

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

// Check KV for an existing profile
export async function getExistingProfile(slug) {
  const storageKey = `investor-profile:${slug}`;
  const stored = await kv.get(storageKey);
  return stored || null;
}

// Full generation pipeline: Claude API call, parse, verify, store in KV, update dossier list
export async function generateAndStoreProfile({ firstName, lastName, company }) {
  const investorSlug = generateSlug(firstName, lastName);

  // Build prompt
  const prompt = buildGenerationPrompt(firstName, lastName, company);

  // Call Claude API
  let message;
  try {
    const anthropic = new Anthropic();
    message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });
  } catch (apiError) {
    console.error('Anthropic API error:', apiError);
    throw new Error(`Failed to call AI service: ${apiError.message || 'Unknown API error'}`);
  }

  if (!message || !message.content || !message.content[0] || !message.content[0].text) {
    console.error('Invalid API response structure:', message);
    throw new Error('Invalid response from AI service');
  }

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
    const err = new Error('Failed to parse profile response');
    err.rawResponse = responseText.substring(0, 1000);
    throw err;
  }

  // Verify the profile for source quality
  const verification = verifyProfile(profile);

  // Store in KV
  const storageKey = `investor-profile:${investorSlug}`;
  const generatedAt = new Date().toISOString();
  const storedData = {
    profile,
    verification,
    generatedAt,
    investorSlug,
    inputData: {
      firstName,
      lastName,
      company
    }
  };

  await kv.set(storageKey, storedData);

  // Also store in a list index for list-dossiers endpoint
  const listKey = 'generated-dossiers-list';
  let dossierList = await kv.get(listKey) || [];

  // Check if this investor already exists in the list
  const existingIndex = dossierList.findIndex(d => d.slug === investorSlug);
  const listEntry = {
    slug: investorSlug,
    name: `${firstName} ${lastName}`,
    company,
    generatedAt,
    sourceCoverage: verification.sourceStats?.sourceCoveragePercent || 0
  };

  if (existingIndex >= 0) {
    dossierList[existingIndex] = listEntry;
  } else {
    dossierList.push(listEntry);
  }

  await kv.set(listKey, dossierList);

  return {
    investorSlug,
    profile,
    verification,
    generatedAt
  };
}
