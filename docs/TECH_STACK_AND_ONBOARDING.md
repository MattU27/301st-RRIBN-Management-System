## 301st RRIBN Management System — Tech Stack and Onboarding

This document gives a complete overview of the technology stack, environment variables, local setup, scripts, and deployment so a new developer can get productive quickly.

### Architecture
- **Monorepo** with:
  - **Web app**: Next.js 15 (App Router) + React 19 + Node.js
  - **Mobile app**: Flutter (Dart) under `armed_forces_app/`
- **Database**: MongoDB (Atlas or local). Accessed primarily via **Mongoose**; some direct native driver usage through `mongoose.connection.db`.
- **File storage**: MongoDB GridFS for policy documents.
- **Realtime**: Socket.IO (Node server + web and Flutter clients).

### Key Directories
- `src/app/` — Next.js App Router pages and API routes
- `src/lib/` — DB, GridFS, auth helpers
- `src/models/` — Mongoose models (if present)
- `src/utils/` — utilities (sockets, exports, audit helpers)
- `src/scripts/` and `scripts/` — seed/maintenance scripts
- `armed_forces_app/` — Flutter app
- `docs/` — documentation (this file, deployment guides, roles, etc.)

### Web App (Next.js) Overview
- **Framework**: Next.js 15; App Router in `src/app`
- **Language**: TypeScript 5.x (mixed TS/JS)
- **Node version**: Recommend 18 LTS or 20 LTS
- **Custom server**: `server.js` starts Next.js via Node `http` and initializes Socket.IO (`src/utils/socket`)
- **Styling**: Tailwind CSS 3.x, PostCSS, autoprefixer
- **Charts/UI**: Chart.js, Headless UI, Heroicons, lucide-react
- **Auth**: Custom JWT-based; cookies are `httpOnly` and `secure` in production
- **PDF/Export**: jspdf, jspdf-autotable, html2canvas (client); pdfkit, html-pdf-node, puppeteer (server); xlsx for spreadsheets

### Mobile App (Flutter) Overview
- **Path**: `armed_forces_app/`
- **Framework**: Flutter (SDK constraint ^3.6.2)
- **State management**: provider, flutter_bloc
- **Networking**: http, dio
- **Storage/Auth**: shared_preferences, flutter_secure_storage, jwt_decoder
- **Realtime**: socket_io_client
- **DB**: mongo_dart (connects to same MongoDB)

### Environment Variables
Create `.env` at the repo root for the web app (and configure your deployment provider accordingly):

```
# Core
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/afp_personnel_db
JWT_SECRET=replace-with-strong-secret

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password-or-app-password
EMAIL_FROM="AFP Password Recovery <noreply@afp.mil.ph>"

# App URLs
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Toggles / Scripts
NEXT_PUBLIC_USE_SAMPLE_DATA=false
API_TOKEN=your_admin_jwt_token
```

Notes:
- Production must set `NODE_ENV=production`, secure `JWT_SECRET`, and a production `MONGODB_URI`.
- Email credentials are required for password recovery in production.

### Installation & Local Development (Web)
1) Install Node dependencies:
```
npm install
```
2) Start development server (Next.js + Socket.IO via custom server):
```
npm run dev
```
3) Build for production:
```
npm run build
```
This runs `build.js`, which:
- Ensures `jsconfig.json` alias `@/* -> src/*`
- Ensures `postcss.config.js` and Tailwind config
- Ensures `public/uploads/rids` exists (also handled by `next.config.js`)
- Calls `npx next build`

4) Start production server locally:
```
npm start
```

### Database
- Default local URI: `mongodb://localhost:27017/afp_personnel_db`
- Used via Mongoose in `src/lib/mongodb.ts`, `src/utils/dbConnect.ts` and via `mongoose.connection.db` in some API routes.
- GridFS is set up in `src/lib/gridfs.ts` for policy files.

### Scripts (Selection)
Located in `src/scripts/` and `scripts/`:
- `node scripts/seedPolicies.js` — seeds policy data
- `node src/scripts/seed-trainings.js` — seeds trainings
- `node src/scripts/seed-training-completions.js` — seeds training completions
- `node scripts/update-personnel-status.js` — corrects personnel status, prunes unauthorized companies
- `node scripts/sync-companies.js` — triggers API to recalc stats (requires `API_TOKEN`)

Also see `src/scripts`, `scripts/README.md` for details.

### Realtime (Socket.IO)
- Server initialized in `server.js` via `initSocketServer(server)`
- Web client: `socket.io-client`
- Flutter client: `socket_io_client`

### Email (Password Recovery)
- Implemented with Nodemailer in `src/services/emailService.ts`
- Requires SMTP env vars above; has dev-mode fallbacks/logging

### Exports / PDFs
- Client: jspdf (+ autotable), html2canvas (e.g., profiles, trainings)
- Server: pdfkit, html-pdf-node, puppeteer for server-side generation
- Spreadsheets: xlsx

### Deployment
- Target: Render.com (see `docs/deployment_guide_render.md` and `render.yaml`)
- `next.config.js` ensures upload directories (`public/uploads/rids`) exist at boot
- Ensure env vars are set in provider dashboard (especially `MONGODB_URI`, `JWT_SECRET`, email vars)

### Conventions / Aliases
- Import alias: `@/*` → `src/*` (configured in `jsconfig.json` by build script)
- App Router: pages under `src/app`, with API routes in `src/app/api/*/route.ts`

### Security & Production Notes
- Do not commit secrets; set all secrets as env vars in deployment
- Cookies for auth are `httpOnly` and `secure` in production
- Lock down CORS/origins at the proxy/load balancer as needed

### Flutter App Quick Start
```
cd armed_forces_app
flutter pub get
flutter run -d chrome   # for web
flutter run             # for mobile (choose device)
```
Configure its MongoDB connection/URLs in code as needed (see `armed_forces_app/lib/core/config/mongodb_config.dart`).

### Troubleshooting
- If build fails due to missing configs, run `npm run build` once to auto-generate configs via `build.js`
- Ensure MongoDB is reachable; check `src/app/api/db-status/route.ts` in dev to verify connection
- For email, verify SMTP credentials and network egress; test via `src/app/api/test-email/route.ts`

### Contact Points in Code
- DB connection: `src/lib/mongodb.ts`, `src/utils/dbConnect.ts`
- Auth/JWT: `src/lib/auth.ts`, `src/app/api/auth/*`
- Sockets: `src/utils/socket` (initialized in `server.js`)
- PDFs/Exports: `src/utils/exportUtils.ts`, `src/app/*` pages that import jspdf/pdfkit
- Maintenance scripts: `src/scripts/` and `scripts/`

This document should be kept up to date as dependencies or structure change.


