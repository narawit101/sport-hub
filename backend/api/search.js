const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { getCache, setCache } = require("../config/cache");
const { FIELD_STATUS } = require("../utils/constants");

router.get("/", async (req, res) => {
  const { query } = req.query;

  try {
    const cacheKey = `search:${query || ""}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json({ data: cached });
    }

    const keyword = `%${query}%`;

    const exactResult = await pool.query(
      `SELECT 
        f.field_id,
        f.field_name,
        f.img_field,
        f.open_hours,
        f.close_hours,
        f.open_days,
        MAX(a.content) AS content,
        COALESCE(ROUND(AVG(r.rating), 1), 0) AS avg_rating,
        COUNT(r.reviews_id) AS review_count,
        ARRAY_AGG(DISTINCT st.sport_name) AS sport_names
      FROM field f
      INNER JOIN sub_field sf ON f.field_id = sf.field_id
      INNER JOIN sports_types st ON sf.sport_id = st.sport_id
      LEFT JOIN add_on a ON sf.sub_field_id = a.sub_field_id
      LEFT JOIN reviews r ON f.field_id = r.field_id
      WHERE (
        st.sport_name ILIKE $1 OR
        f.field_name ILIKE $1 OR
        f.address ILIKE $1 OR
        f.field_description ILIKE $1 OR
        array_to_string(f.open_days, ',') ILIKE $1 OR
        a.content ILIKE $1 OR
        sf.players_per_team::text ILIKE $1 OR
        sf.wid_field::text ILIKE $1 OR
        sf.length_field::text ILIKE $1 OR
        sf.field_surface ILIKE $1 
      )
      AND f.status = '${FIELD_STATUS.VERIFIED}'
      GROUP BY 
        f.field_id, 
        f.field_name, 
        f.img_field, 
        f.open_hours, 
        f.close_hours, 
        f.open_days
      ORDER BY avg_rating DESC, f.field_id DESC`,
      [keyword]
    );

    if (exactResult.rows.length > 0) {
      await setCache(cacheKey, exactResult.rows, 60);
      return res.status(200).json({ data: exactResult.rows });
    }

    const fuzzyResult = await pool.query(
      `SELECT 
        f.field_id,
        f.field_name,
        f.img_field,
        f.open_hours,
        f.close_hours,
        f.open_days,
        MAX(a.content) AS content,
        COALESCE(ROUND(AVG(r.rating), 1), 0) AS avg_rating,
        COUNT(r.reviews_id) AS review_count,
        ARRAY_AGG(DISTINCT st.sport_name) AS sport_names
      FROM field f
      INNER JOIN sub_field sf ON f.field_id = sf.field_id
      INNER JOIN sports_types st ON sf.sport_id = st.sport_id
      LEFT JOIN add_on a ON sf.sub_field_id = a.sub_field_id
      LEFT JOIN reviews r ON f.field_id = r.field_id
      WHERE (
        similarity(st.sport_name, $1) > 0.3 OR
        similarity(f.field_name, $1) > 0.3 OR
        similarity(f.address, $1) > 0.3 OR
        similarity(f.field_description, $1) > 0.3 OR
        similarity(array_to_string(f.open_days, ','), $1) > 0.3 OR
        similarity(a.content, $1) > 0.3 OR
        similarity(sf.players_per_team::text, $1) > 0.3 OR
        similarity(sf.wid_field::text, $1) > 0.3 OR
        similarity(sf.length_field::text, $1) > 0.3 OR
        similarity(sf.field_surface, $1) > 0.3
      )
      AND f.status = '${FIELD_STATUS.VERIFIED}'
      GROUP BY 
        f.field_id, 
        f.field_name, 
        f.img_field, 
        f.open_hours, 
        f.close_hours, 
        f.open_days
     ORDER BY avg_rating DESC, f.field_id DESC`,
      [query]
    );

    await setCache(cacheKey, fuzzyResult.rows, 60); 
    return res.status(200).json({ data: fuzzyResult.rows });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

module.exports = router;
