const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const cookieParser = require("cookie-parser");
const pool = require("../config/db");
const jwt = require("jsonwebtoken");
router.use(cookieParser());
const { createUploader } = require("../utils/upload");
const { deleteCloudinaryFile } = require("../utils/delete");
const { sendEmail } = require("../utils/email");
const { resetPasswordOtp, contactAdmin: contactAdminTemplate } = require("../utils/emailTemplates");
const { generateNumericOtp } = require("../utils/otp");
const { createRateLimiter } = require("../utils/rateLimiter");
const { getCache, setCache, invalidateCache } = require("../config/cache");

const upload = createUploader(
  { user_profile: "user-profile" },
  { maxFiles: 11 }
);



const LimiterRequestContact = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    try {
      return req.body.email?.toLowerCase().trim() || req.ip;
    } catch {
      return req.ip;
    }
  },
  message: "Email ของคุณส่งคำขอเกินกำหนด (5ครั้ง/ชั่วโมง) กรุณารอสักครู่แล้วลองใหม่อีกครั้ง",
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const cacheKey = `user:profile:${user_id}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const result = await pool.query(
      "SELECT user_id, user_name, first_name, last_name, email, role, status, created_at,user_profile FROM users WHERE user_id = $1",
      [user_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    }

    const user = result.rows[0];
    await setCache(cacheKey, user, 300); // cache for 5 minutes

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้" });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้!" });
    }

    const cacheKey = "users:all";
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const result =
      await pool.query(`SELECT user_id, user_name, first_name, last_name, email, role, status,user_profile
            FROM users
            ORDER BY 
            CASE role
              WHEN 'admin' THEN 1
              WHEN 'customer' THEN 2
              WHEN 'field_owner' THEN 3
            ELSE 4
            END,
            user_id DESC;
`);
    await setCache(cacheKey, result.rows, 300); // cache for 5 minutes
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching manager data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, role, status } = req.body;
  const currentUser = req.user;

  console.log("user_id ที่ส่งมา:", id);
  console.log(
    "user_id ใน Token:",
    currentUser.user_id,
    "Role:",
    currentUser.role
  );

  try {
    if (
      !currentUser.user_id ||
      (parseInt(id) !== currentUser.user_id && currentUser.role !== "admin")
    ) {
      return res.status(403).json({ message: "คุณไม่มีสิทธิ์แก้ไขข้อมูลนี้" });
    }

    await pool.query(
      "UPDATE users SET first_name = $1, last_name = $2, role = $3, status = $4 WHERE user_id = $5",
      [first_name, last_name, role, status, id]
    );
    const result = await pool.query(
      "SELECT user_id, user_name, first_name, last_name, email, role, status FROM users WHERE user_id = $1",
      [id]
    );

    if (req.io) {
      req.io.emit("updated_status", {
        userId: id,
        userRole: result.rows[0].role,
      });
      console.log("ส่งข้อมูลไปยังผู้ใช้ที่เกี่ยวข้อง:", id);
    } else {
      console.log("ไม่พบ req.io เพื่อส่งข้อมูลไปยังผู้ใช้");
    }
    console.log("role", result.rows[0].role);
    console.log("ข้อมูลอัปเดตสำเร็จ:", id);
    await invalidateCache(`user:profile:${id}`, "users:all");

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put(
  "/update-user-profile/:id",
  upload.fields([{ name: "user_profile", maxCount: 1 }]),
  authMiddleware,
  async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user;

    console.log("user_id ที่ส่งมา:", id);
    console.log("user_id ใน Token:", currentUser.user_id);
    console.log("Files received:", req.files);

    try {
      if (!currentUser.user_id || parseInt(id) !== currentUser.user_id) {
        return res
          .status(403)
          .json({ message: "คุณไม่มีสิทธิ์แก้ไขข้อมูลนี้" });
      }

      if (
        !req.files ||
        !req.files["user_profile"] ||
        req.files["user_profile"].length === 0
      ) {
        return res.status(400).json({ message: "กรุณาเลือกไฟล์รูปภาพ" });
      }

      const oldUserResult = await pool.query(
        "SELECT user_profile FROM users WHERE user_id = $1",
        [id]
      );

      const oldUserProfile = oldUserResult.rows[0]?.user_profile;

      const user_profile = req.files["user_profile"][0].path;
      console.log("Path ของรูปที่อัปโหลด:", user_profile);

      await pool.query(
        "UPDATE users SET user_profile = $1 WHERE user_id = $2",
        [user_profile, id]
      );

      if (oldUserProfile && oldUserProfile.includes("cloudinary.com")) {
        try {
          await deleteCloudinaryFile(oldUserProfile);
          console.log("ลบรูปเก่าสำเร็จ:", oldUserProfile);
        } catch (deleteError) {
          console.error("ไม่สามารถลบรูปเก่าได้:", deleteError);
        }
      }

      if (req.io) {
        req.io.emit("profile_updated", {
          userId: id,
          user_profile: user_profile,
        });
        console.log("ส่งข้อมูลรูปโปรไฟล์ไปยังผู้ใช้ที่เกี่ยวข้อง:", id);
      } else {
        console.log("ไม่พบ req.io เพื่อส่งข้อมูลไปยังผู้ใช้");
      }

      console.log("ข้อมูลอัปเดตสำเร็จ");
      await invalidateCache(`user:profile:${id}`, "users:all");

      res.status(200).json({
        message: "อัปโหลดรูปสำเร็จ",
        user_profile: user_profile,
      });
    } catch (error) {
      console.error("Error in update-user-profile:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "เกิดข้อผิดพลาดในการอัปโหลดรูป",
      });
    }
  }
);

router.put("/update-profile/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name } = req.body;
  const currentUser = req.user;

  console.log("user_id ที่ส่งมา:", id);
  console.log("user_id ใน Token:", currentUser.user_id);
  try {
    if (
      !currentUser.user_id ||
      (parseInt(id) !== currentUser.user_id && currentUser.role !== "admin")
    ) {
      return res.status(403).json({ message: "คุณไม่มีสิทธิ์แก้ไขข้อมูลนี้" });
    }

    await pool.query(
      "UPDATE users SET first_name = $1, last_name = $2 WHERE user_id = $3",
      [first_name, last_name, id]
    );
    if (req.io) {
      req.io.emit("profile_updated", {
        userId: id,
        first_name: first_name,
        last_name: last_name,
      });
    }
    console.log("ข้อมูลอัปเดตสำเร็จ:", first_name, last_name);

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const currentUser = req.user;

  try {
    if (currentUser.role !== "admin") {
      return res.status(403).json({ message: "คุณไม่มีสิทธิ์ลบผู้ใช้นี้" });
    }

    await pool.query("DELETE FROM notifications WHERE sender_id = $1", [id]);

    await pool.query("DELETE FROM notifications WHERE recive_id = $1", [id]);

    await pool.query("DELETE FROM users WHERE user_id = $1", [id]);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/check-email", authMiddleware, async (req, res) => {
  const { email } = req.body;

  try {
    const result = await pool.query(
      "SELECT user_id FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length > 0) {
      return res
        .status(200)
        .json({ exists: true, user_id: result.rows[0].user_id });
    }

    res.status(200).json({ exists: false });
  } catch (error) {
    console.error("Error checking email:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการตรวจสอบอีเมล" });
  }
});

router.post("/:id/check-password", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { currentPassword } = req.body;

  try {
    const result = await pool.query(
      "SELECT password FROM users WHERE user_id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    }

    const storedPassword = result.rows[0].password;

    const isPasswordMatch = await bcrypt.compare(
      currentPassword,
      storedPassword
    );

    if (!isPasswordMatch) {
      return res.status(400).json({ message: "รหัสเดิมไม่ถูกต้อง" });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error checking password:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
});

router.post("/reset-password", async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    }
    const user = result.rows[0];
    const user_id = user.user_id;

    await pool.query("DELETE FROM password_reset WHERE user_id = $1", [
      user_id,
    ]);

    const otp = generateNumericOtp(6);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    const otp_reset = await pool.query(
      "INSERT INTO password_reset (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user_id, otp, otpExpiry]
    );

    if (otp_reset.rowCount > 0) {
      await sendEmail({
        to: email,
        subject: "รีเซ็ตรหัสผ่าน",
        html: resetPasswordOtp(otp),
      });
    }

    res.status(200).json({
      message: "ข้อมูล",
      expiresAt: Date.now() + 60 * 1000 * 10,
      user: {
        user_id: user.user_id,
        email: user.email,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
});

router.post("/resent-reset-password", async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    }

    const user = result.rows[0];
    const user_id = user.user_id;

    await pool.query("DELETE FROM password_reset WHERE user_id = $1", [
      user_id,
    ]);

    const otp = generateNumericOtp(6);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    const otp_reset = await pool.query(
      "INSERT INTO password_reset (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user_id, otp, otpExpiry]
    );

    if (otp_reset.rowCount > 0) {
      await sendEmail({
        to: email,
        subject: "รีเซ็ตรหัสผ่าน",
        html: resetPasswordOtp(otp),
      });
    }

    res.status(200).json({
      message: "ข้อมูล",
      expiresAt: Date.now() + 60 * 1000 * 10,
      user: {
        user_id: user.user_id,
        email: user.email,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
});

router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    }

    const user = result.rows[0];
    const user_id = user.user_id;

    const otpResult = await pool.query(
      "SELECT * FROM password_reset WHERE user_id = $1 AND token = $2",
      [user_id, otp]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ message: "OTP ไม่ถูกต้อง" });
    }

    const otpExpiry = otpResult.rows[0].expires_at;
    if (new Date() > new Date(otpExpiry)) {
      return res.status(400).json({ message: "OTP หมดอายุ กรุณากดขอใหม่" });
    }

    res.status(200).json({ message: "ยืนยัน OTP สำเร็จ" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการยืนยัน OTP" });
  }
});

router.put("/:id/change-password", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  try {
    if (!password) {
      return res
        .status(400)
        .json({ message: "รหัสผ่านใหม่ไม่สามารถเป็นค่าว่าง" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const updateResult = await pool.query(
      "UPDATE users SET password = $1 WHERE user_id = $2",
      [hashedPassword, id]
    );

    if (updateResult.rowCount === 0) {
      return res.status(400).json({ message: "ไม่พบผู้ใช้ในการอัปเดต" });
    }

    res.status(200).json({ message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดต" });
  }
});

router.put("/:id/change-password-reset", async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  try {
    if (!password) {
      return res
        .status(400)
        .json({ message: "รหัสผ่านใหม่ไม่สามารถเป็นค่าว่าง" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const updateResult = await pool.query(
      "UPDATE users SET password = $1 WHERE user_id = $2",
      [hashedPassword, id]
    );

    if (updateResult.rowCount === 0) {
      return res.status(400).json({ message: "ไม่พบผู้ใช้ในการอัปเดต" });
    }

    res.status(200).json({ message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดต" });
  }
});

router.post("/contact-admin", LimiterRequestContact, async (req, res) => {
  const { email, subJect, conTent } = req.body;

  try {
    const adminRes = await pool.query(
      "SELECT email FROM users WHERE role = 'admin'"
    );
    let adminEmails = adminRes.rows.map(r => r.email).filter(Boolean);
    if (adminEmails.length === 0 && process.env.ADMIN_EMAIL) {
      adminEmails = [process.env.ADMIN_EMAIL];
    }

    if (adminEmails.length > 0) {
      for (const adminEmail of adminEmails) {
        try {
          await sendEmail({
            to: adminEmail,
            subject: subJect,
            html: contactAdminTemplate({ email, subJect, conTent }),
          });
        } catch (sendErr) {
          console.error(`Failed to send contact-admin email to ${adminEmail}:`, sendErr.message);
        }
      }
    }

    res.status(200).json({
      message: `ส่งคำขอเรียบร้อย กรุณารอข้อความตอบกลับจากผู้ดูแลระบบที่ ${email}`,
    });
  } catch (error) {
    console.error("Email Error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการส่ง email" });
  }
});

module.exports = router;
