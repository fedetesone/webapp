# Next.js + TypeScript Web Application

## What Changed

This repository started as a **Vite + TypeScript** template project. It has been converted to a modern **Next.js** application with the following tech stack:

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** component library
- **pnpm** package manager
- **Volta** for Node.js version management

## Prerequisites

Before you begin, you'll need to install Volta, which acts as a "virtual environment" for JavaScript projects by managing Node.js and pnpm versions automatically.

### Installing Volta

**macOS and Linux:**
```bash
curl https://get.volta.sh | bash
```

**Windows:**
Download and run the Windows installer from [volta.sh](https://volta.sh)

After installation, restart your terminal. Volta will automatically use the pinned Node.js and pnpm versions specified in `package.json`.

## Local Development

### 1. Install Dependencies

```bash
pnpm install
```

If you don't have pnpm installed globally, Volta will install it automatically when you run this command.

### 2. Run Development Server

```bash
pnpm dev
```

The application will start at [http://localhost:3000](http://localhost:3000)

### 3. Build for Production

```bash
pnpm build
```

This creates an optimized production build in the `.next` directory.

### 4. Run Production Server Locally

```bash
pnpm start
```

This runs the production build locally (requires running `pnpm build` first).

### 5. Lint Code

```bash
pnpm lint
```

Runs ESLint to check for code quality issues.

## Project Structure

```
├── app/                    # Next.js App Router directory
│   ├── layout.tsx         # Root layout component
│   ├── page.tsx           # Home page
│   ├── globals.css        # Global styles with Tailwind
│   └── api/               # API routes
│       └── health/        # Health check endpoint
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility functions
├── public/               # Static assets
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── tailwind.config.ts    # Tailwind CSS configuration
```

## Deploy to Vercel

Vercel is the easiest way to deploy Next.js applications. No environment variables are needed for this Hello World app.

### Steps:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial Next.js setup"
   git push origin main
   ```

2. **Import into Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up or log in with your GitHub account
   - Click "New Project"
   - Import your repository
   - Vercel will automatically detect Next.js and configure everything

3. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your application
   - You'll receive a URL like `your-project.vercel.app`

4. **Custom Domain (Optional)**
   - After deployment, go to your project settings
   - Navigate to "Domains"
   - Add your custom domain

## API Endpoints

### Health Check
```
GET /api/health
```

Returns:
```json
{
  "ok": true,
  "timestamp": "2026-01-11T22:56:00.000Z"
}
```

## Tech Stack Details

### Next.js App Router
This project uses the App Router (not Pages Router), which is the recommended approach for new Next.js applications. Routes are defined by the folder structure in the `app` directory.

### TypeScript
Full TypeScript support with strict mode enabled for better type safety.

### Tailwind CSS
Utility-first CSS framework configured with custom theme variables for consistent styling.

### shadcn/ui
A collection of beautifully designed, accessible React components built with Radix UI and Tailwind CSS. Components are added to your project directly (not as an npm package), giving you full control.

### Volta
Volta ensures everyone on the team uses the same Node.js and pnpm versions, eliminating "works on my machine" issues. The versions are pinned in `package.json` under the `volta` field.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Volta Documentation](https://docs.volta.sh)
