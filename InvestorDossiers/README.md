# Investor Dossiers

A repository of investor profiles and engagement strategies.

## Structure

```
InvestorDossiers/
├── dossiers/           # Active investor profiles (Markdown + YAML)
├── templates/          # Template files for new dossiers
└── originals/          # Source documents (PDFs, notes, etc.)
```

## Creating a New Dossier

1. Copy `templates/investor-template.md` to `dossiers/{investor-slug}.md`
2. Fill in the YAML frontmatter with structured data
3. Complete the narrative sections below the frontmatter
4. Set `status: active` when ready

## Dossier Sections

### YAML Frontmatter (Structured Data)
- **Basic info**: Name, firm, role, contact
- **Investment focus**: Areas, stages, check sizes
- **Background**: Career history, education, notable traits
- **Portfolio**: Board seats, observer roles, other investments
- **Thesis**: Core philosophy, key concepts, patterns/anti-patterns
- **Recent activity**: Podcasts, articles, current focus
- **Engagement**: Do's, don'ts, anticipated questions

### Narrative Sections
- Background summary
- Investment thesis deep dive
- Portfolio pattern analysis
- Positioning strategy
- Meeting prep checklist
- Follow-up plan

## File Naming

Use lowercase slugs: `firstname-lastname.md`
- `yoko-li.md`
- `marc-andreessen.md`
- `sarah-smith.md`

## Status Values

- `draft` - Work in progress
- `active` - Ready for use
- `archived` - No longer actively targeting
