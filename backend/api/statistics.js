const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middlewares/auth");
const XLSX = require("xlsx");
const { getCache, setCache } = require("../config/cache");
const { USER_ROLE, FIELD_STATUS, BOOKING_STATUS } = require("../utils/constants");

router.get("/:field_id", authMiddleware, async (req, res) => {
  const { field_id } = req.params;
  const { startDate, endDate, status, bookingDate } = req.query;
  const user_id = req.user.user_id;
  const user_role = req.user.role;

  try {
    const queryParamsString = JSON.stringify({ startDate, endDate, status, bookingDate });
    const cacheKey = `statistics:field:${field_id}:params:${queryParamsString}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const fieldQuery = await pool.query(
      `SELECT user_id, field_name, status AS field_status FROM field WHERE field_id = $1`,
      [field_id]
    );

    if (fieldQuery.rowCount === 0) {
      return res.status(404).json({ success: false, error: "Field not found" });
    }

    const field = fieldQuery.rows[0];

    if (user_role !== USER_ROLE.ADMIN && field.user_id !== user_id) {
      return res
        .status(403)
        .json({ success: false, error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูล" });
    }

    if (field.field_status !== FIELD_STATUS.VERIFIED) {
      return res.status(403).json({
        success: false,
        error: `สนาม ${field.field_name} ${field.field_status}`,
        fieldInfo: {
          field_name: field.field_name,
          field_status: field.field_status,
        },
      });
    }

    let query = `
SELECT 
  b.booking_id, b.user_id, b.field_id,
  u.first_name, u.last_name, u.email,
  f.field_name, f.gps_location, f.price_deposit, f.cancel_hours, f.status AS field_status,
  b.sub_field_id, sf.sub_field_name, sf.price AS sub_field_price,
  b.booking_date, b.start_date, b.start_time, b.end_date, b.end_time,
  b.total_hours, b.total_price, b.total_remaining,
  b.pay_method, b.status, b.activity, b.selected_slots,r.rating,r.comment,

  -- รวม facility เฉพาะของ booking นั้น
(
  SELECT COALESCE(json_agg(jsonb_build_object(
    'field_fac_id', bf.field_fac_id,
    'fac_name', bf.fac_name,
    'fac_price', ff.fac_price
  )), '[]')
  FROM booking_fac bf
  LEFT JOIN field_facilities ff ON ff.field_fac_id = bf.field_fac_id
  WHERE bf.booking_id = b.booking_id
) AS facilities


FROM bookings b
INNER JOIN users u ON u.user_id = b.user_id
LEFT JOIN field f ON b.field_id = f.field_id
LEFT JOIN sub_field sf ON b.sub_field_id = sf.sub_field_id
LEFT JOIN reviews r  ON b.booking_id = r.booking_id
WHERE b.field_id = $1
    `;

    let values = [field_id];
    let paramIndex = 2;

    if (bookingDate) {
      query += ` AND b.booking_date= $${paramIndex}`;
      values.push(bookingDate);
      paramIndex++;
    } else if (startDate && endDate) {
      query += ` AND b.start_date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      values.push(startDate, endDate);
      paramIndex += 2;
    } else if (startDate) {
      query += ` AND b.start_date >= $${paramIndex}`;
      values.push(startDate);
      paramIndex++;
    } else if (endDate) {
      query += ` AND b.start_date <= $${paramIndex}`;
      values.push(endDate);
      paramIndex++;
    }

    if (status) {
      query += ` AND b.status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }

    query += ` ORDER BY b.booking_date ASC, b.start_time ASC`;

    const result = await pool.query(query, values);

    const stats = {
      totalBookings: result.rows.length,
      statusCounts: {
        pending: result.rows.filter((row) => row.status === "pending").length,
        approved: result.rows.filter((row) => row.status === "approved").length,
        rejected: result.rows.filter((row) => row.status === "rejected").length,
      },
      totalRevenue: result.rows
        .filter((row) => row.status === "approved")
        .reduce((sum, row) => sum + parseFloat(row.total_price || 0), 0),
    };

    const responseData = {
      data: result.rows,
      fieldInfo: {
        field_name: field.field_name,
        field_status: field.field_status,
      },
      stats: stats,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    };

    await setCache(cacheKey, responseData, 60);

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ success: false, error: "Failed to get bookings" });
  }
});

router.post("/export/:field_id", authMiddleware, async (req, res) => {
  const { startDate, endDate, status, bookingDate } = req.body;

  const user_id = req.user.user_id;
  const user_role = req.user.role;
  const { field_id } = req.params;
  console.log("EXPORT filters:", { bookingDate, startDate, endDate, status });

  try {
    const ownerId = await pool.query(
      `SELECT user_id FROM field WHERE field_id = $1`,
      [field_id]
    );
    if (ownerId.rowCount === 0) {
      return res.status(404).json({ success: false, error: "Field not found" });
    }
    if (user_role !== USER_ROLE.ADMIN && ownerId.rows[0].user_id !== user_id) {
      return res
        .status(403)
        .json({ success: false, error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูล" });
    }

    let query = `
SELECT 
  u.first_name, u.last_name, u.email,
  f.field_name, f.gps_location, f.price_deposit, f.cancel_hours,
  sf.sub_field_name, sf.price AS sub_field_price,
  b.booking_date, b.start_date, b.start_time, b.end_date, b.end_time,
  b.total_hours, b.total_price, b.total_remaining,
  b.pay_method, b.status, b.activity,r.rating,r.comment,

  -- รวม facility เฉพาะของ booking นั้น
(
  SELECT COALESCE(json_agg(jsonb_build_object(
    'field_fac_id', bf.field_fac_id,
    'fac_name', bf.fac_name,
    'fac_price', ff.fac_price
  )), '[]')
  FROM booking_fac bf
  LEFT JOIN field_facilities ff ON ff.field_fac_id = bf.field_fac_id
  WHERE bf.booking_id = b.booking_id
) AS facilities


FROM bookings b
INNER JOIN users u ON u.user_id = b.user_id
LEFT JOIN field f ON b.field_id = f.field_id
LEFT JOIN sub_field sf ON b.sub_field_id = sf.sub_field_id
LEFT JOIN reviews r  ON b.booking_id = r.booking_id

WHERE b.field_id = $1


    `;

    let values = [field_id];
    let paramIndex = 2;

    if (bookingDate) {
      query += ` AND b.booking_date= $${paramIndex}`;
      values.push(bookingDate);
      paramIndex++;
    } else if (startDate && endDate) {
      query += ` AND b.start_date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      values.push(startDate, endDate);
      paramIndex += 2;
    } else if (startDate) {
      query += ` AND b.start_date >= $${paramIndex}`;
      values.push(startDate);
      paramIndex++;
    } else if (endDate) {
      query += ` AND b.start_date <= $${paramIndex}`;
      values.push(endDate);
      paramIndex++;
    }
    if (status) {
      query += ` AND b.status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }

    query += ` ORDER BY b.booking_date ASC, b.start_time ASC`;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "No bookings found" });
    }

    const rows = result.rows.map((row) => ({
      วันที่จอง: row.booking_date,

      ชื่อผู้จอง: `${row.first_name} ${row.last_name}`,

      สนาม: row.field_name,

      สนามย่อย: row.sub_field_name,

      เวลาที่จอง: `${row.start_time} - ${row.end_time}`,

      กิจกรรม: row.activity,

      มัดจำ: row.price_deposit,

      ราคารวมสุทธิ: row.total_price,

      สิ่งอำนวยความสะดวก: Array.isArray(row.facilities)
        ? row.facilities.map((f) => f.fac_name).join(", ")
        : "",

      คะแนนรีวิว: row.rating ?? "ยังไม่มีคะแนน",

      คอมเมนต์: row.comment ?? "ยังไม่มีคอมเมนต์",

      สถานะ:
        row.status === BOOKING_STATUS.APPROVED
          ? "อนุมัติแล้ว"
          : row.status === BOOKING_STATUS.PENDING
            ? "รอตรวจสอบ"
            : row.status === BOOKING_STATUS.COMPLETE
              ? "การจองสำเร็จ"
              : row.status === BOOKING_STATUS.REJECTED
                ? "ไม่อนุมัติ"
                : row.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    let rawFieldName = result.rows[0].field_name || "สนาม";
    let safeFieldName = rawFieldName.replace(
      /[^a-zA-Z0-9\u0E00-\u0E7F_-]/g,
      "_"
    );

    let fileName = `statistics_${safeFieldName}`;

    if (bookingDate) fileName += `_${bookingDate}`;
    if (startDate && endDate) fileName += `_${startDate}-${endDate}`;

    fileName += ".xlsx";

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );
    res.send(buffer);
    console.log("Export filename:", fileName);
  } catch (err) {
    console.error("Error exporting bookings to XLSX:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to export bookings" });
  }
});

module.exports = router;
