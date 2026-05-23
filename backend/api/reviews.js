const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middlewares/auth");
const { invalidateCache, invalidatePattern } = require("../config/cache");

router.post("/post", authMiddleware, async (req, res) => {
  const { user_id, field_id, booking_id, rating, comment } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO reviews (user_id, field_id, booking_id, rating, comment, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [user_id, field_id, booking_id, rating, comment]
    );
    if (req.io) {
      req.io.emit("review_posted", {
        bookingId: booking_id,
      });
    }

    await invalidateCache(`field_profile:${field_id}`);
    await invalidatePattern(`statistics:field:${field_id}:*`);
    await invalidatePattern("search:*");

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error("Review Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/get/:booking_id", authMiddleware, async (req, res) => {
  const { booking_id } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM reviews WHERE booking_id = $1",
      [booking_id]
    );
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error("Review Fetch Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/rating/:field_id", authMiddleware, async (req, res) => {
  const { field_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT u.first_name, u.last_name, r.*
FROM reviews r
INNER JOIN users u ON r.user_id = u.user_id
WHERE r.field_id = $1
`,
      [field_id]
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("Review Fetch Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/rating-previwe/:field_id", async (req, res) => {
  const { field_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT u.first_name, u.last_name,u.user_profile, r.*
FROM reviews r
INNER JOIN users u ON r.user_id = u.user_id
WHERE r.field_id = $1
ORDER BY r.reviews_id DESC;
`,
      [field_id]
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("Review Fetch Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
