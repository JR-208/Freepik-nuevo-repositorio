# Contributor Analytics

A production-ready analytics dashboard for Freepik (and similar platform) contributor data.
Upload your monthly CSV exports and instantly get actionable insights about your content performance.

---

## ✨ Features

- **CSV Upload** — Drag & drop single or multiple CSV files, auto-detects format
- **Smart Parsing** — Handles malformed CSVs, single-column, various delimiters
- **LocalStorage Persistence** — Your data survives page refreshes
- **Overview** — KPI cards, earnings & downloads charts
- **Asset Performance** — Sortable table, filters, top-10 highlights, zero-download flags
- **Asset Types** — Bar charts and efficiency metrics per type
- **Keyword Insights** — NLP extraction, tag cloud, ranked by frequency/earnings/downloads
- **Growth** — Monthly trends, MoM comparison
- **Insights Panel** — Auto-generated insights (Pareto, best type, keyword performance)
- **Recommendation Engine** — Suggests what to create more/less of

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open browser
open http://localhost:3000
```

---

## 📦 Tech Stack

| Tool | Purpose |
|------|---------|
| Next.js 14 (App Router) | Framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Recharts | Charts |
| PapaParse | CSV parsing |
| lucide-react | Icons |

**No backend, no database — 100% client-side.**

---

## 📂 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # → Overview
│   ├── assets/             # Asset performance table
│   ├── types/              # Asset type analysis
│   ├── keywords/           # Keyword insights
│   ├── growth/             # Monthly growth
│   ├── insights/           # Insights + recommendations
│   └── upload/             # CSV upload
├── components/
│   ├── layout/             # AppShell, Sidebar
│   ├── ui/                 # KPICard, UploadZone, InsightCard, etc.
│   └── charts/             # Recharts wrappers
├── hooks/
│   └── useStore.ts         # Global state + localStorage
├── lib/
│   ├── parser.ts           # CSV parsing, analytics, insights
│   └── cn.ts               # Tailwind class utility
└── types/
    └── index.ts            # TypeScript interfaces
```

---

## 📄 Supported CSV Formats

The parser auto-detects column names. It recognizes these field variants:

| Field | Column name variants |
|-------|---------------------|
| Asset ID | `asset id`, `id`, `file id`, `assetid` |
| File Name | `file name`, `name`, `title`, `asset name` |
| Downloads | `downloads`, `nb downloads`, `total downloads` |
| Earnings | `earnings`, `revenue`, `amount`, `income` |
| Type | `type`, `asset type`, `category`, `format` |
| Description | `description`, `keywords`, `tags` |

**Month detection** — extracted automatically from filename:
- `2024-03.csv` → March 2024
- `march_2024.csv` → March 2024
- `freepik_2024-11_export.csv` → November 2024

---

## ☁️ Deploy to Vercel

### Option A — CLI

```bash
npm i -g vercel
vercel
```

### Option B — GitHub

1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your repository
4. Click **Deploy** — no configuration needed

Vercel auto-detects Next.js and sets all defaults.

---

## 🔒 Privacy

All data is processed **entirely in the browser**. No CSV data is ever sent to a server.
Data persists locally via `localStorage` and can be cleared at any time from the sidebar or Upload page.

---

## 📝 License

MIT
