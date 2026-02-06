# Investor Engagement System - Progress

**URL**: https://investor-dossiers.vercel.app/
**Platform**: Vercel Pro (Node.js serverless)
**Storage**: Vercel KV + Blob
**AI**: Anthropic Claude (claude-sonnet-4-20250514)

---

## Current State (2026-02-06)

- 2 hand-crafted dossiers (Yoko Li, Saurabh Gupta) with full interactive features
- AI dossier generator that creates comprehensive investor profiles for any investor
- Multi-tenant platform with admin portal and client portal
- Google Sign-In authentication for both admin and clients
- Multi-email support per client (e.g., Gather has 2 login emails)
- 23+ serverless API functions (requires Vercel Pro plan)
- 1 active client: **Gather** (3 authorized dossiers, 2 login emails)

### Active Clients

| Client | Emails | Authorized Dossiers |
|--------|--------|---------------------|
| Gather | abhishek@rockstar-automations.com, abhishek@gatherat.ai | yoko-li, saurabh-gupta, marc-andreesen |

### Environment Variables (Production)

| Variable | Purpose |
|----------|---------|
| `ADMIN_EMAIL` | Admin Google Sign-In (vincent@01.co) |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `ADMIN_PASSWORD` | Legacy fallback auth |
| `ANTHROPIC_API_KEY` | Claude API |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Vercel KV |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob |

---

## Build Timeline

### Phase 1: Core Dossiers (2026-02-03)

**Commits**: `8938bd6` → `7062c24`

- Built Yoko Li investor dossier as the flagship product
  - Profile header, background, investment thesis, portfolio analysis
  - Positioning framework, anticipated Q&A, meeting prep checklist
  - Interactive company positioning analysis tool (upload briefing PDF/DOCX, get AI-powered analysis)
  - PDF export via html2pdf.js
  - Responsive/mobile design
- Added hallucination prevention and source verification for AI-generated content
- Added profile regeneration with source citations and trusted domain validation
- Built Saurabh Gupta dossier with identical feature set

### Phase 2: AI Dossier Generator (2026-02-04)

**Commits**: `3c07e5d` → `04d47d1`

- Created `/generate.html` - form interface to generate dossiers for any investor
- Created `/dossier.html` - dynamic viewer that renders AI-generated dossiers from KV
- Built `/api/generate-dossier.js` - Claude-powered research and generation (up to 5 min)
- Built `/api/list-dossiers.js` - lists all generated dossiers
- Saved Yoko Li dossier as gold standard reference model (`reference/yoko-li-reference-dossier.html`)
- Increased API timeout to 300s for comprehensive generation
- Added support for positioning analysis on dynamically generated dossiers

### Phase 3: Multi-Tenant Platform (2026-02-04)

**Commits**: `5ddac03` → `36c49b4`

- **Admin Portal** (`/admin/`):
  - Login page, dashboard with stats, client management CRUD, all dossiers view
  - Password-based authentication with 24-hour sessions
- **Client Portal** (`/portal?t={token}`):
  - Token-based access to authorized dossiers only
  - Client-scoped briefing storage (isolated per client)
  - Client-side dossier generation with auto-assignment
- **New API endpoints**: 6 auth endpoints, 6 admin/client endpoints, 2 client operation endpoints
- **Data model**: KV-based with `client:{id}`, `client-by-token:{token}`, `client-list` keys
- Shared generation logic extracted to `lib/generate-dossier-core.js`
- Upgraded to Vercel Pro plan (21 functions exceeded Hobby limit of 12)
- Fixed static dossiers in client portal (link directly to HTML pages, not KV viewer)

### Phase 4: Google Sign-In Authentication (2026-02-06)

**Commits**: `91e2e50` → `e5be288`

- **Client auth**: Replaced token input on home page with Google Sign-In
  - Home page (`/`) is now a sign-in landing page
  - Yoko Li dossier moved to `/yoko-li.html`
  - Email lookup via `client-by-email:{email}` KV keys
  - Token verification via `oauth2.googleapis.com/tokeninfo`
- **Admin auth**: Replaced password form with Google Sign-In
  - `ADMIN_EMAIL` env var controls admin access
  - Landing page detects admin vs client after sign-in
  - Password login kept as emergency fallback
- **New endpoints**: `/api/auth/google-client-id`, `/api/auth/google-signin`

### Phase 5: Multi-Email Support (2026-02-06)

**Not yet committed**

- Changed client data model from `email` (string) to `emails` (array)
- Updated all 6 admin client API endpoints (create, update, delete, get, list, regenerate-token)
- Updated admin clients UI with dynamic add/remove email fields
- Backward compatible: old single-email clients auto-converted on read
- Configured Gather client with 2 login emails

---

## Architecture

### URL Routing

| URL | Page | Auth |
|-----|------|------|
| `/` | Sign-in landing page | None (Google Sign-In) |
| `/admin/` | Admin login | Google Sign-In (ADMIN_EMAIL) |
| `/admin/dashboard.html` | Admin dashboard | Admin session |
| `/admin/clients.html` | Client management | Admin session |
| `/admin/dossiers.html` | All dossiers | Admin session |
| `/portal?t={token}` | Client portal | Token in URL |
| `/yoko-li.html` | Yoko Li dossier | None |
| `/saurabh-gupta.html` | Saurabh Gupta dossier | None |
| `/generate.html` | AI dossier generator | None |
| `/dossier.html?investor={slug}` | Dynamic dossier viewer | None |
| `/portal-dossier.html?t={token}&investor={slug}` | Client dossier viewer | Token |

### KV Data Model

```
client:{clientId}                              → { id, name, emails[], token, authorizedDossiers[], isActive, ... }
client-by-token:{token}                        → clientId
client-by-email:{email}                        → clientId (one key per email)
client-list                                    → [clientId, ...]
admin-session:{sessionId}                      → { createdAt, expiresAt }
investor-profile:{slug}                        → Full generated dossier JSON
generated-dossiers-list                        → [{ slug, name, company, generatedAt, ... }]
client-briefing:{clientId}:{slug}:{ts}         → Briefing data + positioning analysis
client-latest-briefing:{clientId}:{slug}       → briefingId reference
```

### API Endpoints (23 total)

**Auth (6)**: admin-login, admin-logout, validate-session, validate-token, google-client-id, google-signin
**Dossier (5)**: generate-dossier, list-dossiers, regenerate-profile, get-profile, verify-claims
**Briefing (4)**: upload-briefing, analyze-positioning, get-positioning, delete-briefing
**Admin Clients (6)**: list, create, get, update, delete, regenerate-token
**Client Ops (2)**: dossiers, generate-dossier

---

## Auth Flows

### Admin Sign-In
```
1. Admin visits / or /admin/
2. Clicks "Sign in with Google"
3. Google ID token sent to POST /api/auth/google-signin
4. Server verifies token, checks email === ADMIN_EMAIL
5. Creates admin-session:{sessionId} in KV (24h TTL)
6. Frontend stores sessionId in localStorage
7. Redirects to /admin/dashboard.html
```

### Client Sign-In
```
1. Client visits /
2. Clicks "Sign in with Google"
3. Google ID token sent to POST /api/auth/google-signin
4. Server verifies token, looks up client-by-email:{email}
5. Returns client's token
6. Frontend redirects to /portal?t={token}
```

### Direct Token Access
```
1. Admin shares link: https://investor-dossiers.vercel.app/portal?t=tok_xxx
2. Client opens link
3. Portal validates token via GET /api/auth/validate-token
4. Shows authorized dossiers
```

---

## Lessons Learned

1. **Vercel env vars**: `vercel env add` with `echo` adds trailing `\n` — use `printf` to avoid corrupted values (caused Google OAuth "invalid_client" error)
2. **Function glob**: `vercel.json` needs `api/**/*.js` (double star) for nested route directories
3. **KV pass-through**: Client APIs must explicitly list response fields (KV objects don't auto-pass-through)
4. **Static vs dynamic dossiers**: Static dossiers (hand-crafted HTML) should link directly to their pages, not through the KV-based dynamic viewer
5. **API timeouts**: Comprehensive AI dossier generation needs up to 5 minutes (maxDuration: 300)
6. **Vercel Pro**: Needed once serverless function count exceeds 12 (Hobby plan limit)

---

## Planned: Merge GatherFAQandSlides into this repo

The Investor Engagement System will become the **parent system** containing two sub-systems:

```
investorengagementsystem/
├── InvestorDossiers/          ← existing (investor dossier platform)
├── GatherFAQandSlides/        ← to be merged in (FAQ system)
├── CLAUDE.md
├── PROGRESS.md
└── ...
```

- **InvestorDossiers/** — the current multi-tenant dossier platform (as-is)
- **GatherFAQandSlides/** — FAQ and slides system from the separate `GatherFAQandSlides` project
- Both are sub-systems within the Investor Engagement System umbrella
- Migration will require consolidating deployment configs, shared auth, and potentially shared KV/Blob storage

---

## Planned Features

- [ ] **Merge GatherFAQandSlides project** into this repo as a sibling sub-system
- [ ] Comparative analysis across multiple investors
- [ ] Dossier search functionality
- [ ] Export to Word/Slides
- [ ] Collaboration features (share analyses)
- [ ] CRM integration
- [ ] Calendar integration for meeting prep
- [ ] Scheduled profile refresh
- [ ] Email notifications for profile updates
