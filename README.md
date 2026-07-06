# ELAH Analytics Dashboard

A read-only Next.js dashboard that visualizes the data inside the
ELAH banking simulation SQLite database.

It points at the same `dev.db` file as the banking app via an absolute path
in `DATABASE_URL`, so any new activity in the banking app shows up after a
page refresh.

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript strict
- Tailwind CSS 3 (dark theme, navy + cyan + gold)
- Prisma 5 (read-only, schema mirrors the banking app)
- Recharts for all graphs
- lucide-react for icons

## Run it

```bash
npm install   # postinstall runs `prisma generate`
npm run dev   # http://localhost:3001
```

Build for production:

```bash
npm run build
npm run start
```

## Where the data comes from

`.env`:

```
DATABASE_URL="file:/Users/benda/ELAH_SECURITY---Banking-System/prisma/dev.db"
```

The dashboard never writes — every query goes through `lib/queries.ts`
using only `prisma.*.findMany` / `groupBy` / `count`.

## Charts

- Stat cards: audit actions, transactions, customers, risk events, loans+tickets, net cash flow
- **AI Assistant**: events, conversations, tool executions, security signals, pending confirmations, flagged chats
- Assistant events over time (tools / security / other)
- **Assistant security risks**: 14-day security signal timeline, risk score bands, detection labels
- Policy decisions, event types, top tools, per-customer activity, recent assistant feed
- Actions over time (stacked by risk)
- Risk-level donut
- Top action types (horizontal bar)
- Actions per customer (color-coded by tier)
- Cash flow over time (debits vs credits)
- Transactions by category
- Top merchants & recipients by spend
- Activity by hour-of-day
- Recent audit-log feed
- Recent risk events panel
