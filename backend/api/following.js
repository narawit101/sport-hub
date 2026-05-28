const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middlewares/auth");
const { getCache, setCache, invalidateCache, invalidatePattern } = require("../config/cache");

router.post("/add-following", async (req, res) => {
  const { fieldId, userId } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO following (user_id, field_id) VALUES ($1, $2) RETURNING *",
      [userId, fieldId]
    );
    const dataField = await pool.query(
      "SELECT user_id, field_name FROM field WHERE field_id = $1",
      [fieldId]
    );
    const fieldOwnerId = dataField.rows[0]?.user_id;
    const fieldName = dataField.rows[0]?.field_name;

    try {
      const notifyInsert = await pool.query(
        `INSERT INTO notifications (sender_id, recive_id, topic, messages, key_id, status)
         VALUES ($1, $2, $3, $4, $5, 'unread') RETURNING notify_id`,
        [
          userId,
          fieldOwnerId,
          "new_following",
          `มีคนติดตามสนาม ${fieldName}`,
          fieldId,
        ]
      );

      if (req.io) {
        req.io.to(fieldOwnerId.toString()).emit("new_notification", {
          notifyId: notifyInsert.rows[0].notify_id,
          topic: "new_following",
          reciveId: Number(fieldOwnerId),
          senderId: Number(userId),
          keyId: Number(fieldId),
        });
      }
    } catch (notifyErr) {
      console.error(
        "Insert new_following notification failed:",
        notifyErr.message
      );
    }

    await invalidateCache(`following:status:${userId}:${fieldId}`, `following:field:${fieldId}`);
    await invalidatePattern(`posts:following:${userId}:*`);

    res.status(200).json({
      message: "Following added successfully",
      following: 1,
      data: result.rows[0],
    });

    if (req.io) {
      req.io.emit("following", {
        following: Number(1),
        fieldId: Number(fieldId),
        userId: Number(userId),
        fieldOwnerId: Number(fieldOwnerId),
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/cancel-following", async (req, res) => {
  const { fieldId, userId } = req.body;
  try {
    const result = await pool.query(
      "DELETE FROM following WHERE user_id = $1 AND field_id = $2 RETURNING *",
      [userId, fieldId]
    );
    const dataField = await pool.query(
      "SELECT user_id FROM field WHERE field_id = $1",
      [fieldId]
    );
    const fieldOwnerId = dataField.rows[0]?.user_id;

    await invalidateCache(`following:status:${userId}:${fieldId}`, `following:field:${fieldId}`);
    await invalidatePattern(`posts:following:${userId}:*`);

    res.status(200).json({
      message: "Following removed successfully",
      following: 0,
      data: result.rows[0],
    });
    if (req) {
      req.io.emit("following", {
        following: Number(0),
        fieldId: Number(fieldId),
        userId: Number(userId),
        fieldOwnerId: Number(fieldOwnerId),
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/get-following/:userId/:fieldId", async (req, res) => {
  const { userId, fieldId } = req.params;
  try {
    const cacheKey = `following:status:${userId}:${fieldId}`;
    const cached = await getCache(cacheKey);
    if (cached !== null) {
      return res.status(200).json(cached);
    }

    const result = await pool.query(
      "SELECT * FROM following WHERE user_id = $1 AND field_id = $2",
      [userId, fieldId]
    );
    if (result.rows.length === 0) {
      const responseData = { following: 0, message: "No following found for this user" };
      await setCache(cacheKey, responseData, 300);
      return res.status(200).json(responseData);
    } else {
      const responseData = { following: 1 };
      await setCache(cacheKey, responseData, 300);
      res.status(200).json(responseData);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/all-followers/:fieldId", async (req, res) => {
  const { fieldId } = req.params;
  try {
    const cacheKey = `following:field:${fieldId}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const result = await pool.query(
      "SELECT f.user_id,u.first_name,u.last_name,u.user_profile FROM following f JOIN users u ON f.user_id = u.user_id WHERE f.field_id = $1",
      [fieldId]
    );
    const countFollowers = result.rows.length;
    console.log("Number of followers:", countFollowers);

    const responseData = { countFollowers, data: result.rows };
    await setCache(cacheKey, responseData, 300);

    res.status(200).json(responseData);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
