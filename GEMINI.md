# Sport Hub - Agent Instructions

Welcome to the Sport Hub project. This document serves as the primary context for AI agents working on this codebase.

## Project Overview

Sport Hub is a full-stack sports venue booking platform. It caters to three main user roles:

1.  **Customers:** Browse, search, and book sports venues, pay via PromptPay, and leave reviews.
2.  **Field Owners:** Register venues, manage sub-fields, facilities, and bookings, and view statistics.
3.  **Administrators:** Manage users, approve field registrations, and maintain sport types.

## Architecture

The project is structured as a monorepo with two main applications:

- `backend/`: Node.js/Express API server using PostgreSQL.
- `frontend/`: Next.js 15 application using React 19.

### Backend Structure (`backend/`)

- `server.js`: Entry point of the Express application.
- `db.js`: Database connection and configuration (PostgreSQL).
- `api/`: Contains route handlers for various features:
  - `auth.js`, `login.js`, `logout.js`, `register.js`: Authentication and session management.
  - `booking.js`: Core booking logic, payment processing, and notifications.
  - `field.js`, `my-field.js`: Venue and field management.
  - `statistics.js`: Analytics and Excel report generation.
- `middlewares/`: Express middlewares, notably `auth.js` for JWT verification.

### Frontend Structure (`frontend/`)

- `src/app/`: Next.js App Router structure.
  - `(admin)/`, `(auth)/`, `(dashboard)/`, `(shared)/`: Route groups for different user flows.
  - `components/`: Reusable React components.
  - `contexts/`: React Context providers (e.g., `AuthContext.js`).
  - `css/`: Custom CSS modules for styling.
- `public/`: Static assets including images.

## Tech Stack

### Backend

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (via `pg`)
- **Real-time:** Socket.IO
- **Auth:** JWT (stored in HTTP-only cookies)
- **Storage:** Cloudinary (via `multer` and `multer-storage-cloudinary`)
- **Email:** Brevo HTTP API (via `@getbrevo/brevo`)
- **Payments:** PromptPay QR (via `promptpay-qr` and `qrcode`)

### Frontend

- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 19
- **Styling:** CSS
- **Maps:** Longdo Map API
- **Editor:** TinyMCE
- **Date Handling:** Day.js

## Development Guidelines

### 🚀 Recent Improvements & Refactoring (May 2026)

The project has undergone significant refactoring to improve maintainability and performance:

- **API Centralization:** All frontend API calls are now routed through `@/lib/apiClient.js` for consistent error handling and authentication.
- **State Management Consolidation:**
  - `NotificationContext`: Centralized toast notifications (`useNotification`).
  - `SocketContext`: Global Socket.io connection provider (`useSocket`).
- **Component Refactoring:** Massive monolithic components like `RegisterFieldForm`, `edit-field/page.jsx`, and `booking-detail/page.jsx` have been decomposed into smaller, domain-focused sub-components.
- **UI Enhancements:**
  - **Premium Header UI:** Booking details now feature a modern, responsive header with prominent field info and status badges.
  - **Payment Flow:** Improved dual-approval flow (Approve Only vs. Approve & Verify) for field owners.
- **Type Safety & Constants:** Magic strings for statuses and roles have been moved to `src/constants/status.js` (Frontend) and `backend/utils/constants.js` (Backend).

### Contextual Precedence

- Always check for `GEMINI.md` files in subdirectories for more specific instructions.
- Follow existing patterns for API responses and frontend component structure.

### Environment Variables

Both `backend/` and `frontend/` require `.env` files. Refer to their respective `.env.example` files for required keys.

### Authentication

- JWT is used for authentication.
- Frontend handles auth state via `AuthContext`.
- Backend uses `auth.js` middleware to protect routes.

### Real-time Features

- Socket.IO is used for real-time notifications (bookings, field approvals, etc.) and slot availability updates.

### Code Style

- Maintain consistency with existing JavaScript/JSX formatting.
- Use Tailwind CSS for utility-first styling, but refer to custom CSS in `frontend/src/app/css/` for complex layouts.

## Common Tasks

- **Adding a New API Route:** Place the logic in `backend/api/` and register it in `backend/server.js`.
- **Creating a New Page:** Add a new directory and `page.jsx` within the appropriate route group in `frontend/src/app/`.
- **Updating Styles:** Prefer utility classes in Tailwind, or update/add a CSS file in `frontend/src/app/css/`.

## Important Links

- Backend API: `http://localhost:5000`
- Frontend Dev Server: `http://localhost:3000`
