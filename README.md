# Next.js + TypeScript Web Application

Modern Next.js application with TypeScript, Tailwind CSS, and shadcn/ui components.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
webapp/
├── app/                          # Next.js App Router (routes & pages)
│   ├── layout.tsx               # Root layout - wraps all pages
│   ├── page.tsx                 # Home page (/) - Hello World with counter
│   ├── globals.css              # Global styles + Tailwind directives
│   └── api/
│       └── health/
│           └── route.ts         # GET /api/health endpoint
│
├── components/                   # React components
│   └── ui/                      # shadcn/ui components
│       ├── button.tsx           # Button component with variants
│       └── card.tsx             # Card component with subcomponents
│
├── lib/
│   └── utils.ts                 # Utilities (cn helper for class merging)
│
├── public/                       # Static assets (served at /)
│   ├── fonts/                   # Font files
│   └── *.svg                    # SVG images
│
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── postcss.config.mjs            # PostCSS configuration
├── components.json               # shadcn/ui configuration
└── .eslintrc.json               # ESLint configuration
```

## Understanding the Code

### Home Page (`app/page.tsx`)

The main page is a client component with a simple counter:
- Uses `'use client'` directive for client-side interactivity
- Imports shadcn/ui components (Card, Button)
- Manages counter state with React's `useState`
- Button increments counter on click

### API Route (`app/api/health/route.ts`)

RESTful API endpoint following Next.js conventions:
- Exports async `GET` function
- Returns JSON: `{ ok: true, timestamp: "<ISO string>" }`
- Accessible at `/api/health`

### Layout (`app/layout.tsx`)

Root layout that wraps all pages:
- Defines metadata (title, description)
- Imports global CSS
- Provides HTML structure

### Component System

**shadcn/ui Philosophy:**
- Components are added to your project (not npm packages)
- Full control over component code
- Built with Radix UI primitives
- Styled with Tailwind CSS

**Key Components:**
- `Button` - Uses class-variance-authority for variants
- `Card` - Composite component (Header, Title, Description, Content, Footer)

### Styling

**Tailwind Setup:**
```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**CSS Variables:**
- Theme colors defined as CSS custom properties
- Supports light/dark mode via `.dark` class
- Accessed via `hsl(var(--variable-name))`

**Utility Function:**
```typescript
// lib/utils.ts
cn(...classes) // Merges Tailwind classes intelligently
```

## Available Scripts

```bash
pnpm dev      # Start dev server (http://localhost:3000)
pnpm build    # Build for production
pnpm start    # Run production build locally
pnpm lint     # Run ESLint
```

## Tech Stack

| Layer          | Technology        | Why                                |
|----------------|-------------------|------------------------------------|
| Framework      | Next.js 15        | React framework with App Router    |
| Language       | TypeScript        | Type safety                        |
| Styling        | Tailwind CSS      | Utility-first CSS                  |
| Components     | shadcn/ui         | Accessible, customizable UI        |
| Package Mgr    | pnpm              | Fast, efficient dependency manager |
| Version Mgr    | Volta             | Node/pnpm version pinning          |

## Adding New Pages

Next.js uses file-system routing in the `app/` directory:

```typescript
// app/about/page.tsx
export default function About() {
  return <div>About Page</div>;
}
// Accessible at /about
```

## Adding New API Routes

```typescript
// app/api/users/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ users: [] });
}
// Accessible at /api/users
```

## Adding shadcn/ui Components

```bash
# Add a new component (e.g., input)
npx shadcn@latest add input
```

This downloads the component to `components/ui/input.tsx`.

## Environment Setup (Volta)

Volta ensures consistent Node.js and pnpm versions across environments.

**Install Volta:**
```bash
# macOS/Linux
curl https://get.volta.sh | bash

# Windows
# Download installer from volta.sh
```

After installation, Volta automatically uses versions specified in `package.json`:
```json
"volta": {
  "node": "20.18.2",
  "pnpm": "10.28.0"
}
```

## Deployment

**Vercel (Recommended):**
1. Push to GitHub
2. Import repository in [vercel.com](https://vercel.com)
3. Deploy (auto-configured for Next.js)

**Build Output:**
- Static pages are pre-rendered
- API routes are serverless functions
- Client components are hydrated on the client

## Learn More

- [Next.js App Router](https://nextjs.org/docs/app) - Routing & layouts
- [TypeScript](https://www.typescriptlang.org/docs) - Type system
- [Tailwind CSS](https://tailwindcss.com/docs) - Utility classes
- [shadcn/ui](https://ui.shadcn.com) - Component documentation
- [Volta](https://docs.volta.sh) - Version management
