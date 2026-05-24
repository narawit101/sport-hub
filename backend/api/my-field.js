const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middlewares/auth");
const { FIELD_STATUS, USER_ROLE } = require("../utils/constants");

router.get("/myfields", authMiddleware, async (req, res) => {
  const { user_id,role } = req.user;

  try {
    let query = `
      SELECT DISTINCT
        users.user_id,
        users.first_name,
        users.last_name,
        users.email,
        field.field_id,
        field.field_name,
        field.img_field,
        field.status
      FROM field
      INNER JOIN users ON field.user_id = users.user_id
      WHERE (field.status = '${FIELD_STATUS.VERIFIED}' OR field.status = '${FIELD_STATUS.PENDING}' OR field.status = '${FIELD_STATUS.REJECTED}')
    `;

    let values = [];

    if (role === USER_ROLE.ADMIN) {
      query += ` ORDER BY field.field_id DESC`;
    } else {
      query += ` AND field.user_id = $1 ORDER BY field.field_id DESC`;
      values = [user_id];
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching my fields:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลสนาม" });
  }
});

module.exports = router;
