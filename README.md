# Sport Hub

Sport Hub is a full-stack sports venue booking platform designed for three user groups: customers, field owners, and administrators. The system supports venue discovery, real-time slot booking, online payment proof submission, owner-side operations, and admin moderation in one workflow.

## Resume-Ready Summary

- Built a full-stack sports venue booking platform with separate flows for customers, field owners, and admins.
- Implemented real-time booking updates, notifications, and content refresh using Socket.IO.
- Added a payment workflow with PromptPay QR generation, payment slip validation, email notifications, and booking analytics export to Excel.

## Key Features

### Customer Features

- Register and log in with JWT-based authentication stored in HTTP-only cookies
- Verify accounts with email OTP and reset passwords through email
- Browse sports venues by category, search keyword, sport type, and opening day
- View venue profiles, announcements, facilities, ratings, and reviews
- Follow favorite venues and receive real-time notifications
- Book time slots through a calendar-based flow with live slot availability
- Choose payment method, upload deposit or full-payment slips, and track booking status
- Leave reviews after completing a booking

### Field Owner Features

- Register sports venues with profile image, supporting documents, GPS location, bank info, and operating schedule
- Manage multiple sub-fields with sport type, pricing, dimensions, surface type, players per team, and add-ons
- Configure facilities, facility images, cancellation rules, slot duration, and deposit amount
- Create and manage venue announcements with image uploads
- Monitor incoming bookings in real time
- Approve, reject, verify, complete, or cancel bookings
- Track venue performance through booking statistics and export reports to `.xlsx`

### Admin Features

- Manage users with role-based filtering and profile updates
- Approve or reject field registration requests
- Manage sport types used across the platform

### Real-Time and Platform Features

- Real-time slot updates during booking to reduce double-booking conflicts
- Live notifications for bookings, field approval flow, new followers, and new posts
- Real-time refresh for home-page announcements and booking dashboards
- Automated email notifications for registration, booking updates, and field workflows
- Cloudinary-based media storage for venue images, post images, facilities, and payment slips

## Tech Stack

### Frontend

- Next.js 15
- React 19
- Tailwind CSS and custom stylesheet-based UI
- Socket.IO Client
- React Calendar
- TinyMCE
- Day.js
- Longdo Map API

### Backend

- Node.js
- Express.js
- PostgreSQL
- JWT authentication
- Socket.IO
- Multer + Cloudinary
- Nodemailer (Gmail SMTP)
- PromptPay QR + QRCode generation
- XLSX export
- Express Rate Limit

## Architecture

This repository is split into two applications:

- `frontend/` - Next.js application for the user interface
- `backend/` - Express API server with PostgreSQL integration

Core backend modules include:

- `api/register.js`, `api/login.js`, `api/users.js` for authentication and user management
- `api/field.js`, `api/my-field.js`, `api/facilities.js`, `api/sports-types.js` for field onboarding and venue management
- `api/booking.js` for booking, payment slips, QR generation, notifications, and scheduled reminders
- `api/posts.js`, `api/reviews.js`, `api/following.js`, `api/notification.js` for engagement and real-time activity
- `api/statistics.js` for owner analytics and Excel export

## Notable Integrations

- `Cloudinary` for image and document storage
- `Nodemailer (Gmail SMTP)` for transactional emails
- `Longdo Map` for location picking and map search
- `PromptPay QR` for Thai payment QR generation


## Local Setup

### 1. Clone and install dependencies

```bash
git clone <your-repository-url>
cd sport-hub

cd backend
npm install

cd ../frontend
- Nodemailer (Gmail SMTP) for transactional emails

...

### 2. Configure environment variables

Create `.env` files in both `backend/` and `frontend/`.

#### `backend/.env`

```env
NODE_ENV=development
DATABASE_URL=<your_postgresql_connection_string>
JWT_SECRET=<your_jwt_secret>
SMTP_USER=<your_gmail_address>
SMTP_PASS=<your_gmail_app_password>
SENDER_EMAIL=<from_address_shown_in_emails>
ADMIN_EMAIL=<admin_notification_email>
FONT_END_URL=http://localhost:3000
CLOUND_NAME=<your_cloudinary_name>
CLOUND_API_KEY=<your_cloudinary_api_key>
CLOUND_API_SECRET=<your_cloudinary_api_secret>
```

#### `frontend/.env`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_LONGDO_KEY=<your_longdo_key>
NEXT_PUBLIC_OMISE_PUBLIC_KEY=<your_omise_public_key>
NEXT_PUBLIC_TINYMCE_KEY=<your_tinymce_key>
```

### 3. Run the backend

```bash
cd backend
npm start
```

The API server runs on `http://localhost:5000`.

### 4. Run the frontend

```bash
cd frontend
npm run dev
```

The frontend runs on `http://localhost:3000`.

## Example User Flows

### Customer journey

1. Register and verify account by OTP email
2. Search or browse venues
3. Open a venue profile and select a sub-field
4. Choose a date, time slots, add-ons, and facilities
5. Upload a payment slip or use generated QR for payment
6. Track booking status and leave a review after completion

### Field owner journey

1. Submit a new field registration with documents and bank details
2. Wait for admin approval
3. Publish announcements and manage venue information
4. Review and update incoming booking requests
5. Monitor performance from the statistics dashboard and export reports

## Strengths of This Project

- Covers end-to-end product flows instead of only CRUD pages
- Includes role-based access control for customer, field owner, and admin
- Combines transactional features, media uploads, real-time communication, and analytics
- Shows practical integration work with payment, email, map, and cloud storage services

## Notes

- The repository currently contains separate `frontend` and `backend` apps.
- The frontend already has a default Next.js README, but this root README is intended to describe the full project.
- Some environment variables are referenced in code beyond the provided `.env.example` files, so the setup above reflects the actual runtime requirements in the repository.
