# Investor Engagement System

## Project Overview

A system for creating investor dossiers that help founders prepare for investor meetings. The flagship feature is the Yoko Li investor dossier, deployed at https://investor-dossiers.vercel.app/

**New**: The system now includes an AI-powered dossier generator that can create comprehensive investor profiles for any investor by researching publicly available information.

## Project Structure

```
investorengagementsystem/
├── CLAUDE.md                    # This file - project documentation
└── InvestorDossiers/
    ├── README.md                # Dossier creation guide
    ├── index.html               # Local development version
    ├── originals/               # Source PDFs and research documents
    │   └── Yoko Li Investor Briefing.pdf
    ├── dossiers/                # Investor profile files
    │   ├── yoko-li.md           # Yoko Li dossier (Markdown + YAML)
    │   ├── yoko-li.html         # Generated HTML version
    │   ├── saurabh-gupta.md     # Saurabh Gupta dossier
    │   └── saurabh-gupta.html   # Generated HTML version
    ├── templates/
    │   └── investor-template.md # Template for new dossiers
    ├── reference/               # Reference materials and design models
    │   ├── README.md            # Documentation for reference files
    │   └── yoko-li-reference-dossier.html  # Gold standard dossier model
    └── deploy/                  # Vercel deployment
        ├── index.html           # Production HTML (Yoko Li dossier)
        ├── saurabh-gupta.html   # Saurabh Gupta dossier
        ├── generate.html        # NEW: Dossier generator form page
        ├── dossier.html         # NEW: Dynamic dossier viewer
        ├── vercel.json          # Vercel configuration
        ├── package.json         # Dependencies
        └── api/                 # Serverless API functions
            ├── upload-briefing.js
            ├── analyze-positioning.js
            ├── get-positioning.js
            ├── delete-briefing.js
            ├── regenerate-profile.js    # AI profile regeneration
            ├── get-profile.js           # Retrieve stored profiles
            ├── verify-claims.js         # Claim verification
            ├── generate-dossier.js      # NEW: Generate new dossiers
            └── list-dossiers.js         # NEW: List all generated dossiers
```

## Design Reference: Yoko Li Dossier

The **Yoko Li dossier** (`reference/yoko-li-reference-dossier.html`) is the gold standard design model for all investor dossiers in this system.

### Why It Matters

This hand-crafted dossier represents the ideal structure, organization, and level of detail that AI-generated dossiers should strive to match. It was created through careful research and iteration, establishing the patterns that make investor briefings truly useful for founders.

### Reference Location

```
InvestorDossiers/reference/yoko-li-reference-dossier.html
```

### Key Design Patterns Established

1. **Profile Header**: Avatar, name, role, firm + contact links + investment metadata cards (focus areas, stages, check sizes)

2. **Background Section**: Career highlights as bullet points, education, unique differentiators that set them apart

3. **Investment Thesis**: Core philosophy quote, numbered key concepts with explanations, patterns they look for

4. **Portfolio Pattern Recognition**: Table of what investments share, company reference table with "Replaces" column

5. **Recent Activity**: Podcasts and articles with dates, topics, and links

6. **Positioning Framework**: How to frame your company, one-liner template, portfolio analogies to reference

7. **Anticipated Q&A**: Questions with "why they ask" context and suggested counter-arguments

8. **Meeting Prep Checklist**: Organized by category (Technical, Economics, Roadmap, The Ask)

9. **Interactive Company Positioning Analysis**: Upload feature for personalized recommendations

10. **Source Citations**: Links to verifiable sources throughout

### When to Reference

- When improving AI generation prompts in `generate-dossier.js`
- When evaluating quality of generated dossiers
- When adding new features or sections
- When training team members on dossier standards

---

## Deployment

- **URL**: https://investor-dossiers.vercel.app/
- **Platform**: Vercel (serverless)
- **Storage**: Vercel Blob (files) + Vercel KV (metadata & profiles)

---

## New Feature: AI Dossier Generator

### Overview

The dossier generator allows users to create comprehensive investor profiles for any investor by entering their first name, last name, and company. Claude AI researches publicly available information and compiles a dossier matching the quality and structure of the hand-crafted Yoko Li dossier.

**Access**: https://investor-dossiers.vercel.app/generate.html

### Generator Page Features (`generate.html`)

**Form Interface:**
- First name, last name, company input fields
- "Generate Dossier" button
- Loading state with rotating status messages
- Estimated time warning (1-2 minutes)

**Results Display:**
- Verification banner showing source coverage
- Source statistics (unique sources, coverage %, trusted sources, total claims)
- Dossier preview with key sections
- "View Full Dossier" link to dynamic viewer
- "Generate Another" button

**Previously Generated Dossiers:**
- Lists all previously generated dossiers
- Shows name, company, generation date, source coverage
- Click to view full dossier

### Dynamic Dossier Viewer (`dossier.html`)

A dynamic page that renders any AI-generated dossier:

**URL Format**: `/dossier.html?investor=investor-slug`

**Features:**
- Fetches stored dossier from `/api/get-profile`
- Renders all sections matching Yoko Li quality
- Verification banner with source coverage stats
- PDF export via browser print
- "Generate New" navigation button

**Rendered Sections:**
1. Profile header with avatar, name, role, contact links
2. Investment focus meta cards (Focus Areas, Stages, Check Size)
3. Background with career highlights, education, unique traits
4. Investment thesis with core philosophy, key concepts, patterns
5. Portfolio pattern recognition and notable investments
6. Recent activity (podcasts, articles, speaking)
7. Positioning framework with one-liner template and analogies
8. Anticipated Q&A with suggested responses
9. Meeting prep checklist
10. Engagement tips (Do/Don't lists)
11. **Interactive Company Positioning Analysis** (same as static pages)
12. Sources section with all citations

### Generated Dossier Data Structure

```json
{
  "profile": {
    "name": "Investor Name",
    "firm": "Firm Name",
    "role": "Partner",
    "team": "AI & Infrastructure"
  },
  "contactLinks": {
    "email": "email@firm.com",
    "linkedin": "https://linkedin.com/in/...",
    "twitter": "https://x.com/...",
    "github": "https://github.com/...",
    "website": "https://..."
  },
  "investmentFocus": {
    "areas": ["Dev Tools", "AI", "Infrastructure"],
    "stages": ["Seed", "Series A", "Series B"],
    "checkSize": { "min": "$500K", "max": "$15M" }
  },
  "background": {
    "summary": "Overview...",
    "careerHighlights": [...],
    "education": [...],
    "uniqueTraits": [...]
  },
  "investmentThesis": {
    "corePhilosophy": "Quoted philosophy...",
    "keyConcepts": [...],
    "patterns": [...],
    "antiPatterns": [...]
  },
  "portfolio": {
    "investmentPatterns": [...],
    "notableInvestments": [...],
    "recentInvestments": [...],
    "historicExits": [...]
  },
  "recentActivity": {
    "currentFocus": "...",
    "podcasts": [...],
    "articles": [...],
    "speaking": [...]
  },
  "positioning": {
    "framework": "How to position...",
    "oneLinerTemplate": "Template...",
    "languageToUse": [...],
    "languageToAvoid": [...],
    "portfolioAnalogies": [...]
  },
  "anticipatedQA": [
    {
      "question": "...",
      "whyTheyAsk": "...",
      "suggestedApproach": "...",
      "exampleResponse": "..."
    }
  ],
  "meetingPrep": {
    "technicalDepth": "high/medium/low",
    "keyTopicsToAddress": [...],
    "thingsToHaveReady": [...],
    "redFlags": [...]
  },
  "engagement": {
    "doList": [...],
    "dontList": [...]
  },
  "allSources": [...]
}
```

---

## Profile Regeneration Feature

Both static dossier pages (Yoko Li, Saurabh Gupta) include a "Regenerate Profile" button that uses Claude AI to refresh the investor profile with current information and source citations.

### Features

- **Source Citations**: Every factual claim includes a source URL
- **Trusted Domain Validation**: Sources are validated against a whitelist of trusted domains (LinkedIn, Crunchbase, TechCrunch, Bloomberg, Forbes, etc.)
- **Portfolio Verification**: Portfolio company claims are verified against known portfolio lists
- **Source Coverage Stats**: Shows percentage of claims with sources

### Verification Banners

- **Passed** (green): >50% source coverage, no high-severity warnings
- **Warning** (yellow): Low source coverage or missing sources
- **Flagged** (red): Unverified portfolio companies or high-severity issues

---

## Completed Features - Yoko Li Dossier

### 1. Profile Section
- **Avatar**: Circular profile image with photo from a16z
- **Name & Title**: "Yoko Li, Partner · AI & Infrastructure · Andreessen Horowitz (a16z)"
- **Contact Links**: Clickable badges for Email, LinkedIn, Twitter/X, GitHub, Portfolio
- **Meta Cards**: Three centered statistics showing:
  - Investment Focus: Dev Tools · Infra · AI
  - Stage: Pre-seed → Series B
  - Check Size: $500K – $40M

### 2. Background Section
- Career highlights at HashiCorp (Terraform Cloud product lead), Transposit, AppDynamics
- Rice University engineering background
- "What Makes Her Unique" subsection highlighting open-source AI projects (AI-town, AI-tamago) and technical cartooning
- All company names linked to their websites

### 3. Investment Thesis & Key Ideas
- Core philosophy: "AI agents as next computing platform"
- Five key concepts she champions:
  1. Agent Experience (AX) not just Developer Experience (DX)
  2. Composable Service Primitives
  3. Vertical Integration as Moat
  4. AI-Native Architecture (Not Bolt-On)
  5. Infrastructure Over Applications
- Links to relevant articles and podcasts for each concept
- MCP (Model Context Protocol) deep dive references

### 4. Portfolio Pattern Recognition
- Pattern summary table (developer-first, vertically integrated, etc.)
- Portfolio companies quick reference table:
  - Clerk, Resend, Mintlify, Inngest, Stainless, Svix, Upstash, Nx, Arcjet
  - Each with: What it does, What it replaces, Documentation link
- Notable portfolio synergies (e.g., "Clerk uses Svix")

### 5. Recent Activity
- Podcasts table with dates and key topics (Dec 2024 - Mar 2025)
- Articles table with dates and key themes
- Current focus indicator

### 6. Positioning Framework
- One-liner template for pitching
- Reasoning for why the framework aligns with her investment philosophy
- Portfolio analogies organized by topic:
  - Vertical integration (Resend example)
  - Developer experience (HashiCorp/Terraform example)
  - AI-native design (Mintlify example)
  - Production reliability (Inngest example)

### 7. Anticipated Questions & Counters
- Q1: "Why not sell to enterprises instead of B2C?"
- Q2: "What's defensible? Can't [Big Tech + Incumbent] do this?"
- Q3: "How do you handle LLM non-determinism in production?"
- Q4: "Walk me through cohort retention economics"
- Each with detailed counter-arguments

### 8. Meeting Prep Checklist
- Technical deep-dive components (architecture, LLM fallbacks, data privacy)
- Unit economics data requirements (cohort analysis, CAC, ARPU, LTV)
- Product roadmap elements
- Funding ask specifics

### 9. Contact & Links Section
- Consolidated contact information table
- Email, a16z Portfolio, LinkedIn, GitHub, Twitter/X

### 10. Company Positioning Analysis Tool (Interactive)
**Upload Interface:**
- Drag-and-drop zone for company briefings
- File type validation (PDF/DOCX only)
- File size validation (max 10MB)
- Company name input field
- Remove file button

**Processing States:**
- Upload state (drag-drop zone + form)
- Analyzing state (spinner + status text)
- Results state (full analysis display)
- Error state (error message + retry button)

**Analysis Results Display:**
- **Alignment Score**: Color-coded circle (0-100) with rationale
- **Executive Summary**: AI-generated overview
- **Recommended One-Liner**: Tailored elevator pitch
- **Opening Hook**: Suggested conversation starter
- **Key Messages**: Bullet-pointed recommendations
- **Key Alignments**: Cards showing investor fit areas with evidence
- **Portfolio Analogies**: Relevant comparison suggestions
- **Potential Concerns**: Cards with mitigations and talking points
- **Language Guidance**:
  - Terms to Use (green tags)
  - Terms to Avoid (red tags)
  - Framing tips list
- **Anticipated Questions**: Cards with suggested responses and key points
- **Recommended Next Steps**: Checklist of follow-up actions

**Actions:**
- Regenerate button (re-run analysis)
- Replace Briefing button (upload new file)

### 11. PDF Export
- Download PDF button in toolbar
- html2pdf.js integration for client-side PDF generation
- Special rendering rules for PDF output:
  - Hide upload/analyzing states
  - Preserve positioning results
  - Page break handling for cards and sections
  - Color-adjusted print styles
- Fallback to browser print if PDF generation fails

### 12. Responsive Design
- Mobile breakpoints (640px)
- Flex-direction changes for profile header
- Table horizontal scrolling
- Reduced padding on mobile
- Centered profile on small screens

### 13. Print Styles
- Hide toolbar
- Remove box shadows
- Page break avoidance for critical elements

---

## API Endpoints

### POST /api/generate-dossier (NEW)
- Accepts JSON body: `{ firstName, lastName, company }`
- Generates investor slug from name
- Calls Claude API with comprehensive research prompt
- Verifies source coverage and quality
- Stores dossier in Vercel KV (`investor-profile:{slug}`)
- Updates generated dossiers list
- Returns: `{ success, investorSlug, profile, verification, viewUrl }`

### GET /api/list-dossiers (NEW)
- Returns list of all generated dossiers
- Sorted by generation date (most recent first)
- Returns: `{ success, dossiers: [{ slug, name, company, generatedAt, sourceCoverage }] }`

### POST /api/regenerate-profile
- Accepts JSON body: `{ investorSlug }`
- Regenerates profile for known investors (yoko-li, saurabh-gupta)
- Includes source citations for all claims
- Verifies portfolio companies against known list
- Stores in Vercel KV
- Returns: `{ success, profile, verification, generatedAt }`

### GET /api/get-profile
- Query param: `investorSlug`
- Returns stored profile if exists
- Returns: `{ success, hasStoredProfile, profile, verification, generatedAt }`

### POST /api/verify-claims
- Verifies claims in positioning analysis
- Checks portfolio company mentions against known data
- Returns verification status and warnings

### POST /api/upload-briefing
- Accepts multipart/form-data with PDF/DOCX file
- Parses document text using pdf-parse and mammoth
- Stores file in Vercel Blob
- Stores metadata in Vercel KV
- Returns briefingId

### POST /api/analyze-positioning
- Takes briefingId and investorSlug
- Retrieves briefing text and investor dossier
- Calls Claude API (claude-sonnet-4-20250514) with comprehensive prompt
- Parses JSON response
- Stores analysis in KV
- Returns full positioning analysis

### GET /api/get-positioning
- Query by investorSlug or briefingId
- Returns existing briefing and analysis if available

### DELETE /api/delete-briefing
- Deletes briefing from KV storage

---

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Styling**: CSS custom properties (design tokens)
- **PDF Generation**: html2pdf.js (static pages), browser print (dynamic pages)
- **Backend**: Vercel Serverless Functions
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Storage**: Vercel Blob (files), Vercel KV (metadata & profiles)
- **Document Parsing**: pdf-parse, mammoth

---

## Design System

### Colors
```css
--primary: #2563eb;
--primary-dark: #1d4ed8;
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-600: #4b5563;
--gray-800: #1f2937;
--gray-900: #111827;
```

### Typography
- Font: System font stack (-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto)
- Line height: 1.6

### Components
- Cards with 12-16px border radius
- Buttons with hover states
- Tables with hover row highlighting
- Blockquotes with left border accent
- Tag/badge components
- Checklist with checkbox styling
- Verification banners (passed/warning/flagged states)
- Source citation links (superscript links to sources)

---

## Dossier Data Structure (YAML Frontmatter - Static Dossiers)

```yaml
name: "Investor Name"
firm: "Firm Name"
role: "Partner"
team: "AI & Infrastructure"
email: "email@firm.com"

investment_focus:
  areas: [...]
  stages: [...]
  check_size:
    min: "$500K"
    max: "$40M"

background:
  previous_roles: [...]
  education: [...]
  notable_traits: [...]

portfolio:
  board_seats: [...]
  board_observer: [...]
  other_investments: [...]

thesis:
  core_philosophy: "..."
  key_concepts: [...]
  patterns: [...]
  anti_patterns: [...]

engagement:
  do: [...]
  dont: [...]
  questions_they_ask: [...]
```

---

## Saurabh Gupta Dossier Features

The Saurabh Gupta dossier (https://investor-dossiers.vercel.app/saurabh-gupta.html) includes all the same features as the Yoko Li dossier:

### Profile & Content
- Profile header with initials avatar (SG), LinkedIn, DST Global, Crunchbase, Signal links
- Investment focus: Consumer · Enterprise · AI / Series B → Growth / $15M – $200M
- Background: DST Global co-founder, JPMorgan IB, Phonethics founder, MDI MBA
- Investment thesis: Founder-friendly terms, category leaders, global arbitrage, concentrated positions
- Portfolio: Board observer at Brex, Swiggy, Udaan, Rappi; led Airbnb investment
- Recent AI investments: Safe Superintelligence, Mistral AI, Poolside, Harvey, Anysphere
- Classic DST portfolio: Facebook, Twitter, WhatsApp, Spotify, Alibaba, Nubank, Klarna
- Positioning framework, portfolio analogies, anticipated Q&A, meeting prep checklist

### Interactive Features
- **Company Positioning Analysis Tool** - Same as Yoko Li's (upload briefings, AI-powered analysis)
- **PDF Export** - Downloads as "Saurabh-Gupta-Investor-Dossier.pdf"
- **Regenerate Profile** - AI-powered profile refresh with source citations
- **Responsive Design** - Mobile-optimized

---

## Future Enhancements (Not Yet Implemented)

- [ ] User authentication for saved analyses
- [ ] Comparative analysis across multiple investors
- [ ] Dossier search functionality
- [ ] Export to other formats (Word, Slides)
- [ ] Collaboration features (share analyses)
- [ ] CRM integration
- [ ] Calendar integration for meeting prep
- [ ] Scheduled profile refresh (auto-regenerate with new sources)
- [ ] Email notifications for profile updates

---

## Changelog

### 2026-02-04: AI Dossier Generator
- Added `/generate.html` - Form page to create new investor dossiers
- Added `/dossier.html` - Dynamic viewer for generated dossiers
- Added `/api/generate-dossier.js` - Claude-powered dossier generation with comprehensive research prompt
- Added `/api/list-dossiers.js` - List all generated dossiers
- Added "Generate New" navigation button to static dossier pages
- Generated dossiers match Yoko Li quality with all sections: background, thesis, portfolio, positioning, Q&A, meeting prep, engagement tips
- Interactive Company Positioning Analysis included in dynamic viewer

### 2026-02-03: Profile Regeneration & Source Citations
- Added profile regeneration feature with source citations
- Added source verification against trusted domains
- Added portfolio company verification
- Added verification banners showing source coverage
- Added `/api/regenerate-profile.js`, `/api/get-profile.js`, `/api/verify-claims.js`

### Previous: Core Features
- Yoko Li dossier with full content and positioning analysis tool
- Saurabh Gupta dossier with same features
- PDF export functionality
- Responsive design and print styles
