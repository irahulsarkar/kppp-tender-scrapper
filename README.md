# KPPP Live Tenders Dashboard - FOR EDUCATIONAL PURPOSE ONLY.
<img width="1517" height="1252" alt="image" src="https://github.com/user-attachments/assets/5b4bcef6-6321-4e7f-bf94-4156bb2d8921" />


Production-ready full-stack application to scrape and monitor live tenders from the Karnataka Public Procurement Portal (KPPP), store them in PostgreSQL, and display them in a contractor-focused dashboard.

## Stack

- Backend: Node.js, Express, Puppeteer, node-cron, PostgreSQL
- Frontend: React (Vite), Tailwind CSS, Axios, Recharts
- Alerts: Email (SMTP), WhatsApp (Twilio)
- Exports: CSV + Excel

## Features Implemented

- Automated tender scraping from KPPP "Search Tenders" flow
- CAPTCHA handling via OCR (`tesseract`) or external solver (`2captcha`)
- Extraction across `Goods`, `Works`, `Services`
- PostgreSQL persistence with dedupe (`source_tab + tender_number` unique key)
- Cron scrape every 30 minutes
- REST APIs:
  - `GET /api/tenders`
  - `GET /api/tenders/works`
  - `GET /api/tenders/services`
  - `GET /api/tenders/goods`
  - `GET /api/tenders/new`
- Contractor dashboard:
  - KPI cards
  - Search + filters (department, value, district/location, closing date)
  - Sorting by value/date
  - View details / download links
  - Auto refresh every 30 minutes
- Extra:
  - Email alerts for high-value tenders
  - WhatsApp alerts
  - CSV / Excel export
  - Analytics charts

## Project Structure

```txt
kppp-tender-dashboard/
  backend/
    scraper.js
    server.js
    cron.js
    src/
      scraper/
      routes/
      services/
      scheduler/
      db/
  frontend/
    dashboard.jsx
    tenderTable.jsx
    src/
      App.jsx
      components/
```

## Environment Setup

1. Copy env template:

```bash
cd kppp-tender-dashboard
cp backend/.env.example backend/.env
```

2. Update `backend/.env`:

- `DATABASE_URL` for PostgreSQL
- `CAPTCHA_PROVIDER=tesseract` (default) or `2captcha`
- If `2captcha`, set `CAPTCHA_API_KEY`
- Configure SMTP + Twilio vars only if alerts are needed

## Local Installation

```bash
cd kppp-tender-dashboard
npm run install:all
```

## Run (Development)

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Or from root (if `concurrently` installed):

```bash
npm install
npm run dev
```

## Run Scraper Once

```bash
cd backend
npm run scrape
```

## API Reference

### `GET /api/tenders`

Query params:

- `search`
- `department`
- `district`
- `minValue`
- `maxValue`
- `closingDate` (`YYYY-MM-DD`)
- `type`
- `sortBy` (`estimated_value|published_date|closing_date|updated_at`)
- `sortOrder` (`asc|desc`)
- `page`
- `limit`

### Category APIs

- `GET /api/tenders/works`
- `GET /api/tenders/services`
- `GET /api/tenders/goods`

### New tenders in last 24h

- `GET /api/tenders/new`

### Exports

- `GET /api/tenders/export/csv`
- `GET /api/tenders/export/xlsx`

### Analytics

- `GET /api/analytics/summary`

## Docker

```bash
cd kppp-tender-dashboard
cp backend/.env.example backend/.env
docker compose up --build
```

Services:

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:5000`
- PostgreSQL: `localhost:5432`

## Deploy Backend on Render

This repo now includes Render Blueprint config in `render.yaml` for the backend service.

### Option A: Blueprint (recommended)

1. Push this repo to GitHub.
2. In Render, use **New +** -> **Blueprint** and select the repo.
3. Render will create:
   - Web service: `kppp-tender-backend` (from `backend/`)
   - PostgreSQL database: `kppp-tender-db`
4. Set `CORS_ORIGIN` in Render to your frontend URL (for example, your Vercel domain).
5. Deploy and check health at `/api/health`.

### Option B: Manual Web Service

If you create the service manually, use:

- Root Directory: `backend`
- Build Command: `npm install --omit=dev`
- Start Command: `npm run start`
- Health Check Path: `/api/health`

Use `backend/.env.render.example` as the production env template.

## Production Notes

- CAPTCHA solving reliability depends on the portal CAPTCHA complexity and provider quality.
- Keep selector logic in `backend/src/scraper/kpppScraper.js` updated if KPPP markup changes.
- Set `SCRAPE_HEADLESS=true` in production.
- Add central logging/monitoring and external retries if running at scale.
