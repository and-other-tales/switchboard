# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands
- Webapp: `npm run dev` (development), `npm run build` (production), `npm run start` (run production)
- Websocket Server: `npm run dev` (development), `npm run build` (compile TS), `npm run start` (run compiled code)

## Lint Commands
- Webapp: `npm run lint` - Run ESLint

## Code Style Guidelines
- Indentation: 2 spaces
- Imports: Group by external, built-in, internal; use double quotes
- Types: Use TypeScript throughout; explicit interface/type definitions in types.ts files
- Naming: camelCase for variables/functions, PascalCase for components/interfaces
- Error handling: Use try/catch blocks, early returns, null checks
- Components: One component per file, functional components with React hooks
- Functions: Single responsibility, descriptive names, explicit typing
- State management: React hooks (useState, useEffect) for component state

## Architecture
- Next.js frontend in webapp/ directory
- Node.js WebSocket server in websocket-server/ directory
- TypeScript throughout the codebase