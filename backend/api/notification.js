const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middlewares/auth");

router.get("/all/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const authUserId = Number(req.user?.user_id);
    const targetId = Number(userId);
    if (!targetId) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const userCheck = await pool.query(
      "SELECT user_id FROM users WHERE user_id = $1",
      [targetId]
    );
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    if (authUserId !== targetId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const result = await pool.query(
      `SELECT
        n.notify_id,
        n.sender_id,
        n.recive_id,
        n.topic,
        n.key_id,
        n.messages,
        n.status,
        n.created_at,
        u_sender.first_name AS sender_first_name,
        u_sender.last_name AS sender_last_name,
        u_recive.first_name AS recive_first_name,
        u_recive.last_name AS recive_last_name,
        COALESCE(fb.field_name, fp.field_name) AS field_name,
        fp.field_id AS field_id,
        s.sub_field_name,
        b.booking_date,
        b.start_time,
        b.end_time,
        p.content
      FROM notifications n
      LEFT JOIN users u_sender ON n.sender_id = u_sender.user_id
      LEFT JOIN users u_recive ON n.recive_id = u_recive.user_id
      LEFT JOIN bookings b ON n.topic IN ('new_booking','booking_approved','booking_rejected','booking_complete','deposit_payment_uploaded','total_slip_payment_uploaded','booking_cancelled') AND n.key_id = b.booking_id
      LEFT JOIN field fb ON b.field_id = fb.field_id
      LEFT JOIN posts p ON n.topic = 'field_posted' AND n.key_id = p.post_id
      LEFT JOIN field fp ON p.field_id = fp.field_id
      LEFT JOIN sub_field s ON b.sub_field_id = s.sub_field_id
      WHERE n.recive_id = $1
      ORDER BY n.created_at DESC`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No notifications found for this user" });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/read-notification", authMiddleware, async (req, res) => {
  try {
    const { key_id } = req.body;
    const id = parseInt(key_id);
    const user_id = req.user.user_id;
    const result = await pool.query(
      `UPDATE notifications
      SET status = 'read'
      WHERE key_id = $1 AND recive_id = $2`,
      [id, user_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS unread_count FROM notifications WHERE recive_id = $1 AND status = 'unread'`,
      [user_id]
    );
    const unreadCount = countResult.rows[0]?.unread_count ?? 0;
    if (req && req.io) {
      req.io.emit("new_notification", {
        topic: "update_count",
        reciveId: Number(user_id),
        unreadCount,
      });
    }

    res.status(200).json({
      message: "Notification marked as read",
      unreadCount,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/read-all-notification", authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const result = await pool.query(
      `UPDATE notifications
       SET status = 'read'
       WHERE recive_id = $1 AND status = 'unread'`,
      [user_id]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS unread_count FROM notifications WHERE recive_id = $1 AND status = 'unread'`,
      [user_id]
    );
    const unreadCount = countResult.rows[0]?.unread_count ?? 0;

    if (req && req.io) {
      req.io.emit("new_notification", {
        topic: "reset_count",
        reciveId: Number(user_id),
        unreadCount,
      });
    }

    res.status(200).json({
      message: "Notifications marked as read",
      updated: result.rowCount,
      unreadCount,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete(
  "/delete-notification/:notificationId",
  authMiddleware,
  async (req, res) => {
    const notify_id = req.params.notificationId;
    try {
      const result = await pool.query(
        "DELETE FROM notifications WHERE notify_id = $1;",
        [notify_id]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.status(200).json({ message: "Notification deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;