# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vite + TypeScript web application. It's a simple counter application that demonstrates TypeScript with DOM manipulation.

## Development Commands

### Start Development Server
```bash
npm run dev
```
Starts Vite dev server with hot module replacement. Click the link in output to open the app in the browser.

### Build for Production
```bash
npm run build
```
Runs TypeScript compiler first, then builds with Vite. Output goes to `dist/` directory.

### Preview Production Build
```bash
npm run preview
```
Locally preview the production build.

### Code Formatting
```bash
npx prettier --write .
```
Formats code according to `.prettierrc` settings (single quotes, 80 char width, 2 space tabs).

## Architecture

### Project Structure
- `src/main.ts` - Entry point with DOM manipulation and counter logic
- `index.html` - Main HTML file that loads `/src/main.ts` as a module
- `public/` - Static assets (fonts, SVGs, styles)
- `dist/` - Build output (git-ignored)

### TypeScript Configuration
- Target: ES2020
- Module system: ESNext with bundler resolution
- Strict mode enabled with additional linting rules (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`)
- DOM types included for browser APIs

### Counter Implementation
The counter in `src/main.ts` uses a wrapping behavior:
- Values >= 100 wrap to (value - 100)
- Values <= -100 wrap to (value + 100)

This wrapping logic is in `adjustCounterValue()` and is applied through `setCounter()`.
