const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { getCache, setCache } = require("../config/cache");

const authMiddleware = async (req, res, next) => {
  let token = null;

  if (req.cookies?.token) {
    token = req.cookies.token;
  }

  // Fallback: รับ token จาก Authorization header (สำหรับ mobile ที่บล็อค 3rd-party cookie)
  if (!token) {
    const authHeader = req.headers["authorization"];
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: กรุณาเข้าสู่ระบบ" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Try cache first for user role
    const cacheKey = `user_role:${decoded.user_id}`;
    let role = await getCache(cacheKey);

    if (!role) {
      const result = await pool.query(
        "SELECT role FROM users WHERE user_id = $1",
        [decoded.user_id]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: "ไม่พบผู้ใช้นี้ในระบบ" });
      }

      role = result.rows[0].role;
      await setCache(cacheKey, role, 300); // cache 5 min
    }

    req.user = {
      ...decoded,
      role,
    };
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token ไม่ถูกต้อง" });
  }
};

module.exports = authMiddleware;
