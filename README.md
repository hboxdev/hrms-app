# HBOX HRMS Mobile App

React Native / Expo app for HBOX LLC. Connects to the existing PHP backend's mobile API
(`controllers/ApiController.php` in the `hbox` repo) via JWT bearer auth.

Expo Cloud project: `ahmedali1604/hbox-hrms`.

## Features

Role-based (same JWT/roles as the backend: `admin`, `human_resource`, `manager`, `sales`,
`operation_manager`, `finance`, `user`):

- **Home** — company P&L dashboard (admin/HR) or personal revenue-vs-target (everyone else)
- **Invoices** — list (search/filter/pagination) + detail, own invoices unless admin
- **Teams** — admin/HR only
- **Profile** — account info + HR self-service:
  - **My Payslips** — own salary records, list + detail with status history
  - **Shift Timing** — own assigned shift
  - **Resignation** — submit a new request (with optional document attachment) + view own history

## Backend requirements

Requires these `ApiController.php` endpoints on the PHP backend (already added):
`api/login`, `api/me`, `api/dashboard`, `api/invoices`, `api/invoice`, `api/teams`,
`api/performance`, `api/payslips`, `api/payslip`, `api/shift`, `api/resignation` (GET/POST).

## Get started

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone (same Wi-Fi as the backend if testing locally).

By default the app talks to production (`https://secure.hboxdigital.com`). To point it at a
local XAMPP server instead, run with your Mac's LAN IP (not `localhost` — a phone can't reach that):

```bash
EXPO_PUBLIC_API_URL="http://<your-lan-ip>/hbox/public/?route=api/" npx expo start
```

## Structure

```
src/
  app/                  Expo Router routes (file-based)
    login.tsx
    (tabs)/
      index.tsx         Home
      invoices/         Invoices list + [id] detail
      teams/            Admin/HR only
      profile/          Profile hub + payslips/shift/resignation
  lib/
    api-client.ts       fetch wrapper, JWT bearer injection, error envelope
    auth-context.tsx    AuthProvider/useAuth — session + role gating
    storage.ts          SecureStore-backed token/user persistence
    types.ts            Shared TS types matching the PHP API responses
  components/
    common.tsx          Card, StatCard, ListRow, Badge, Loading/Error/Empty states
```
