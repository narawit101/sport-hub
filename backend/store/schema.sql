-- ============================================================
-- Sport Hub — Database Schema Migration
-- Generated from codebase analysis (2026-05-23)
-- Target: PostgreSQL 14+ (Supabase compatible)
-- ============================================================

-- Required extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- fuzzy search (search.js)

-- ============================================================
-- 1. users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  user_id       SERIAL PRIMARY KEY,
  user_name     VARCHAR(100) UNIQUE NOT NULL,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password      TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'customer'
                CHECK (role IN ('customer', 'field_owner', 'admin')),
  status        VARCHAR(50) DEFAULT 'รอยืนยัน',
  verification  VARCHAR(20),
  otp_expiry    TIMESTAMPTZ,
  user_profile  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_user_name ON users (user_name);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- ============================================================
-- 2. password_reset
-- ============================================================
CREATE TABLE IF NOT EXISTS password_reset (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token       VARCHAR(20) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset (user_id);

-- ============================================================
-- 3. sports_types
-- ============================================================
CREATE TABLE IF NOT EXISTS sports_types (
  sport_id    SERIAL PRIMARY KEY,
  sport_name  VARCHAR(100) UNIQUE NOT NULL
);

-- ============================================================
-- 4. facilities (master list)
-- ============================================================
CREATE TABLE IF NOT EXISTS facilities (
  fac_id    SERIAL PRIMARY KEY,
  fac_name  VARCHAR(200) UNIQUE NOT NULL
);

-- ============================================================
-- 5. field
-- ============================================================
CREATE TABLE IF NOT EXISTS field (
  field_id          SERIAL PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  field_name        VARCHAR(200) NOT NULL,
  address           TEXT,
  gps_location      TEXT,
  open_hours        VARCHAR(10),
  close_hours       VARCHAR(10),
  number_bank       VARCHAR(50),
  account_holder    VARCHAR(200),
  price_deposit     NUMERIC(10,2) DEFAULT 0,
  name_bank         VARCHAR(100),
  documents         TEXT,
  img_field         TEXT,
  status            VARCHAR(50) DEFAULT 'รอตรวจสอบ',
  open_days         TEXT[],
  field_description TEXT,
  cancel_hours      INTEGER DEFAULT 0,
  slot_duration     VARCHAR(20)
);

CREATE INDEX IF NOT EXISTS idx_field_user ON field (user_id);
CREATE INDEX IF NOT EXISTS idx_field_status ON field (status);
CREATE INDEX IF NOT EXISTS idx_field_name_trgm ON field USING gin (field_name gin_trgm_ops);

-- ============================================================
-- 6. sub_field
-- ============================================================
CREATE TABLE IF NOT EXISTS sub_field (
  sub_field_id    SERIAL PRIMARY KEY,
  field_id        INTEGER NOT NULL REFERENCES field(field_id) ON DELETE CASCADE,
  sub_field_name  VARCHAR(200) NOT NULL,
  price           NUMERIC(10,2) DEFAULT 0,
  sport_id        INTEGER REFERENCES sports_types(sport_id) ON DELETE SET NULL,
  user_id         INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  wid_field       NUMERIC(10,2) DEFAULT 0,
  length_field    NUMERIC(10,2) DEFAULT 0,
  players_per_team INTEGER DEFAULT 0,
  field_surface   VARCHAR(100) DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_sub_field_field ON sub_field (field_id);
CREATE INDEX IF NOT EXISTS idx_sub_field_sport ON sub_field (sport_id);

-- ============================================================
-- 7. add_on
-- ============================================================
CREATE TABLE IF NOT EXISTS add_on (
  add_on_id     SERIAL PRIMARY KEY,
  sub_field_id  INTEGER NOT NULL REFERENCES sub_field(sub_field_id) ON DELETE CASCADE,
  content       TEXT,
  price         NUMERIC(10,2) DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_add_on_sub_field ON add_on (sub_field_id);

-- ============================================================
-- 8. field_facilities
-- ============================================================
CREATE TABLE IF NOT EXISTS field_facilities (
  field_fac_id    SERIAL PRIMARY KEY,
  field_id        INTEGER NOT NULL REFERENCES field(field_id) ON DELETE CASCADE,
  fac_name        VARCHAR(200) NOT NULL,
  fac_price       NUMERIC(10,2) DEFAULT 0,
  quantity_total  INTEGER DEFAULT 1,
  description     VARCHAR(300),
  image_path      TEXT
);

CREATE INDEX IF NOT EXISTS idx_field_facilities_field ON field_facilities (field_id);

-- ============================================================
-- 9. bookings
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  booking_id      SERIAL PRIMARY KEY,
  field_id        INTEGER NOT NULL REFERENCES field(field_id) ON DELETE CASCADE,
  user_id         INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  sub_field_id    INTEGER NOT NULL REFERENCES sub_field(sub_field_id) ON DELETE CASCADE,
  booking_date    DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  total_hours     NUMERIC(5,2),
  total_price     NUMERIC(10,2),
  pay_method      VARCHAR(50),
  total_remaining NUMERIC(10,2) DEFAULT 0,
  activity        VARCHAR(200),
  status          VARCHAR(20) DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected', 'complete', 'verified', 'cancelled')),
  start_date      DATE,
  end_date        DATE,
  selected_slots  TEXT[],
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_field ON bookings (field_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_sub_field ON bookings (sub_field_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings (booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_start_date ON bookings (start_date);

-- ============================================================
-- 10. booking_fac
-- ============================================================
CREATE TABLE IF NOT EXISTS booking_fac (
  booking_fac_id  SERIAL PRIMARY KEY,
  booking_id      INTEGER NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
  field_fac_id    INTEGER REFERENCES field_facilities(field_fac_id) ON DELETE SET NULL,
  fac_name        VARCHAR(200),
  quantity        INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_booking_fac_booking ON booking_fac (booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_fac_facility ON booking_fac (field_fac_id);

-- ============================================================
-- 11. payment
-- ============================================================
CREATE TABLE IF NOT EXISTS payment (
  payment_id    SERIAL PRIMARY KEY,
  booking_id    INTEGER NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
  deposit_slip  TEXT,
  total_slip    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_booking ON payment (booking_id);

-- ============================================================
-- 12. reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  reviews_id  SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  field_id    INTEGER NOT NULL REFERENCES field(field_id) ON DELETE CASCADE,
  booking_id  INTEGER REFERENCES bookings(booking_id) ON DELETE SET NULL,
  rating      NUMERIC(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_field ON reviews (field_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking ON reviews (booking_id);

-- ============================================================
-- 13. posts
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
  post_id     SERIAL PRIMARY KEY,
  title       VARCHAR(500) NOT NULL,
  content     TEXT,
  field_id    INTEGER NOT NULL REFERENCES field(field_id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_field ON posts (field_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts (created_at DESC);

-- ============================================================
-- 14. post_images
-- ============================================================
CREATE TABLE IF NOT EXISTS post_images (
  image_id    SERIAL PRIMARY KEY,
  post_id     INTEGER NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_post_images_post ON post_images (post_id);

-- ============================================================
-- 15. notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  notify_id   SERIAL PRIMARY KEY,
  sender_id   INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  recive_id   INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  topic       VARCHAR(100) NOT NULL,
  messages    TEXT,
  key_id      INTEGER,
  status      VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recive ON notifications (recive_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications (recive_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications (created_at DESC);

-- ============================================================
-- 16. following
-- ============================================================
CREATE TABLE IF NOT EXISTS following (
  user_id   INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  field_id  INTEGER NOT NULL REFERENCES field(field_id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, field_id)
);

CREATE INDEX IF NOT EXISTS idx_following_field ON following (field_id);
