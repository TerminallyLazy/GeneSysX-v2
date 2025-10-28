# GeneSysX — Bioinformatics & Machine Learning Workbench

A multifunction workbench for bioinformatics and ML with sequence analysis, alignment tools, phylogenetics, UniProt/AlphaFold integration, and an AI assistant.

## Quick Start

1. Install deps
   - npm ci
2. Configure environment
   - Create `.env` and set:
     - `GEMINI_API_KEY=...` (serverless chat)
3. Run
   - npm run dev
4. Build
   - npm run build

## Key Features
- AI Assistant (Gemini) with streaming responses
- Sequence Analysis (GC content, Smith–Waterman, Needleman–Wunsch)
- Multiple Sequence Alignment via EBI Clustal Omega (real API)
- Phylogenetic Analysis (UI scaffolding for methods)
- Protein Analysis: UniProt lookup + inline AlphaFold 3D viewer
- NCBI BLAST via serverless proxy (submit/status/result)

## Useful Scripts
- npm run typecheck — strict TS checks
- npm run lint — ESLint
- npm run analyze — build with bundle visualizer (artifact in CI PRs)

## Environment
- Server-side: `GEMINI_API_KEY` is used by `/api/gemini-chat` and `/api/gemini-stream`.
- No client key is required.
