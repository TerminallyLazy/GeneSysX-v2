# GeneSysX Improvement Plan

This document tracks a comprehensive overhaul of the GeneSysX workbench: site UX, scientific tools/APIs, performance, quality, security, and operations. Logo and custom icons remain unchanged.

Status: Baseline audited. Typecheck, lint, and prod build now pass locally.

## Baseline Audit (Summary)
- Build: Vite + React + Tailwind. Prod bundle ~956 kB (optimize via code-splitting).
- Lint/Typecheck: Fixed blockers and 404 favicon. Remaining warnings are safe to defer.
- Features: Several bio tools are UI-only (placeholders) — must be made functional with real algorithms/APIs.
- AI: Gemini via Vite client env (VITE_GEMINI_API_KEY) — should be proxied via serverless to keep key secret.

## Phase 1 — Hardening & Foundations (1-2 days)
- DX/Quality
  - [x] Fix favicon 404 (/vite.svg) → /logo.svg
  - [x] Pass TypeScript strict check; eliminate unused React imports
  - [x] ESLint: reduce to warnings only
  - [ ] Add .env.example with VITE_GEMINI_API_KEY and notes
  - [ ] Add scripts: typecheck, lint:fix, analyze-bundle (rollup-plugin-visualizer)
- CI/CD
  - [ ] GitHub Actions: lint + typecheck + build + deploy preview
  - [ ] Vercel preview comment on PRs
- Performance
  - [ ] Route-based code-splitting: lazy() for heavy routes/tools
  - [ ] Split react-syntax-highlighter to Prism languages dynamically
  - [ ] Preload fonts; use font-display: swap; consider bundling
- Accessibility/SEO/PWA
  - [ ] Landmark roles, focus outline, contrast checks
  - [ ] Add meta tags, sitemap, robots, OpenGraph
  - [ ] Optional: manifest + PWA service worker

## Phase 2 — Make Every Tool Functional (science-based; no mocks) (3-6 days)
- Sequence Analysis
  - [ ] FASTA parser + sanitizer; support DNA/RNA/protein detection
  - [ ] ORF finding, translation, reverse complement, GC windows, k-mer freq
  - [ ] Local alignments: existing Smith-Waterman/Needleman-Wunsch — validate with unit tests
  - [ ] Remote BLAST (NCBI E-utilities/QBLAST) with poll/progress + result viewer
- Multiple Sequence Alignment (MSA)
  - [ ] EBI Clustal Omega REST API integration (submit, poll, fetch aligned FASTA/Clustal)
  - [ ] Visual MSA viewer with conservation tracks and export
- Phylogenetics
  - [ ] Distance matrix calculators (Jukes–Cantor, Kimura 2P)
  - [ ] Neighbor-Joining (client) to generate trees from MSA
  - [ ] Tree viewer (phylotree.js or d3) with zoom/export (Newick)
- Protein Analysis
  - [ ] UniProt lookup (by sequence or ID) → canonical info, length, features
  - [ ] InterPro/EBI APIs for domains and GO annotations
  - [ ] AlphaFold DB: embed Mol* viewer for predicted structures + PAE
  - [ ] Motif scan via PROSITE (ExPASy) where feasible
- Molecular Interactions
  - [ ] Basic PPI lookup via STRING/IntAct APIs with network viz
  - [ ] Ligand queries via PubChem/ChEMBL (sketch minimal viewer)
- Data I/O
  - [ ] Import/export FASTA/CSV/JSON; drag-drop; persist sessions in localStorage

## Phase 3 — AI & Backend Safety (2-4 days)
- [ ] Move Gemini calls to Vercel serverless API route; keep key server-side
- [ ] Streaming responses with SSE to UI; retry/backoff
- [ ] Prompt guards for bio-safety; add citations mode
- [ ] Add curated “assistant tools” that call the scientific APIs above

## Phase 4 — Testing & Docs (ongoing)
- [ ] Vitest + RTL for algorithms and critical UI paths
- [ ] Golden tests for SW/NW vs known examples
- [ ] E2E smoke (Playwright) for key flows
- [ ] In-app Docs: Replace placeholders with real guides, API refs, and examples

## Security & Compliance
- [ ] Secret hygiene: no client API keys; CSP headers; sanitize inputs
- [ ] Respect external API rate limits; include contact email in UA when allowed

## Immediate Quick Wins (suggested next commits)
1) Add .env.example and README setup section; fail-fast if key missing with helpful UI
2) Lazy-load code blocks and heavy routes; split SyntaxHighlighter languages
3) Implement EBI Clustal Omega integration with a simple job UI
4) Add BLAST (NCBI) search panel with polling
5) Add UniProt + AlphaFold viewer for Protein Analysis

## Notes
- Keep logo/icons as-is.
- Prefer public, documented scientific APIs; cite sources in UI.
- Start with EBI (Clustal Omega/InterPro), NCBI (BLAST), UniProt, AlphaFold DB, STRING.
