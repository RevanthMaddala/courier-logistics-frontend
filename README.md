# Courier Logistics — Frontend

React web app for the [courier-logistics-tracking-system](../courier-logistics-tracking-system) Spring Boot API.

**Stack:** React 18 · React Router 6 · Vite 5 · plain CSS (light and dark mode follow the OS setting)

## Features

| Page | What you can do |
|---|---|
| **Dashboard** | Totals, shipments by status, recently updated shipments |
| **Shipments** | Filter by status, customer, agent or warehouse (filters are in the URL, so links are shareable); book a shipment with packages |
| **Shipment detail** | Change status (only allowed next steps are offered), assign agent and warehouse, add checkpoints, see the tracking timeline, record a payment and move it through its statuses, add, edit or remove packages while the shipment is Created, edit or delete the shipment |
| **Customers / Delivery agents / Warehouses** | List, search or filter, create, edit, delete; agents can be switched between available and off duty |
| **Payments** | All payments with a status filter |
| **Track a shipment** | The public, customer-facing view: route, status and history only |

Validation errors from the API are shown next to the field they belong to. Business-rule errors (e.g. a full
warehouse) appear as a message at the top of the form.

## Running

The backend must be running first (default `http://localhost:8081`).

```bash
npm install
npm run dev
```

Open http://localhost:5173. In development, Vite forwards `/api/*` to the backend, so no CORS setup is needed.
To point at a different backend, copy `.env.example` to `.env.local` and set `VITE_BACKEND_URL`.

## Production build

```bash
npm run build
```

Static files are written to `dist/`. Either:

- serve `dist/` behind the same origin as the API (e.g. an nginx `location /api` proxy), leaving
  `VITE_API_BASE_URL` empty, or
- serve it from another origin: set `VITE_API_BASE_URL=https://api.example.com` before building, and add that
  origin to the backend's `CORS_ALLOWED_ORIGINS` environment variable.

Because this is a single-page app, the web server must return `index.html` for unknown paths such as
`/shipments/12`.

## Structure

```
src/
├── api/          fetch wrapper (client.js) and one module per backend resource (endpoints.js)
├── components/   layout, shared UI (badges, modal, fields, pagination), timeline, package fields, toasts
├── hooks/        useApi / useMutation for loading and saving, useLookups for dropdown data
├── pages/        one component per route
├── utils/        date, money and weight formatting
├── constants.js  enums and the status transition rules, mirrored from the backend
└── styles.css
```

If the backend's status rules change, update `SHIPMENT_TRANSITIONS` / `PAYMENT_TRANSITIONS` in
`src/constants.js` so the UI keeps offering only valid moves (the API is still the final check).
