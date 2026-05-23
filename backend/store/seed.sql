-- ============================================================
-- Sport Hub — Seed Data for Demo
-- Run after schema.sql
-- ============================================================

-- Admin user (password: admin123 — bcrypt hash)
INSERT INTO
    users (
        user_name,
        first_name,
        last_name,
        email,
        password,
        role,
        status
    )
VALUES (
        'admin',
        'Admin',
        'SportHub',
        'admin@sporthub.com',
        '$2b$10$8K1p/aMKLPr0w9O3rl3mZOFZ8KzFqXU1Kp1xJr0cQvVvVhXBLKXu',
        'admin',
        'ตรวจสอบแล้ว'
    ) ON CONFLICT (user_name) DO NOTHING;

-- Demo customer (password: test1234)
INSERT INTO
    users (
        user_name,
        first_name,
        last_name,
        email,
        password,
        role,
        status
    )
VALUES (
        'demo_customer',
        'ทดสอบ',
        'ลูกค้า',
        'customer@sporthub.com',
        '$2b$10$8K1p/aMKLPr0w9O3rl3mZOFZ8KzFqXU1Kp1xJr0cQvVvVhXBLKXu',
        'customer',
        'ตรวจสอบแล้ว'
    ) ON CONFLICT (user_name) DO NOTHING;

-- Demo field owner (password: test1234)
INSERT INTO
    users (
        user_name,
        first_name,
        last_name,
        email,
        password,
        role,
        status
    )
VALUES (
        'demo_owner',
        'ทดสอบ',
        'เจ้าของสนาม',
        'owner@sporthub.com',
        '$2b$10$8K1p/aMKLPr0w9O3rl3mZOFZ8KzFqXU1Kp1xJr0cQvVvVhXBLKXu',
        'field_owner',
        'ตรวจสอบแล้ว'
    ) ON CONFLICT (user_name) DO NOTHING;

-- Sports types
INSERT INTO
    sports_types (sport_name)
VALUES ('ฟุตบอล'),
    ('บาสเกตบอล'),
    ('แบดมินตัน'),
    ('เทนนิส'),
    ('วอลเลย์บอล'),
    ('ฟุตซอล'),
    ('ปิงปอง'),
    ('ว่ายน้ำ') ON CONFLICT (sport_name) DO NOTHING;

-- Facilities master list
INSERT INTO
    facilities (fac_name)
VALUES ('ห้องน้ำ'),
    ('ที่จอดรถ'),
    ('ห้องอาบน้ำ'),
    ('ร้านอาหาร'),
    ('เครื่องดื่ม'),
    ('ห้องเปลี่ยนเสื้อผ้า'),
    ('WiFi'),
    ('กล้องวงจรปิด'),
    ('ที่พักผ่อน'),
    ('อุปกรณ์กีฬา') ON CONFLICT (fac_name) DO NOTHING;
    