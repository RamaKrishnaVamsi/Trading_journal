# Personal Trading Journal (MERN + TypeScript)

A focused journal for recording trades and understanding your own performance —
no scanners, no live market data, no news feed. Just: record → review → improve.

## Stack
- **Backend:** Node + Express + TypeScript + MongoDB (Mongoose)
- **Frontend:** React + TypeScript + Vite, `react-router-dom`
- **Screenshots:** uploaded via `multer`, served as static files

## Features implemented
- **Dashboard** — today/week/month P&L, total trades, win rate, avg profit/loss,
  profit factor, average R:R, current win/loss streak
- **Add Trade** — quick-entry form with a live auto-calculated preview
  (net P&L, % return, risk amount, R-multiple, holding time, result)
- **Screenshots** — before-entry / after-entry / exit chart upload per trade
- **Trade Notes** — the six reflection prompts you listed
- **Psychology** — emotion tags + followed-plan / moved-SL / overtraded / chased-entry flags
- **Calendar** — monthly view, 🟢/🔴/⚪ per day, click a day to see its trades
- **Trade History** — search/filter by stock, side, result, setup, date range
- **Performance Analytics** — best stock, best setup, long vs short, best hour,
  avg win/loss, mistake frequency, money lost to mistake-tagged trades

All P&L math (gross/net P&L, % return, risk amount, R-multiple, holding time)
lives in one pure function on each side (`backend/src/utils/calculations.ts`
and `frontend/src/utils/calculations.ts`) so the live preview in Add Trade
matches exactly what gets persisted.

## Setup

### 1. Prerequisites
- Node.js 18+
- A MongoDB instance (local `mongod`, or a free MongoDB Atlas cluster)

### 2. Backend
```bash
cd backend
cp .env.example .env      # edit MONGO_URI if not using local default
npm install
npm run dev                # starts on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                 # starts on http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to `http://localhost:5000`,
so just open **http://localhost:5173**.

### 4. Production build
```bash
cd backend && npm run build && npm start
cd frontend && npm run build   # outputs static files to frontend/dist
```
Serve `frontend/dist` with any static host (or point Express at it) and keep
the backend running behind it.

## Project structure
```
trading-journal/
  backend/
    src/
      config/db.ts            Mongo connection
      models/Trade.ts         Mongoose schema (single source of truth for a trade)
      controllers/            CRUD, calendar aggregation, dashboard & analytics
      routes/                 /api/trades, /api/analytics
      middleware/upload.ts    multer config for chart screenshots
      utils/calculations.ts   P&L / R-multiple / holding-time math
  frontend/
    src/
      pages/                  Dashboard, AddTrade, TradeHistory, TradeDetail,
                               CalendarView, Analytics
      api/client.ts           typed axios wrapper around the API
      utils/calculations.ts   same math, for the live preview
      types/trade.ts          shared TS types
```

## Notes on scope
This intentionally leaves out the scanner, live NSE data, news engine, and
liquidity/ATR tooling — those belong in a separate stock-selection app. This
one only answers: *how am I performing as a trader, and what do I need to
improve?*

## Not yet wired up (natural next steps)
- Auth/multi-user support (currently single-journal, no login)
- Editing an existing trade's core fields from the UI (API supports `PUT`,
  just needs an edit form on the Trade Detail page)
- Charting (recharts is already a frontend dependency, ready for an equity
  curve or win-rate-over-time chart on the Analytics page)
