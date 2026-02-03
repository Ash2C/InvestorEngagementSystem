import { kv } from '@vercel/kv';
import Anthropic from '@anthropic-ai/sdk';
import { parse as parseYaml } from 'yaml';

// Investor dossier content (embedded for serverless deployment)
// In production, this could be fetched from a CMS or stored in KV
const INVESTOR_DOSSIERS = {
  'yoko-li': `---
name: "Yoko Li"
firm: "Andreessen Horowitz (a16z)"
role: "Partner"
team: "AI & Infrastructure"
email: "yli@a16z.com"

investment_focus:
  areas:
    - "Developer tools"
    - "Infrastructure"
    - "AI"
    - "Creative tools"
  stages:
    - "Pre-seed"
    - "Seed"
    - "Series A"
    - "Series B"
  check_size:
    min: "$500K"
    max: "$40M"

background:
  previous_roles:
    - company: "HashiCorp"
      role: "Product Lead"
      description: "Led product for Terraform Cloud (infrastructure-as-code platform)"
    - company: "Transposit"
      role: "Founding Engineer/Product Manager"
      description: "Workflow automation startup"
    - company: "AppDynamics"
      role: "Software Engineer"
      description: "Sold to Cisco for $3.7B"
  education:
    - institution: "Rice University"
      field: "Engineering"
  notable_traits:
    - "Still actively codes"
    - "Open source maintainer (AI-town, AI-tamago)"
    - "Technical cartoonist"

portfolio:
  board_seats:
    - name: "Resend"
      description: "Modern email API for developers"
  board_observer:
    - name: "Clerk"
      description: "Auth & user management platform"
    - name: "Mintlify"
      description: "AI-powered docs platform"
    - name: "Inngest"
      description: "AI workflow orchestration"
  other_investments:
    - name: "Stainless"
      description: "Auto-generates SDKs from API specs"
    - name: "Upstash"
      description: "Serverless Redis/Kafka"
    - name: "Nx (Nrwl)"
      description: "Monorepo build tools"
    - name: "Svix"
      description: "Webhooks-as-a-service"
    - name: "Arcjet"
      description: "Security/dev tools"

thesis:
  core_philosophy: "AI agents as the next computing platform - not AI as tooling, but AI as foundation for how software gets built"
  key_concepts:
    - name: "Agent Experience (AX)"
      description: "Products should be designed for AI agents to use, not just humans. APIs should be 'agent-friendly' from day one."
    - name: "Composable Service Primitives"
      description: "Agents need clean and composable service primitives to scaffold reliable applications. Each company provides a discrete building block."
    - name: "Vertical Integration as Moat"
      description: "As LLMs commoditize, owning the full stack creates defensibility. Don't build middleware - own the complete experience."
    - name: "AI-Native Architecture"
      description: "Companies rebuilt from ground up for AI, not legacy systems with AI added."
    - name: "Infrastructure Over Applications"
      description: "Developer tools that solve hard technical problems. Depth > breadth; primitives > features."
  patterns:
    - "Developer-first (developers are primary users)"
    - "Vertically integrated (own full experience, not plugins)"
    - "Replace fragmented systems (consolidate 5-10 legacy tools into one)"
    - "JavaScript/TypeScript ecosystem (modern web stack)"
    - "Composable together (portfolio companies work seamlessly)"
    - "Increasingly AI-native (designed for agent consumption)"
  anti_patterns:
    - "Consumer app disruption plays"
    - "TAM/market size focus over unit economics"
    - "Uber/Netflix comparisons (prefers Stripe/HashiCorp)"
    - "Vague 'AI handles everything' without explaining HOW"
    - "Dismissing incumbents as 'just too slow'"

engagement:
  do:
    - "Lead with technical architecture (she still codes)"
    - "Show working product/demos (builder credibility)"
    - "Frame as 'primitive' or 'infrastructure' not 'app'"
    - "Use 'agent-native' language (not 'AI-powered')"
    - "Reference her portfolio companies as analogies"
    - "Address 'why not incumbents?' immediately"
  dont:
    - "Pitch as consumer app disruption"
    - "Focus on TAM/market size over unit economics"
    - "Compare to Uber/Netflix (use Stripe/HashiCorp instead)"
    - "Say 'AI handles everything' without explaining HOW"
    - "Dismiss incumbents as 'just too slow'"
  questions_they_ask:
    - question: "Why not sell to enterprises instead of B2C?"
    - question: "What's defensible? Can't [Big Tech] + [Incumbent] do this?"
    - question: "How do you handle LLM non-determinism in production?"
    - question: "Walk me through cohort retention economics"
---`,

  'saurabh-gupta': `---
name: "Saurabh Gupta"
firm: "DST Global"
role: "Co-Founder & Managing Partner"
team: "Growth & Late Stage"
email: ""

investment_focus:
  areas:
    - "Consumer Internet"
    - "Enterprise Software"
    - "FinTech"
    - "AI/ML"
    - "Payments"
    - "Travel & Hospitality"
    - "E-commerce"
  stages:
    - "Series B"
    - "Series C"
    - "Series D"
    - "Growth"
  check_size:
    min: "$15M"
    max: "$200M"
    sweet_spot: "$25M"

background:
  previous_roles:
    - company: "JPMorgan"
      role: "Investment Banking Advisory"
      description: "IB advisory experience before transitioning to venture capital"
      source: "https://www.linkedin.com/in/saurabh-gupta-1a54b15/"
    - company: "Phonethics Mobile Media"
      role: "CEO & Founder"
      description: "Founded mobile media startup before co-founding DST Global"
      source: "https://www.crunchbase.com/person/saurabh-gupta"
  education:
    - institution: "Management Development Institute (MDI)"
      field: "MBA"
      source: "https://www.linkedin.com/in/saurabh-gupta-1a54b15/"
  notable_traits:
    - "Co-founded DST Global in 2009"
    - "Pioneer of founder-friendly investment terms (no board seats)"
    - "Deep expertise in emerging markets (India, LatAm)"
    - "Low-profile, relationship-driven investor"

portfolio:
  board_observer:
    - name: "Brex"
      description: "Corporate cards and spend management for startups"
      source: "https://signal.nfx.com/investors/saurabh-gupta_1"
    - name: "Swiggy"
      description: "India's leading food delivery platform"
      source: "https://signal.nfx.com/investors/saurabh-gupta_1"
    - name: "Udaan"
      description: "India's largest B2B e-commerce platform"
      source: "https://signal.nfx.com/investors/saurabh-gupta_1"
    - name: "Rappi"
      description: "Latin America's super app for delivery"
      source: "https://signal.nfx.com/investors/saurabh-gupta_1"
  led_investments:
    - name: "Airbnb"
      description: "Global accommodation marketplace"
      source: "https://www.crunchbase.com/person/saurabh-gupta"
  other_investments:
    - name: "Safe Superintelligence"
      description: "Ilya Sutskever's AI safety focused lab"
      source: "https://www.reuters.com/technology/artificial-intelligence/openai-co-founder-sutskevers-new-safety-focused-ai-startup-ssi-raises-1-billion-2024-09-04/"
    - name: "Mistral AI"
      description: "European AI foundation model company"
      source: "https://techcrunch.com/2024/06/11/paris-based-ai-startup-mistral-ai-raises-640-million/"
    - name: "Poolside"
      description: "AI for software development"
      source: "https://www.bloomberg.com/news/articles/2024-10-16/poolside-ai-raises-500-million-to-build-coding-assistant"
    - name: "Harvey"
      description: "AI for legal professionals"
      source: "https://www.harvey.ai/"
    - name: "Anysphere"
      description: "Cursor AI coding assistant"
      source: "https://techcrunch.com/2024/12/19/ai-coding-startup-anysphere-acquires-supermaven/"
    - name: "Chime"
      description: "Digital banking platform"
      source: "https://www.crunchbase.com/organization/chime-2/company_financials"
    - name: "Whatnot"
      description: "Live shopping and marketplace platform"
      source: "https://www.crunchbase.com/organization/whatnot/company_financials"
  historic_portfolio:
    - name: "Facebook"
      description: "Social networking - IPO 2012"
      source: "https://en.wikipedia.org/wiki/DST_Global"
    - name: "Twitter"
      description: "Social media platform"
      source: "https://en.wikipedia.org/wiki/DST_Global"
    - name: "WhatsApp"
      description: "Messaging - Acquired by Meta"
      source: "https://en.wikipedia.org/wiki/DST_Global"
    - name: "Spotify"
      description: "Music streaming - IPO 2018"
      source: "https://en.wikipedia.org/wiki/DST_Global"
    - name: "Alibaba"
      description: "E-commerce - IPO 2014"
      source: "https://en.wikipedia.org/wiki/DST_Global"
    - name: "Nubank"
      description: "Latin America's largest digital bank - IPO 2021"
      source: "https://en.wikipedia.org/wiki/DST_Global"
    - name: "Klarna"
      description: "Buy now, pay later"
      source: "https://en.wikipedia.org/wiki/DST_Global"

thesis:
  core_philosophy: "Invest in category-defining companies with founder-friendly terms, taking concentrated positions in late-stage growth companies that are already winning their markets"
  key_concepts:
    - name: "Founder-Friendly Terms"
      description: "No board seats, proxy votes assigned to founders. Pioneered by DST in Facebook/Twitter deals - belief that founders know best how to run their companies."
    - name: "Category Leaders"
      description: "Focus on companies that are already winning their markets, not early bets on unproven categories. Proven traction, clear market dominance, validated unit economics."
    - name: "Concentrated Positions"
      description: "Large checks ($15M-$200M) in fewer companies rather than spray-and-pray approach."
    - name: "Global Arbitrage"
      description: "Identifying winners in emerging markets (India, LatAm, China) that mirror successful US models."
  patterns:
    - "Category-defining market leaders"
    - "Strong network effects or marketplace dynamics"
    - "Proven unit economics at scale"
    - "Exceptional founder teams"
    - "Large addressable markets ($10B+)"
    - "Clear path to profitability or IPO"
  anti_patterns:
    - "Early-stage unproven concepts"
    - "Companies requiring heavy operational support"
    - "Situations requiring board control"
    - "Small check sizes or highly dilutive terms"

engagement:
  do:
    - "Come with proven traction and metrics (they invest in winners)"
    - "Emphasize market leadership position"
    - "Show clear path to massive scale ($1B+ revenue potential)"
    - "Highlight network effects or defensible moats"
    - "Be prepared for large check sizes ($25M+ sweet spot)"
    - "Demonstrate founder control and long-term vision"
    - "Reference successful DST portfolio companies as analogies"
  dont:
    - "Pitch early-stage unproven concepts"
    - "Expect hands-on operational involvement"
    - "Request board seats (they don't take them either)"
    - "Focus on small markets or niche opportunities"
    - "Underestimate their global portfolio knowledge"
  questions_they_ask:
    - question: "What's your market position vs. competitors?"
    - question: "What are your unit economics at scale?"
    - question: "What's the path to $1B+ in revenue?"
    - question: "Why raise from DST specifically?"
    - question: "How do you think about the AI opportunity?"
---`
};

function parseInvestorYaml(content) {
  // Extract YAML frontmatter
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    throw new Error('Invalid dossier format: missing YAML frontmatter');
  }
  return parseYaml(match[1]);
}

// Extract all portfolio company names from investor data
function getPortfolioCompanyNames(investor) {
  const companies = new Set();

  const addCompanies = (list) => {
    if (Array.isArray(list)) {
      list.forEach(item => {
        if (item.name) companies.add(item.name.toLowerCase());
      });
    }
  };

  addCompanies(investor.portfolio?.board_seats);
  addCompanies(investor.portfolio?.board_observer);
  addCompanies(investor.portfolio?.led_investments);
  addCompanies(investor.portfolio?.other_investments);
  addCompanies(investor.portfolio?.historic_portfolio);

  return companies;
}

// Verify portfolio analogies against known portfolio
function verifyPortfolioAnalogies(analysis, investor) {
  const knownCompanies = getPortfolioCompanyNames(investor);
  const analogies = analysis.pitchRecommendations?.portfolioAnalogies || [];
  const verificationResults = [];

  for (const analogy of analogies) {
    const companyName = analogy.company?.toLowerCase() || '';
    // Check if company name matches any known portfolio company
    let verified = false;
    for (const known of knownCompanies) {
      if (companyName.includes(known) || known.includes(companyName)) {
        verified = true;
        break;
      }
    }
    verificationResults.push({
      company: analogy.company,
      verified,
      source: verified ? 'investor_portfolio' : null
    });
  }

  return verificationResults;
}

// Basic claim verification for the analysis
function performBasicVerification(analysis, investor) {
  const portfolioVerification = verifyPortfolioAnalogies(analysis, investor);
  const unverifiedAnalogies = portfolioVerification.filter(v => !v.verified);

  return {
    portfolioAnalogiesVerified: portfolioVerification,
    hasUnverifiedClaims: unverifiedAnalogies.length > 0,
    unverifiedCount: unverifiedAnalogies.length,
    verificationStatus: unverifiedAnalogies.length === 0 ? 'PASSED' :
                        unverifiedAnalogies.length <= 1 ? 'WARNING' : 'FLAGGED'
  };
}

function buildPrompt(investor, companyBriefing, companyName) {
  const portfolioCompanies = [
    ...(investor.portfolio?.board_seats || []),
    ...(investor.portfolio?.board_observer || []),
    ...(investor.portfolio?.other_investments || [])
  ].map(c => `- ${c.name}: ${c.description}`).join('\n');

  const doList = (investor.engagement?.do || []).map(d => `- ${d}`).join('\n');
  const dontList = (investor.engagement?.dont || []).map(d => `- ${d}`).join('\n');
  const questionsTheyAsk = (investor.engagement?.questions_they_ask || [])
    .map(q => `- "${q.question}"`).join('\n');

  const keyConcepts = (investor.thesis?.key_concepts || [])
    .map(c => `- ${c.name}: ${c.description}`).join('\n');

  const patterns = (investor.thesis?.patterns || []).map(p => `- ${p}`).join('\n');
  const antiPatterns = (investor.thesis?.anti_patterns || []).map(p => `- ${p}`).join('\n');

  return `You are an expert investment analyst helping a startup prepare for an investor meeting.

## INVESTOR PROFILE

**Name:** ${investor.name}
**Firm:** ${investor.firm}
**Role:** ${investor.role}${investor.team ? ` (${investor.team})` : ''}

### Investment Focus
- **Areas:** ${investor.investment_focus?.areas?.join(', ') || 'N/A'}
- **Stages:** ${investor.investment_focus?.stages?.join(', ') || 'N/A'}
- **Check Size:** ${investor.investment_focus?.check_size?.min || 'N/A'} - ${investor.investment_focus?.check_size?.max || 'N/A'}

### Background
${investor.background?.previous_roles?.map(r => `- ${r.company} (${r.role}): ${r.description}`).join('\n') || 'N/A'}

### Investment Thesis
**Core Philosophy:** ${investor.thesis?.core_philosophy || 'N/A'}

**Key Concepts:**
${keyConcepts || 'N/A'}

**Patterns They Look For:**
${patterns || 'N/A'}

**Anti-Patterns (What They Avoid):**
${antiPatterns || 'N/A'}

### Portfolio Companies
${portfolioCompanies || 'N/A'}

### Engagement Guidance
**DO:**
${doList || 'N/A'}

**DON'T:**
${dontList || 'N/A'}

**Questions They Typically Ask:**
${questionsTheyAsk || 'N/A'}

---

## COMPANY BRIEFING: ${companyName}

${companyBriefing}

---

## YOUR TASK

Analyze how ${companyName} should position themselves for a meeting with ${investor.name}. Provide a comprehensive positioning analysis.

## CRITICAL CONSTRAINTS - YOU MUST FOLLOW THESE:

1. **NEVER fabricate investment relationships.** Only reference companies explicitly listed in the Portfolio Companies section above. Do NOT claim the investor backed companies not in the list.

2. **NEVER claim the investor backed the user's company** unless explicitly stated in the company briefing that this investor has already invested.

3. **For "Opening Hook" and all recommendations** - use ONLY verifiable facts from the provided investor data above. Do not invent quotes, specific dollar amounts, or investment details not provided.

4. **For "Portfolio Analogies"** - ONLY use companies from the Portfolio Companies list above. Do not reference companies the investor did not invest in.

5. **Do NOT invent specific investment amounts, valuations, or exit values** unless they are explicitly provided in the investor data above.

6. **When uncertain about a fact**, phrase it as a question or suggestion rather than a definitive statement.

Return your analysis as a JSON object with this exact structure:

{
  "executiveSummary": "2-3 sentence overview of the positioning opportunity",
  "alignmentScore": <number 0-100>,
  "alignmentRationale": "Brief explanation of the score",
  "keyAlignments": [
    {
      "area": "Area of alignment (e.g., 'AI-Native Architecture')",
      "explanation": "How the company aligns with this investor priority",
      "evidence": "Specific evidence from the briefing"
    }
  ],
  "potentialConcerns": [
    {
      "concern": "What might concern the investor",
      "mitigation": "How to address this in the pitch",
      "talkingPoint": "Specific language to use"
    }
  ],
  "pitchRecommendations": {
    "oneLiner": "A compelling one-liner pitch tailored to this investor's thesis",
    "keyMessages": [
      "Key message 1 to emphasize",
      "Key message 2 to emphasize",
      "Key message 3 to emphasize"
    ],
    "portfolioAnalogies": [
      {
        "company": "Portfolio company name",
        "analogy": "How to draw the comparison"
      }
    ],
    "openingHook": "Suggested opening statement for the meeting"
  },
  "languageGuidance": {
    "termsToUse": ["term1", "term2", "term3"],
    "termsToAvoid": ["term1", "term2", "term3"],
    "framingTips": [
      "Specific framing tip 1",
      "Specific framing tip 2"
    ]
  },
  "anticipatedQuestions": [
    {
      "question": "Question the investor might ask",
      "suggestedResponse": "How to respond",
      "keyPoints": ["point1", "point2"]
    }
  ],
  "nextSteps": [
    "Recommended preparation step 1",
    "Recommended preparation step 2",
    "Recommended preparation step 3"
  ]
}

Ensure your analysis is specific to both the investor's known preferences and the company's actual capabilities/positioning from the briefing. Be practical and actionable.`;
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
    const { briefingId, investorSlug } = req.body;

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

    // Get investor dossier
    const slug = briefing.investorSlug;
    const dossierContent = INVESTOR_DOSSIERS[slug];
    if (!dossierContent) {
      return res.status(404).json({
        error: `Investor dossier not found for: ${slug}`
      });
    }

    const investor = parseInvestorYaml(dossierContent);

    // Build the prompt
    const prompt = buildPrompt(investor, briefing.extractedText, briefing.companyName);

    // Call Claude API
    const anthropic = new Anthropic();

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Extract the response text
    const responseText = message.content[0].text;

    // Parse JSON from response
    let analysis;
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
      return res.status(500).json({
        error: 'Failed to parse analysis response',
        rawResponse: responseText
      });
    }

    // Perform basic verification of the generated analysis
    const verification = performBasicVerification(analysis, investor);

    // Store the analysis in KV with verification metadata
    const updatedBriefing = {
      ...briefing,
      positioningAnalysis: analysis,
      verification,
      analyzedAt: new Date().toISOString()
    };

    await kv.set(actualBriefingId, updatedBriefing);

    return res.status(200).json({
      success: true,
      briefingId: actualBriefingId,
      companyName: briefing.companyName,
      investorName: investor.name,
      analysis,
      verification
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({
      error: 'Failed to analyze positioning',
      details: error.message
    });
  }
}
