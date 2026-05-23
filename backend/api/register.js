const express = require("express");
const pool = require("../config/db");
const bcrypt = require("bcrypt");
const router = express.Router();
const { sendEmail } = require("../utils/email");
const { otpVerification } = require("../utils/emailTemplates");
const { generateNumericOtp } = require("../utils/otp");
const { createRateLimiter } = require("../utils/rateLimiter");
const { invalidateCache } = require("../config/cache");

const LimiterRegister = createRateLimiter({
  windowMs: 30 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.ip,
  message: "คุณส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง",
});

router.get("/check-duplicate", async (req, res) => {
  const { field, value } = req.query;

  if (!field || !value) {
    return res.status(400).json({ message: "Field and value are required" });
  }

  // Whitelist allowed fields to prevent SQL injection
  const allowedFields = ["email", "user_name"];
  if (!allowedFields.includes(field)) {
    return res.status(400).json({ message: "Invalid field" });
  }

  try {
    const query = `SELECT 1 FROM users WHERE ${field} = $1 LIMIT 1`;
    const result = await pool.query(query, [value]);

    if (result.rows.length > 0) {
      return res.status(200).json({ isDuplicate: true });
    } else {
      return res.status(200).json({ isDuplicate: false });
    }
  } catch (error) {
    console.error("Error checking duplicates:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});


router.post("/", LimiterRegister, async (req, res) => {
  const { first_name, last_name, email, password, role, user_name } = req.body;


  try {
    const emailCheck = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR user_name = $2",
      [email, user_name]
    );
    if (emailCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Email or Username already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateNumericOtp(6);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    const result = await pool.query(
      "INSERT INTO users (first_name, last_name, email, password, role, user_name, verification, status, otp_expiry) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [
        first_name,
        last_name,
        email,
        hashedPassword,
        role,
        user_name,
        otp,
        "รอยืนยัน",
        otpExpiry,
      ]
    );

    try {
      await sendEmail({
        to: email,
        subject: "ยืนยันการลงทะเบียน",
        html: otpVerification(otp),
      });
      console.log("อีเมลส่งสำเร็จ");
    } catch (error) {
      console.log("ส่งอีเมลไม่สำเร็จ:", error);
      try {
        await pool.query("DELETE FROM users WHERE user_id = $1", [result.rows[0].user_id]);
        console.log("ลบข้อมูลผู้ใช้ออกจากฐานข้อมูลสำเร็จหลังส่งอีเมลล้มเหลว");
      } catch (dbErr) {
        console.error("ไม่สามารถลบข้อมูลผู้ใช้ออกจากฐานข้อมูลได้:", dbErr);
      }
      return res
        .status(500)
        .json({ error: "ไม่สามารถส่งอีเมลได้", details: error.message });
    }

    console.log("User registered successfully:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/verify/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const { otp } = req.body;

  console.log("user_id", user_id, "OTP", otp);
  try {
    const userData = await pool.query(
      "SELECT * FROM users WHERE user_id = $1",
      [user_id]
    );

    if (userData.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    }

    const checkOtp = userData.rows[0].verification;
    const otpExpiry = userData.rows[0].otp_expiry;

    if (new Date() > new Date(otpExpiry)) {
      return res.status(400).json({ message: "OTP หมดอายุ" });
    }

    if (checkOtp === otp) {
      await pool.query("UPDATE users SET status = $1 WHERE user_id = $2", [
        "ตรวจสอบแล้ว",
        user_id,
      ]);
      await invalidateCache(`user:profile:${user_id}`, "users:all");
      return res.status(200).json({ message: "ยืนยันสำเร็จ" });
    } else {
      return res.status(400).json({ message: "OTP ไม่ถูกต้อง" });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ message: "ไม่สามารถยืนยันได้" });
  }
});

router.put("/new-otp/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const { email } = req.body;
    const otp = generateNumericOtp(6);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    const result = await pool.query(
      `UPDATE users SET verification = $1, otp_expiry = $2 WHERE user_id = $3 RETURNING verification`,
      [otp, otpExpiry, user_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
    }

    const newOtp = result.rows[0].verification;

    try {
      await sendEmail({
        to: email,
        subject: "ยืนยันการลงทะเบียน",
        html: otpVerification(newOtp),
      });
      console.log("อีเมลส่งสำเร็จ");
      return res
        .status(200)
        .json({ message: "ส่ง OTP ใหม่สำเร็จ" });
    } catch (error) {
      console.log("ส่งอีเมลไม่สำเร็จ:", error);
      return res.status(500).json({ error: "ไม่สามารถส่งอีเมลได้" });
    }
  } catch (error) {
    console.error("Error requesting OTP:", error);
    return res
      .status(500)
      .json({ message: "ไม่สามารถส่ง OTP ใหม่ได้", error: error.message });
  }
});



module.exports = router;
