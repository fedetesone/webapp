You are Claude Code acting as a senior full-stack engineer.

Goal:
Start from an existing repository that currently looks like a simple “Vite + TypeScript” template project (like a WebStorm playground). Convert it into a Next.js app that deploys to Vercel as a “Hello World” app (URL can be chosen later). Make it beginner-friendly and reproducible (a JS “virtual env” equivalent).

CRITICAL: define a scalable webapp project structure with well separated packages defining the different app layers. Use good practices.

Target tech stack (after conversion):
- Next.js (App Router) + TypeScript
- Tailwind CSS
- shadcn/ui
- pnpm
- Volta (pin Node + pnpm)

Hard requirements:
1) After conversion, these must work:
    - pnpm install
    - pnpm dev
    - pnpm build
    - pnpm lint
2) Vercel-ready with zero extra config (standard Next.js).
3) Beginner-friendly README with exact steps.
4) Remove Vite-specific configuration and dependencies cleanly.

Process requirements:
- Work directly in the existing repo (assume it currently contains Vite + TS files).
- Prefer a clean migration: delete/replace what’s needed rather than awkward compatibility layers.
- Keep git history in mind: commit in logical steps with clear messages.

Implementation steps (do them, don’t just describe):

A) Inspect current repo
- Print a quick summary of what’s currently there (key files like package.json, vite.config.*, src/, index.html).
- Confirm whether it’s React or vanilla TS.
    - If it’s vanilla TS: you will migrate to Next.js + React + TS anyway (that’s fine).
    - If it’s React: reuse any basic components only if it’s trivial; otherwise start fresh.

B) Convert toolchain to pnpm + Volta
- Ensure pnpm is the package manager:
    - If package-lock.json or yarn.lock exists, remove it.
    - Generate pnpm-lock.yaml.
- Add Volta pinning in package.json:
  "volta": { "node": "LTS_VERSION", "pnpm": "PINNED_VERSION" }

C) Remove Vite
- Remove Vite dependencies from package.json (vite, @vitejs/*, related plugins).
- Delete Vite config files and Vite-only entrypoints:
    - vite.config.*
    - index.html (if present)
    - src/main.ts / src/main.tsx (if Vite React)
    - any Vite-specific assets/config
- Update scripts: remove vite dev/build/preview scripts.

D) Add Next.js (App Router) + TypeScript
- Install Next.js, react, react-dom, and the standard linting setup.
- Create the Next.js structure using App Router:
    - app/layout.tsx
    - app/page.tsx
    - app/globals.css
- Make sure TypeScript config is correct for Next.js (tsconfig.json).
- Add next.config.* only if needed (prefer none).

E) Tailwind for Next.js
- Install Tailwind + PostCSS + Autoprefixer.
- Configure tailwind.config.* with correct content paths:
    - app/**/*.{ts,tsx}
    - components/**/*.{ts,tsx}
    - src/**/*.{ts,tsx} (only if you keep src; otherwise don’t)
- Ensure globals.css includes Tailwind directives.

F) shadcn/ui
- Install shadcn/ui in the canonical way for Next.js + Tailwind.
- Add:
    - components/ui/button.tsx
    - components/ui/card.tsx
- Ensure cn() helper exists (lib/utils.ts).

G) “Hello World” UI
- app/page.tsx must render a centered Card:
    - Title: “Hello World”
    - Description: “Next.js + TypeScript + Tailwind + shadcn/ui”
    - Button: “It works”
- Button must change UI state visibly (toggle text or increment counter). Avoid alert().

H) API health route
- app/api/health/route.ts returns JSON:
  { ok: true, timestamp: "<ISO string>" }

I) Project hygiene + lint
- Add/keep:
    - .gitignore
    - .editorconfig
- Ensure ESLint is configured so `pnpm lint` passes.
- package.json scripts must include:
    - dev: next dev
    - build: next build
    - start: next start
    - lint: next lint

K) README (beginner-friendly)
Write a README that assumes the reader is new to JS tooling. Include:
- What changed: “This repo started as Vite + TS, now it’s Next.js”
- “JS Virtual Environment” section explaining Volta (install instructions for macOS + others)
- Local run steps:
    1) Install Volta
    2) pnpm install
    3) pnpm dev
    4) Open http://localhost:3000
- Deploy to Vercel:
    - Push to GitHub
    - Import into Vercel
    - No env vars needed for Hello World
    - URL can be changed later in Vercel project settings/domains

L) Automated smoke test using the Chrome plugin (must do this)
After conversion, validate end-to-end using the Chrome plugin:

- Start dev server (`pnpm dev`) if not running.
- Use the Chrome plugin to:
  
