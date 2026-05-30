# Sport Hub - Premium Sports Venue Booking Platform

Sport Hub is a high-performance, full-stack sports venue booking ecosystem designed to bridge the gap between sports enthusiasts, venue owners, and administrators. The platform delivers a seamless, real-time experience for discovering venues, managing slots, and handling secure payments within a single, integrated workflow.

---

## 🚀 Resume-Ready Summary

*   **Architected a dual-application ecosystem** (Next.js 15 & Express.js) supporting three distinct user roles: Customers, Field Owners, and Administrators.
*   **Engineered a Real-Time Synchronization Engine** using Socket.IO to eliminate double-booking conflicts and provide live status updates across the platform.
*   **Integrated a Robust Payment Lifecycle** featuring dynamic PromptPay QR generation, automated slip verification workflows, and Excel-based financial reporting.
*   **Refactored to a Service-Oriented Architecture (SOA)** on the backend and a **Composition-based Component Pattern** on the frontend, reducing technical debt and improving maintainability.
*   **Implemented Enterprise-Grade Security & Performance** including JWT via HTTP-only cookies, OTP email verification (Brevo API), multi-layered rate limiting, and Redis caching.

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Client_Layer [Frontend - Next.js 15]
        UI[React 19 Components]
        Context[Socket & Notification Contexts]
        ClientAPI[Fetch-based API Client]
    end

    subgraph API_Layer [Backend - Node.js/Express]
        Auth[JWT & OTP Service]
        Booking[Booking & Payment Logic]
        Notify[Real-Time & Email Notifications]
        Stats[XLSX Export & Analytics]
        Cache[Redis Caching]
    end

    subgraph Data_Layer [Infrastructure]
        DB[(PostgreSQL)]
        Cloud[Cloudinary Media]
        Email[Brevo API]
        Maps[Longdo Map API]
        Redis[(Redis Cache)]
    end

    UI --> Context
    Context --> ClientAPI
    ClientAPI --> Auth
    ClientAPI --> Booking
    Booking --> DB
    Booking --> Cloud
    Booking --> Email
    Booking --> Notify
    Booking --> Cache
    Cache --> Redis
    Notify --> Context
```

---

## 🌟 Key Features & Persona Flows

### 👤 Customer Experience
*   **Discovery Engine:** Intelligent search by category, sport type, location (Longdo Map), and venue status.
*   **Real-Time Booking:** Calendar-based slot selection with millisecond-accurate availability updates via Socket.IO.
*   **Secure Payment:** Multi-method payment support (Deposit/Full) with automated QR generation and slip upload tracking.
*   **Engagement:** Follow venues, receive live announcements, and provide verified reviews post-booking.

### 🏟️ Field Owner Management
*   **Venue Onboarding:** Comprehensive registration flow including GPS tagging, document verification, and bank setup.
*   **Dynamic Inventory:** Manage multiple sub-fields with granular control over pricing, surface types, and player limits.
*   **Operational Dashboard:** Real-time monitoring of bookings with one-click approval/rejection and verification flows.
*   **Business Intelligence:** Advanced statistics dashboard with date-range filtering and `.xlsx` export for accounting.

### 🔑 Administrator Control
*   **User Governance:** Centralized management of user roles, profiles, and account status.
*   **Venue Moderation:** Multi-stage approval process for new venue registrations to ensure quality.
*   **Platform Configuration:** Manage global sport types and system-wide announcements.

---

## 🛠️ Tech Stack & Implementation Details

### Frontend (Next.js 15 App Router)
*   **React 19:** Utilizing the latest hooks and Concurrent Mode features for a fluid UI.
*   **Tailwind CSS:** Custom design system built for responsiveness and "Premium" aesthetics.
*   **State Management:** Context API for global Socket.IO connections and Toast notifications.
*   **Integrations:** 
    *   `Socket.IO Client` for bidirectional event handling.
    *   `TinyMCE` for rich-text venue announcements.
    *   `Longdo Map API` for sophisticated geospatial features.

### Backend (Node.js / Express)
*   **PostgreSQL:** Relational data modeling for complex booking relationships.
*   **Controller-Service Pattern:** Business logic is decoupled from HTTP concerns for high testability.
*   **Redis Caching:** High-performance caching layer powered by `ioredis` for fast data retrieval.
*   **Security Stack:** 
    *   `jsonwebtoken` for stateless auth.
    *   `express-rate-limit` to prevent brute-force attacks.
    *   `multer-storage-cloudinary` for secure media handling.
*   **Cron Jobs:** Automated cleanup of expired booking slots and reminders.

---

## 📂 Project Structure

```text
sport-hub/
├── frontend/               # Next.js 15 Application
│   ├── src/
│   │   ├── app/           # App Router (Shared, Dashboard, Auth Route Groups)
│   │   │   ├── contexts/  # React Contexts (Auth, Socket, Notification)
│   │   │   ├── css/       # Custom CSS modules for styling
│   │   │   ├── hooks/     # Custom hooks for fetching and socket events
│   │   │   └── utils/     # format.js
│   │   ├── components/    # Decomposed UI Components (Field, Admin, Search, etc.)
│   │   ├── constants/     # status.js (system statuses & roles)
│   │   └── lib/           # apiClient.js (Fetch API Client), socket.js
├── backend/                # Express.js API
│   ├── controllers/       # Request handling logic
│   ├── services/          # Core business logic (Service Layer)
│   ├── api/               # Route definitions
│   ├── middlewares/       # Auth, Role-check, Validation, Rate-limit
│   ├── config/            # Database, Cloudinary, and Redis configurations
│   ├── utils/             # Helpers (OTP, QR, XLSX, Email)
│   └── cron/              # Scheduled tasks
```

---

## 🔐 Security & Reliability
1.  **JWT via HTTP-only Cookies:** Protects against XSS attacks by keeping tokens out of JavaScript reach.
2.  **OTP Verification:** Ensures valid user identity via Brevo-powered email verification.
3.  **Slot Locking Mechanism:** Real-time socket events prevent "Race Conditions" where two users attempt to book the same slot simultaneously.
4.  **Slip Validation Flow:** Multi-step verification where owners manually approve payments after automated slip receipt.

---

## 🛠️ Local Setup

### 1. Prerequisites
*   Node.js (v18+)
*   PostgreSQL
*   Cloudinary Account
*   Brevo API Key
*   Redis Instance (e.g., Upstash)

### 2. Installation
```bash
# Clone the repository
git clone <your-repository-url>
cd sport-hub

# Setup Backend
cd backend
npm install

# Setup Frontend
cd ../frontend
npm install
```

### 3. Environment Configuration
Create `.env` files in both directories.

**`backend/.env`**
```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/sport_hub
JWT_SECRET=your_super_secret_key
BREVO_API_KEY=your_brevo_api_key
SENDER_EMAIL=noreply@sporthub.com
SENDER_NAME="Sport Hub"
FONT_END_URL=http://localhost:3000
CLOUND_NAME=your_cloudinary_name
CLOUND_API_KEY=your_cloudinary_key
CLOUND_API_SECRET=your_cloudinary_secret
REDIS_URL=redis://:password@host:port
```

**`frontend/.env`**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_LONGDO_KEY=your_longdo_key
NEXT_PUBLIC_TINYMCE_KEY=your_tinymce_key
```

### 4. Running the Application
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd frontend
npm run dev
```

---

## 📄 AI Onboarding

For detailed AI agent onboarding guidelines, database schema, entity-relationship descriptions, API routes, and code styling rules, please refer to the onboarding document: [agent.md](file:///C:/D/sport/sport-hub/agent.md).

---

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
