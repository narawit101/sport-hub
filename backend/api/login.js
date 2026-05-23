const express = require("express");
const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const router = express.Router();
router.use(cookieParser());

router.post("/", async (req, res) => {
  const { identifier, password } = req.body;
  console.log("Request protocol:", req.protocol);
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("Hostname:", req.hostname);
  console.log("Secue", req.secure);
  console.log("User-Agent:", req.headers["user-agent"]);

  try {
    const userQuery = `SELECT * FROM users WHERE user_name = $1 OR email = $1`;
    const userResult = await pool.query(userQuery, [identifier]);

    if (userResult.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    const user = userResult.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    const expiresIn = 60 * 60 * 5000;

    const token = jwt.sign(
      {
        user_id: user.user_id,
        user_name: user.user_name,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "5h" }
    );
    const isProd = process.env.NODE_ENV === "production";
    const isHttps = req.secure;

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProd && isHttps,
      sameSite: isProd && isHttps ? "None" : "Lax",
      maxAge: expiresIn,
      ...(isProd && { domain: ".sporthub-online.me" })
    });

    const responseData = {
      message: "เข้าสู่ระบบสำเร็จ",
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: error.message });
  }
});

module.exports = router;
