# Insightify

AI-powered analytics dashboard built with React, TypeScript, Vite, TailwindCSS, Zustand, Recharts, and Cloudflare Pages Functions.

## Demo Scope

This project is a frontend demo for Insightify.

It focuses on dashboard UI, chart interactions, mock analytics data, and the AI assistant experience. It does not include a production backend, real database integration, user authentication, or production-grade data pipelines.

## Features

- Analytics dashboards for Sales, Analytics, Financial, Operations, HR, and E-Commerce
- AI chat assistant for dashboard insights
- Interactive charts and data tables
- Dark/light mode
- Cloudflare proxy endpoints for OpenAI and Anthropic

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Environment

For local reference, copy `.env.example` to `.env.local` if needed.

For production, set these in Cloudflare Pages environment variables:

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
ALLOWED_ORIGINS=https://yourdomain.com
API_SECRET=optional-secret
```

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test
npm run typecheck
```

## Notes

- API keys should stay server-side in Cloudflare Pages, not in client `VITE_*` variables.
- If the app loads with stale data during development, clear `localStorage` and refresh.
