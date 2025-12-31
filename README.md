# Insightify

AI-powered analytics dashboard with intelligent chat assistant. Built with React 18, TypeScript and Vite.

## Installation

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Features

- **AI Chat Assistant** - Natural language Q&A for data insights
- **6 Dashboards** - Sales, Analytics, Financial, Operations, HR, E-Commerce
- **Interactive Charts** - Line, Bar, Area, Pie, Radar visualizations
- **Dark/Light Mode** - Auto-detect system preference
- **Persistent Storage** - Chat history saved locally

## Dashboards

| Dashboard  | Theme  | Main Charts          |
| ---------- | ------ | -------------------- |
| Sales      | Blue   | Line + Bar           |
| Analytics  | Purple | Stacked Area + Pie   |
| Financial  | Green  | Grouped Bar + Pie    |
| Operations | Orange | Multi-Line + Bar     |
| HR         | Indigo | Grouped Bar + Radar  |
| E-Commerce | Pink   | Dual-Axis Line + Pie |

## Try AI Assistant

Click the chat button (bottom right) and ask:

- "Forecast revenue for next quarter"
- "Show me sales trends"
- "Compare this month vs last month"
- "Give me insights on performance"

## Troubleshooting

If you encounter a white screen, clear localStorage:

```javascript
// Open Console (F12) and run:
localStorage.clear();
// Then refresh the page
```

## Project Structure

```
src/
├── components/
│   ├── chat/           # Chat UI
│   ├── dashboard/      # Dashboard components
│   └── visualizations/ # Charts, Tables
├── store/              # Zustand state
├── lib/
│   └── agent/          # AI engine
└── types/              # TypeScript types
```

## Tech Stack

- React 18 + TypeScript 5
- Vite 5
- TailwindCSS 3
- Radix UI + Lucide Icons
- Recharts 2
- Zustand 4
- Framer Motion 10

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview build
npm run test     # Run tests
```
