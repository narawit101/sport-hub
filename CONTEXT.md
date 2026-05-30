# Project Context: Sport Hub

This document serves as the single source of truth (SSOT) for the architecture, technology stack, folder structure, coding guidelines, legacy quirks, and workflows of the **Sport Hub** platform. All developers and AI agents must read and strictly adhere to this context when working on the codebase.

---

## 1. Executive Summary & Core Purpose

### Business Logic & Purpose
Sport Hub is a premium, full-stack sports venue booking platform designed to bridge the gap between sports enthusiasts, venue owners, and platform administrators. The core operations revolve around:
- **Venue and Court Management:** Onboarding venues and individual courts (sub-fields), managing facility lists, and defining rental add-ons.
- **Real-Time Booking & Reservation:** Calendar-based slot allocation with automated session locking to prevent double bookings.
- **Payment Verification Lifecycle:** Dynamic PromptPay QR code generation, deposit/full checkout tracking, and manual payment slip approval workflows.
- **Announcements & Announcements Feed:** Announcing venue-specific news and managing user notifications.
- **Data Synchronization & Analytics:** Syncing external soccer matches/news data and generating detailed financial reports.

### Target Personas
1. **Customers:** Search for venues by location, sport, or availability; follow fields; place slot bookings; upload payment slips; and leave reviews.
2. **Field Owners:** Register and manage sports venues, configure courts, approve or reject bookings, view revenue metrics, and export spreadsheet statements.
3. **Administrators:** Review and approve field registrations, regulate global sports categories, monitor users, and publish system announcements.

### Operational Status
- **Active Modernization:** The codebase has been refactored (May 2026) to transition from monolithic frontend layouts and Axios dependencies to modular React components, a unified Fetch-based API client, Socket-driven notification contexts, and Redis-backed caching strategies.

---

## 2. Technical Stack & Environment Matrix

### Core Languages & Runtimes
- **Runtime Environment:** Node.js (v18+)
- **Programming Languages:** JavaScript (ES6+ in Node.js, ESNext/JSX in Next.js)

### Primary Frameworks & Major Libraries
#### Backend (`backend/package.json`)
- **Express.js (v4.21.2):** Web application framework handling API routes.
- **pg (v8.14.0):** PostgreSQL client wrapper utilizing connection pooling.
- **ioredis (v5.6.1):** Redis client library used for high-performance caching.
- **Socket.IO (v4.8.1):** Server for real-time slot synchronization and alerts.
- **Cloudinary (v1.41.3) & Multer (v1.4.5-lts.1):** Media upload engine and middleware processing image/document payloads.
- **@getbrevo/brevo (v5.0.4) & Nodemailer (v6.9.0):** Email services handling OTP logins and booking receipts.
- **PromptPay-QR (v0.5.0) & QRCode (v1.5.4):** Dynamic payment QR generation.
- **xlsx (v0.18.5):** Generating and downloading spreadsheets.
- **Luxon (v3.6.1):** Reliable date-time operations centered on `Asia/Bangkok`.

#### Frontend (`frontend/package.json`)
- **Next.js (v16.2.6) App Router:** Modern React framework utilizing route groupings.
- **React (v19.0.0) & React-DOM (v19.0.0):** UI rendering engine using Concurrent Mode hooks.
- **Tailwind CSS (v3.4.17):** Utility-first styling supplemented by custom CSS design systems.
- **Socket.IO-Client (v4.8.1):** Bidirectional event client.
- **TinyMCE React (v6.3.0):** Rich text editor integration for news announcements.
- **Day.js (v1.11.13):** Client-side date utilities.
- **React-Calendar (v5.1.0):** Booking calendar dashboard module.
- **FontAwesome (v6.7.2/7.2.0):** Icon packages.

### Database, Caching & Integration Matrix
1. **PostgreSQL (v14+):** Relational storage mapping users, venues, fields, bookings, reviews, and notifications.
2. **Upstash Redis Caching:** Configured via `REDIS_URL` in `backend/config/cache.js`. Implements a two-tier mechanism that falls back gracefully to a standard in-memory JS Map in local environments.
3. **Longdo Map API:** Handles geolocation indexing, geospatial mapping, and client-side venue searches.
4. **FotMob API Integration:** Localized proxies (`backend/api/fotmob.js`) feeding matches, standings, leagues, and news, translated into Thai via a country-resolver dictionary (`backend/utils/fotmobCountryResolver.js`).

---

## 3. High-Level Architecture & Design Patterns

### Monorepo Layout
The project operates as a separated client-server codebase:
```
sport-hub/
├── backend/   # REST API server (Node.js/Express)
└── frontend/  # User Interface (Next.js 15/16 App Router)
```

### Backend Design Patterns (Controller-Service-Route)
- **Routing Layer (`backend/api/`):** Defines the endpoints, sets up payload upload configurations, registers rate limiters, and maps middlewares (JWT check, authorization).
- **Controller Layer (`backend/controllers/`):** Receives client parameters, performs minor payload transformations, calls services, catches exceptions, and returns HTTP responses.
- **Service Layer (`backend/services/`):** Enforces core business workflows, coordinates database transactions, triggers notifications, and writes caching records.
- **Cache-Aside Pattern:** Standard retrieval sequence: checks Redis cache -> hits PostgreSQL database upon miss -> sets Redis cache (5 minutes standard TTL) -> returns database result. Write/update operations invalidate target keys.
- **Event-Driven Architecture (Socket.IO):** Event channels automatically notify users about slot updates, announcements, payment confirmations, and document checks.

### Frontend Design Patterns
- **React App Router Groups:** Uses route groupings to segregate dashboard contexts:
  - `(auth)/`: Authentication gates (Login, OTP, Password resets).
  - `(dashboard)/`: Field owner management workspace.
  - `(admin)/`: Administrator system controls.
  - `(shared)/`: Public pages (Search details, reviews, homepage).
- **Centralized API Client (`frontend/src/lib/apiClient.js`):** Standardizes backend HTTP calls, appends local storage authorization tokens (`auth_token`), and automatically intercepts 401 unauthenticated errors to redirect users to `/login`.
- **Global Context Providers:**
  - `AuthContext`: Tracks user session details, validation status, and handles sign-in/out.
  - `NotificationContext`: Serves alert toasts across the platform.
  - `SocketContext`: Maintains the server Socket connection.

---

## 4. Comprehensive Folder & Directory Map

```text
sport-hub/
├── backend/                       # Node.js Express Backend
│   ├── api/                       # API route declarations & controller mappings
│   ├── config/                    # Configurations (db.js, cache.js, cloudinary.js)
│   ├── controllers/               # Controllers parsing inputs & returning JSON
│   ├── cron/                      # Background task scheduler (bookingCron.js)
│   ├── middlewares/               # Express filters (auth.js, rate limiters)
│   ├── services/                  # Transaction logic & database write executions
│   │   ├── bookingService.js
│   │   └── fieldService.js
│   ├── store/                     # Schema definition and database seed datasets
│   │   ├── schema.sql             # SSOT for Postgres tables, indexes, and constraints
│   │   └── seed.sql               # Seeding script for test roles and master data
│   ├── utils/                     # Common helpers (email, OTP, QR, Excel, translations)
│   └── server.js                  # App Entrypoint (WebSockets & route registries)
│
├── frontend/                      # Next.js Frontend App
│   ├── src/
│   │   ├── app/                   # App Router Directory
│   │   │   ├── (admin)/           # Admin Console views
│   │   │   ├── (auth)/            # Auth views (Login, Verify OTP, Register)
│   │   │   ├── (dashboard)/       # Venue Owner Panel views
│   │   │   ├── (shared)/          # Public views (Details, reviews, main list)
│   │   │   ├── contexts/          # Context handlers (Auth, notification toast, sockets)
│   │   │   ├── css/               # Styling layout stylesheets & custom CSS overrides
│   │   │   ├── hooks/             # Specialized custom React hook abstractions
│   │   │   ├── utils/             # Formatters (format.js)
│   │   │   ├── layout.jsx         # App wrap container
│   │   │   └── page.jsx           # App entry page
│   │   ├── components/            # Isolated visual UI items & decomposed inputs
│   │   ├── constants/             # Unified status configs (status.js)
│   │   └── lib/                   # apiClient.js, socket.js
│   ├── public/                    # Static image/media assets
│   ├── tailwind.config.mjs        # Tailwind layout system setup
│   └── package.json               # Frontend dependencies list
```

---

## 5. Coding Standards, Styling, and Conventions

### Naming Conventions
- **Files & Components:** PascalCase for React UI components (e.g., `RegisterFieldForm.jsx`); kebab-case or standard lowercase for routing folders.
- **Variables & Functions:** camelCase for client scripts, standard function definitions, and constants.
- **Database Variables:** `snake_case` is strictly enforced to map directly to PostgreSQL properties (e.g., `user_id`, `sub_field_name`, `booking_date`). Ensure clean translation between camelCase logic and snake_case models.

### State & Side Effects
- Global contexts must be leveraged via designated hooks:
  - Sockets: `const socket = useSocket();`
  - Toasts: `const { showNotification } = useNotification();`
  - Authorization: `const { user, login, logout } = useAuth();`
- Hook implementations must clean up event listeners to prevent client-side leakages.

### Styling & CSS Pattern
- Use **Tailwind CSS** for responsive layout structure and layouts.
- Custom styled overrides must use tokens defined in `frontend/src/app/css/` to preserve a premium visual feel:
  - `--text-color` (`#03045e` - primary navy)
  - `--secondary-bg` (`#f8f9fa`)
  - `--border-color` (`#e9ecef`)
  - `--border-radius` (`16px`)
  - `--shadow` (smooth, premium elevation drop-shadow)

### Error Handling & Logging
- **Backend:** Wrap database interactions and service layers inside try-catch patterns. Log raw stack traces on the server (`console.error`), and respond with user-friendly warnings (`res.status(500).json({ success: false, message: error.message })`).
- **Frontend:** Always capture API errors through `apiClient` requests inside try-catch blocks. Display descriptive error toasts using `NotificationContext` rather than silent console printouts.

---

## 6. Legacy Quirks, Technical Debt, and Strict Constraints (⚠️ CRITICAL)

### Core Safeguards ("Do Not Touch")
- **`backend/middlewares/auth.js`:** The authentication interceptor resolves user roles by pulling from Redis. Any modifications to verification sequences or fallback routines can lock users out or expose role authorizations.
- **`backend/config/cache.js`:** Ensures local environments function without a Redis instance by proxying cache calls through standard in-memory maps. Ensure any changes maintain this fall-back fallback compatibility.
- **`frontend/src/lib/apiClient.js`:** All server communication passes through this wrapper. Do not introduce Axios, custom `fetch`, or manual header insertions in components.

### Legacy Constraints & Technical Debt
- **Missing Test Suite:** The codebase does not contain automated unit or integration tests (the `"test"` command in `package.json` simply echoes a placeholder error). Manual testing or detailed integration validation is required.
- **Broken `db:init` Hook:** The `npm run db:init` command references `db-init.js` which is absent from the repository. All database configuration must be initiated manually by executing `schema.sql` and `seed.sql`.
- **Global Timer References:** The real-time synchronization ticker (`booking.js`) binds a single tick loop to `global.__serverTimeTicker`. Do not overwrite this handle directly, as it can cause duplicate ticks or resource exhaustion.
- **Magic Strings:** Magic strings for roles or booking statuses must not be hardcoded. Always use standard references from `src/constants/status.js` (client) and `backend/utils/constants.js` (server).

---

## 7. Typical Workflows & Common Tasks

### 7.1. Adding a New Backend Route & Service
1. **Schema Check:** If schema edits are necessary, append them to `backend/store/schema.sql`.
2. **Service Definition:** Add the data query operation inside `backend/services/<name>Service.js` using parameterized bindings to prevent SQL injections:
   ```javascript
   const result = await pool.query('SELECT * FROM my_table WHERE user_id = $1', [userId]);
   ```
3. **Controller Mapping:** Create matching actions inside `backend/controllers/<name>Controller.js` to extract request variables, delegate calculations to services, and send JSON responses.
4. **Endpoint Registration:** Add the route to `backend/api/<name>.js`, register middlewares, and configure endpoints. Export the routing logic and hook it into `backend/server.js`:
   ```javascript
   const myRoute = require("./api/my-route");
   app.use("/my-route", myRoute);
   ```

### 7.2. Adding a New Frontend Page & Component
1. **Determine Route Group:** Assign the page to the appropriate App Router directory under `frontend/src/app/` (e.g., `(shared)/my-page/page.jsx` or `(dashboard)/my-settings/page.jsx`).
2. **Decompose Views:** Isolate complex input logic or structural panels into individual React files inside `frontend/src/components/<domain>/`.
3. **API Communications:** Import `apiClient` to request data from endpoints:
   ```javascript
   import apiClient from "@/lib/apiClient";
   const data = await apiClient.get("/my-route");
   ```
4. **Trigger Notifications:** Invoke notifications to handle operations:
   ```javascript
   const { showNotification } = useNotification();
   showNotification("บันทึกข้อมูลเรียบร้อยแล้ว", "success");
   ```

### 7.3. Running the System Locally
- **Step 1:** Configure matching values in `backend/.env` and `frontend/.env` based on their respective `.env.example` templates.
- **Step 2:** Start the Backend server:
  ```bash
  cd backend
  npm run dev
  ```
- **Step 3:** Start the Frontend server:
  ```bash
  cd frontend
  npm run dev
  ```
