# Investor Engagement System

## Project Overview

A system for creating investor dossiers that help founders prepare for investor meetings. The flagship feature is the Yoko Li investor dossier, deployed at https://investor-dossiers.vercel.app/

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
    └── deploy/                  # Vercel deployment
        ├── index.html           # Production HTML (Yoko Li dossier)
        ├── saurabh-gupta.html   # Additional dossier
        ├── vercel.json          # Vercel configuration
        ├── package.json         # Dependencies
        └── api/                 # Serverless API functions
            ├── upload-briefing.js
            ├── analyze-positioning.js
            ├── get-positioning.js
            └── delete-briefing.js
```

## Deployment

- **URL**: https://investor-dossiers.vercel.app/
- **Platform**: Vercel (serverless)
- **Storage**: Vercel Blob (files) + Vercel KV (metadata)

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
- **PDF Generation**: html2pdf.js
- **Backend**: Vercel Serverless Functions
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Storage**: Vercel Blob (files), Vercel KV (metadata)
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

---

## Dossier Data Structure (YAML Frontmatter)

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

## Future Enhancements (Not Yet Implemented)

- [ ] Multiple investor dossier navigation
- [ ] User authentication for saved analyses
- [ ] Comparative analysis across multiple investors
- [ ] Dossier search functionality
- [ ] Export to other formats (Word, Slides)
- [ ] Collaboration features (share analyses)
- [ ] CRM integration
- [ ] Calendar integration for meeting prep
