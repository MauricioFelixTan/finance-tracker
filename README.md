# Finance Tracker

A personal finance management dashboard built with **Next.js 14**, **TypeScript**, and **Tailwind CSS**. Track income, expenses, budgets, and view spending insights.

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 14 (App Router) | React framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Recharts | Charts & graphs |

## Features

- **Authentication**: Login & register with JWT
- **Dashboard**: Income/expense summary cards, 6-month bar chart, expense pie chart, recent transactions, month selector
- **Transactions**: Full CRUD with filters (type, category, date range, keyword search), pagination, CSV export
- **Categories**: Default seeded categories, custom CRUD
- **Budgets**: Set monthly/weekly limits per category, progress bar, ≥80% alert badge

## Getting Started

```bash
# Clone
git clone https://github.com/MauricioFelixTan/finance-tracker.git
cd finance-tracker

# Install dependencies
npm install

# Copy env file
cp .env.local.example .env.local
# Edit NEXT_PUBLIC_API_URL to point at the backend

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API

This frontend requires the [Finance Tracker API](https://github.com/MauricioFelixTan/finance-tracker-api).

## Deployment

Deploy on [Vercel](https://vercel.com) — connect your repo, set `NEXT_PUBLIC_API_URL`, done.
