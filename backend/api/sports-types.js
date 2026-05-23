const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middlewares/auth");
const { getCache, setCache, invalidateCache } = require("../config/cache");

router.get("/", authMiddleware, async (req, res) => {
  try {
    const cacheKey = "sports_types:all";
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    const result = await pool.query("SELECT * FROM sports_types");
    await setCache(cacheKey, result.rows, 3600); // cache for 1 hour
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Database error fetching sports types" });
  }
});

router.post("/add", authMiddleware, async (req, res) => {
  const { sport_name } = req.body;

  if (!sport_name) {
    return res.status(400).json({ error: "Sport name is required" });
  }

  const existingSportType = await pool.query(
    "SELECT * FROM sports_types WHERE sport_name = $1",
    [sport_name]
  );

  if (existingSportType.rowCount > 0) {
    return res.status(400).json({ error: "ประเภทกีฬานี้มีอยู่แล้ว" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO sports_types (sport_name) VALUES ($1) RETURNING *",
      [sport_name]
    );
    await invalidateCache("sports_types:all");
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Database error adding sports type" });
  }
});

router.delete("/delete/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM sports_types WHERE sport_id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Sport type not found" });
    }

    await invalidateCache("sports_types:all");
    res.json({ message: "Sport type deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Database error deleting sport type" });
  }
});

router.put("/update/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { sport_name } = req.body;

  if (!sport_name) {
    return res.status(400).json({ error: "Sport name is required" });
  }

  const existingSportType = await pool.query(
    "SELECT * FROM sports_types WHERE sport_name = $1 AND sport_id != $2",
    [sport_name, id]
  );

  if (existingSportType.rowCount > 0) {
    return res.status(400).json({ error: "ประเภทกีฬานี้มีอยู้แล้ว" });
  }

  try {
    const result = await pool.query(
      "UPDATE sports_types SET sport_name = $1 WHERE sport_id = $2 RETURNING *",
      [sport_name, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Sport type not found" });
    }

    await invalidateCache("sports_types:all");
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Database error updating sport type" });
  }
});

router.get("/preview", async (req, res) => {
  const { sport_id, date, time } = req.query;

  try {
    const queryParams = [];
    let whereClause = `WHERE field.status = 'ผ่านการอนุมัติ'`;

    if (sport_id) {
      queryParams.push(sport_id);
      whereClause += ` AND sports_types.sport_id = $${queryParams.length}`;
    }

    if (date && time) {
      const parsedDate = new Date(date);
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayOfWeek = parsedDate.getDay();
      const dayName = days[dayOfWeek];

      queryParams.push(dayName);
      queryParams.push(date);
      queryParams.push(time);

      whereClause += `
  AND $${queryParams.length - 2} = ANY(field.open_days)
  AND (
    (field.open_hours < field.close_hours AND $${queryParams.length} >= field.open_hours AND $${queryParams.length} <= field.close_hours)
    OR
    (field.open_hours > field.close_hours AND ($${queryParams.length} >= field.open_hours OR $${queryParams.length} <= field.close_hours))
  )
  AND NOT EXISTS (
    SELECT 1
    FROM bookings b
    WHERE b.field_id = field.field_id
      AND b.booking_date = $${queryParams.length - 1}
      AND EXISTS (
        SELECT 1
        FROM unnest(b.selected_slots) AS slot
        WHERE slot LIKE '%' || $${queryParams.length} || '%'
      )
  )
`;
    }

    const query = `
      SELECT 
        field.field_id,
        field.field_name,
        field.img_field,
        field.open_hours,
        field.close_hours,
        field.open_days,
        COALESCE(ROUND(AVG(reviews.rating), 1), 0) AS avg_rating,
        ARRAY_AGG(DISTINCT sports_types.sport_name) AS sport_names
      FROM field
      INNER JOIN sub_field ON field.field_id = sub_field.field_id
      INNER JOIN sports_types ON sub_field.sport_id = sports_types.sport_id
      LEFT JOIN reviews ON field.field_id = reviews.field_id
      ${whereClause}
      GROUP BY 
        field.field_id, field.field_name, field.img_field, 
        field.open_hours, field.close_hours, field.open_days
      ORDER BY avg_rating DESC, field.field_id DESC;
    `;

    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Database error fetching available fields" });
  }
});

router.get("/preview/type", async (req, res) => {
  try {
    const cacheKey = "sports_types:all";
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    const result = await pool.query("SELECT * FROM sports_types");
    await setCache(cacheKey, result.rows, 3600); // cache for 1 hour
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Database error fetching sports types" });
  }
});

module.exports = router;
