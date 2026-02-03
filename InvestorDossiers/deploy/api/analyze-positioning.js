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
    - company: "Phonethics Mobile Media"
      role: "CEO & Founder"
      description: "Founded mobile media startup before co-founding DST Global"
  education:
    - institution: "Management Development Institute (MDI)"
      field: "MBA"
  notable_traits:
    - "Co-founded one of the world's largest VC firms ($50B AUM)"
    - "Pioneer of founder-friendly investment terms"
    - "Deep expertise in emerging markets (India, LatAm)"
    - "Low-profile, relationship-driven investor"

portfolio:
  board_observer:
    - name: "Brex"
      description: "Corporate cards and spend management for startups"
    - name: "Swiggy"
      description: "India's leading food delivery platform"
    - name: "Udaan"
      description: "India's largest B2B e-commerce platform"
    - name: "Rappi"
      description: "Latin America's super app for delivery"
  led_investments:
    - name: "Airbnb"
      description: "Global accommodation marketplace"
  other_investments:
    - name: "Safe Superintelligence"
      description: "Ilya Sutskever's AI safety focused lab - $1B at $5B valuation"
    - name: "Mistral AI"
      description: "European AI foundation model company - $600M at $5.8B"
    - name: "Poolside"
      description: "AI for software development - $500M at $3B"
    - name: "Harvey"
      description: "AI for legal professionals - 1000+ customers globally"
    - name: "Anysphere"
      description: "Cursor AI coding assistant - $900M round"
    - name: "Chime"
      description: "Digital banking platform"
    - name: "Whatnot"
      description: "Live shopping and marketplace platform"
  historic_portfolio:
    - name: "Facebook"
      description: "Social networking - IPO 2012"
    - name: "Twitter"
      description: "Social media - $400M at $8B (2011)"
    - name: "WhatsApp"
      description: "Messaging - Acquired by Meta for $19B"
    - name: "Spotify"
      description: "Music streaming - IPO 2018"
    - name: "Alibaba"
      description: "E-commerce - IPO 2014"
    - name: "Nubank"
      description: "Latin America's largest digital bank - IPO 2021"
    - name: "Klarna"
      description: "Buy now, pay later - NYSE listed"

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

    // Store the analysis in KV
    const updatedBriefing = {
      ...briefing,
      positioningAnalysis: analysis,
      analyzedAt: new Date().toISOString()
    };

    await kv.set(actualBriefingId, updatedBriefing);

    return res.status(200).json({
      success: true,
      briefingId: actualBriefingId,
      companyName: briefing.companyName,
      investorName: investor.name,
      analysis
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({
      error: 'Failed to analyze positioning',
      details: error.message
    });
  }
}
