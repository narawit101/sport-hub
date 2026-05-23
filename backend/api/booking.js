module.exports = function (io) {
  const express = require("express");
  const pool = require("../config/db");
  require("dotenv").config();
  const router = express.Router();
  const authMiddleware = require("../middlewares/auth");
  const { DateTime } = require("luxon");
  const qrcode = require("qrcode");
  const promptpay = require("promptpay-qr");
  const { createUploader } = require("../utils/upload");
  const { invalidatePattern } = require("../config/cache");
  const { deleteCloudinaryFile } = require("../utils/delete");
  const { sendEmail } = require("../utils/email");
  const {
    bookingNewOrder,
    bookingApproved,
    bookingRejected,
    bookingComplete,
    bookingSlipUploaded,
  } = require("../utils/emailTemplates");
  const { createRateLimiter } = require("../utils/rateLimiter");

  const LimiterBookingsRequest = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 100,
    keyGenerator: (req) => req.user?.user_id,
  });

  const upload = createUploader(
    {
      deposit_slip: "uploads/images/slip/deposit_slip",
      total_slip: "uploads/images/slip/total_slip",
    },
    { maxFiles: 10 }
  );


  if (io) {
    const emitServerTime = () => {
      const now = DateTime.now().setZone('Asia/Bangkok');
      io.to('booking').emit('server_time', {
        timestamp: now.toMillis(),
        iso: now.toISO(),
      });
    };


    if (!global.__serverTimeTicker) global.__serverTimeTicker = null;
    if (!global.__bookingClients) global.__bookingClients = new Set();

    io.on('connection', (socket) => {
      let joinedBooking = false;


      socket.on('join_booking', () => {
        if (joinedBooking) return;
        joinedBooking = true;

        global.__bookingClients.add(socket.id);
        socket.join('booking');

        emitServerTime();

        if (!global.__serverTimeTicker) {
          global.__serverTimeTicker = setInterval(emitServerTime, 60_000);
          console.log('server_time ticker started');
        }
      });

      socket.on('leave_booking', () => {
        if (!joinedBooking) return;
        joinedBooking = false;

        global.__bookingClients.delete(socket.id);
        socket.leave('booking');

        if (global.__bookingClients.size === 0 && global.__serverTimeTicker) {
          clearInterval(global.__serverTimeTicker);
          global.__serverTimeTicker = null;
          console.log('server_time ticker stopped (no clients in booking)');
        }
      });

      socket.on('disconnect', () => {
        if (joinedBooking) {
          global.__bookingClients.delete(socket.id);
        }
        if (global.__bookingClients.size === 0 && global.__serverTimeTicker) {
          clearInterval(global.__serverTimeTicker);
          global.__serverTimeTicker = null;
          console.log('server_time ticker stopped (disconnect)');
        }
      });
    });
  }



  router.post(
    "/",
    authMiddleware,
    LimiterBookingsRequest,
    upload.fields([{ name: "deposit_slip" }]),
    async (req, res) => {
      // let depositSlip = null;
      const client = await pool.connect();

      try {
        const {
          fieldId,
          userId,
          subFieldId,
          bookingDate,
          startTime,
          startDate,
          endTime,
          endDate,
          totalHours,
          totalPrice,
          selectedSlots,
          payMethod,
          totalRemaining,
          activity,
          selectedFacilities,
          status,
        } = JSON.parse(req.body.data);

        if (
          !fieldId ||
          !userId ||
          !subFieldId ||
          !bookingDate ||
          !startTime ||
          !endTime ||
          !totalHours ||
          // !totalPrice ||
          // !payMethod ||
          !selectedSlots ||
          totalRemaining === undefined ||
          !activity
        ) {
          return res
            .status(400)
            .json({ success: false, message: "กรุณาเลือกข้อมูลให้ครบ" });
        }

        if (!startDate || !endDate) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid startDate or endDate" });
        }

        const overlapResult = await client.query(
          `SELECT * FROM bookings
          WHERE sub_field_id = $1
            AND status NOT IN ('rejected')
            AND (
              (start_date || ' ' || start_time)::timestamp < $3::timestamp
              AND (end_date || ' ' || end_time)::timestamp > $2::timestamp
            )
          FOR UPDATE`,
          [subFieldId, `${startDate} ${startTime}`, `${endDate} ${endTime}`]
        );

        const timeNow = DateTime.now().setZone("Asia/Bangkok");
        const timSubmit = `${startDate}T${startTime}`;
        const timeSubmitDate = DateTime.fromISO(timSubmit, {
          zone: "Asia/Bangkok",
        });

        if (timeSubmitDate < timeNow) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            success: false,
            message: "ไม่สามารถเลือกเวลาที่ผ่านไปแล้วได้",
          });
        }

        if (overlapResult.rows.length > 0) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            success: false,
            message: "ช่วงเวลาที่เลือกมีผู้จองแล้ว กรุณาเลือกเวลาใหม่",
          });
        }

        for (const facility of selectedFacilities || []) {
          const facInfoRes = await client.query(
            `SELECT field_fac_id, quantity_total, fac_name 
           FROM field_facilities 
           WHERE field_fac_id = $1 
           FOR UPDATE`,
            [facility.field_fac_id]
          );

          if (facInfoRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({
              success: false,
              message: `ไม่พบสิ่งอำนวยความสะดวก "${facility.fac_name}" ในสนามนี้`,
            });
          }

          const { field_fac_id, quantity_total, fac_name } = facInfoRes.rows[0];
          const quantityTotal = parseInt(quantity_total || 1, 10);

          const facBookedRes = await client.query(
            `SELECT COALESCE(SUM(bf.quantity), 0) AS booked_qty
           FROM booking_fac bf
           JOIN bookings b ON bf.booking_id = b.booking_id
           WHERE bf.field_fac_id = $1
             AND b.field_id = $2
             AND b.status NOT IN ('rejected')
             AND (
               (b.start_date || ' ' || b.start_time)::timestamp < $4::timestamp
               AND (b.end_date || ' ' || b.end_time)::timestamp > $3::timestamp
             )`,
            [
              field_fac_id,
              fieldId,
              `${startDate} ${startTime}`,
              `${endDate} ${endTime}`,
            ]
          );

          const bookedQty = parseInt(facBookedRes.rows[0]?.booked_qty || 0, 10);
          const requestedQty = parseInt(facility.quantity || 1, 10);

          if (bookedQty + requestedQty > quantityTotal) {
            await client.query("ROLLBACK");
            return res.status(400).json({
              success: false,
              message: `สิ่งอำนวยความสะดวก "${fac_name}" ถูกจองเต็มจำนวนในช่วงเวลานี้แล้ว (${bookedQty}/${quantityTotal})`,
              conflict_facility: fac_name,
            });
          }
        }

        const bookingResult = await client.query(
          `INSERT INTO bookings (field_id, user_id, sub_field_id, booking_date, start_time, end_time, total_hours, total_price, pay_method, total_remaining, activity, status, start_date, end_date, selected_slots)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING booking_id`,
          [
            fieldId,
            userId,
            subFieldId,
            bookingDate,
            startTime,
            endTime,
            totalHours,
            totalPrice,
            payMethod,
            totalRemaining,
            activity,
            status,
            startDate,
            endDate,
            selectedSlots,
          ]
        );

        const bookingId = bookingResult.rows[0].booking_id;
        const ownerId = await client.query(
          `SELECT user_id FROM field WHERE field_id = $1`,
          [fieldId]
        );

        for (const facility of selectedFacilities) {
          await client.query(
            `INSERT INTO booking_fac (booking_id, field_fac_id, fac_name, quantity) 
         VALUES ($1, $2, $3, $4) `,
            [
              bookingId,
              facility.field_fac_id,
              facility.fac_name,
              Number(facility.quantity || 1),
            ]
          );
        }

        if (bookingResult.rows.length > 0) {
          const data = await client.query(
            `SELECT 
            uf.email AS field_owner_email,
            f.field_name
            FROM bookings b
            JOIN field f ON b.field_id = f.field_id
            JOIN users uf ON uf.user_id = f.user_id
            WHERE b.booking_id = $1`,
            [bookingId]
          );

          if (data.rows.length === 0) {
            return res
              .status(404)
              .json({ success: false, message: "ไม่พบข้อมูลการจอง" });
          }
          const bookingData = data.rows[0];
          console.log("bookingData:", bookingData);

          if (!bookingData.field_owner_email) {
            console.error("ไม่พบอีเมลเจ้าของสนาม");
          } else {
            try {
              const emailRes = await sendEmail({
                to: bookingData.field_owner_email,
                subject: "มีการจองสนามของคุณ",
                html: bookingNewOrder({ fieldName: bookingData.field_name, bookingId }),
              });
              console.log("Email sent:", emailRes);
            } catch (emailErr) {
              console.error("Email send error:", emailErr);
            }
          }
        }
        const notifyData = await client.query(
          `INSERT INTO notifications (sender_id, recive_id, topic, messages, key_id, status)
   VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [
            userId,
            ownerId.rows[0].user_id,
            "new_booking",
            "มีการจองใหม่",
            bookingId,
            "unread",
          ]
        );

        await client.query("COMMIT");

        if (req.io) {
          req.io.emit("slot_booked", {
            subFieldId: subFieldId,
            bookingDate: bookingDate,
            bookingId,
          });

          req.io.emit("new_notification", {
            notifyId: notifyData.rows[0].notify_id,
            topic: "new_booking",
            reciveId: ownerId.rows[0].user_id,
            keyId: bookingId,
          });
        }

        await invalidatePattern(`statistics:field:${fieldId}:*`);

        res.status(200).json({ message: "Booking saved successfully" });
      } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error saving booking:", error);
        res.status(500).json({
          success: false,
          message: error.message || "Unexpected error",
        });
      } finally {
        client.release();
      }
    }
  );

  router.get(
    "/booked-block/:subFieldId/:startDate/:endDate",
    authMiddleware,
    async (req, res) => {
      const { subFieldId, startDate, endDate } = req.params;

      try {
        const client = await pool.connect();
        const result = await client.query(
          `SELECT *
         FROM bookings
         WHERE sub_field_id = $1
         AND booking_date >= $2
         AND booking_date < $3
         AND status IN ('pending', 'approved', 'complete', 'verified')`,
          [subFieldId, startDate, endDate]
        );
        client.release();

        res.status(200).json({
          data: result.rows,
        });
      } catch (error) {
        console.error("Error fetching booked range:", error);
        res.status(500).json({ success: false, error: "Database error" });
      }
    }
  );

  router.get("/my-bookings/:user_id", authMiddleware, async (req, res) => {
    const { user_id } = req.params;
    const { date, status } = req.query;

    try {
      const userResult = await pool.query(
        `SELECT user_name, first_name, last_name FROM users WHERE user_id = $1`,
        [user_id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "ไม่พบผู้ใช้",
        });
      }

      const userInfo = userResult.rows[0];

      let query = `
      SELECT 
        b.booking_id,
        b.user_id,
        b.field_id,
        f.field_name,
        f.gps_location,
        f.price_deposit,
        f.cancel_hours,
        b.sub_field_id,
        sf.sub_field_name,
        sf.price,
        b.booking_date,
        b.start_date,
        b.start_time,
        b.end_date,
        b.end_time,
        b.total_hours,
        b.total_price,
        b.total_remaining,
        b.pay_method,
        b.status,
        b.activity,
        b.selected_slots,
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
      LEFT JOIN field f ON b.field_id = f.field_id
      LEFT JOIN sub_field sf ON b.sub_field_id = sf.sub_field_id
      WHERE b.user_id = $1
    `;

      let values = [user_id];
      let i = 2;

      if (date) {
        query += ` AND b.start_date = $${i}`;
        values.push(date);
        i++;
      }

      if (status) {
        query += ` AND b.status = $${i}`;
        values.push(status);
        i++;
      }

      query += ` ORDER BY b.booking_date DESC, b.start_time ASC`;

      const bookingResult = await pool.query(query, values);

      res.status(200).json({
        user: userInfo,
        data: bookingResult.rows,
      });
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({
        success: false,
        error: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      });
    }
  });

  router.get("/my-orders/:field_id", authMiddleware, async (req, res) => {
    const { field_id } = req.params;

    const { startDate, endDate, status, bookingDate } = req.query;
    const user_id = req.user.user_id;
    const user_role = req.user.role;

    try {
      const fieldQuery = await pool.query(
        `SELECT user_id, field_name, status AS field_status FROM field WHERE field_id = $1`,
        [field_id]
      );

      if (fieldQuery.rowCount === 0) {
        return res
          .status(404)
          .json({ success: false, error: "Field not found" });
      }

      const field = fieldQuery.rows[0];

      if (user_role !== "admin" && field.user_id !== user_id) {
        return res
          .status(403)
          .json({ success: false, error: "ไม่มีสิทธิ์ดูข้อมูล" });
      }

      if (field.field_status !== "ผ่านการอนุมัติ") {
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
  b.pay_method, b.status, b.activity, b.selected_slots,

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

      query += ` ORDER BY b.booking_date DESC, b.start_time ASC`;

      const result = await pool.query(query, values);

      const stats = {
        totalBookings: result.rows.length,
        statusCounts: {
          pending: result.rows.filter((row) => row.status === "pending").length,
          approved: result.rows.filter((row) => row.status === "approved")
            .length,
          rejected: result.rows.filter((row) => row.status === "rejected")
            .length,
        },
        totalRevenue: result.rows
          .filter((row) => row.status === "approved")
          .reduce((sum, row) => sum + parseFloat(row.total_price || 0), 0),
      };

      res.status(200).json({
        data: result.rows,
        fieldInfo: {
          field_name: field.field_name,
          field_status: field.field_status,
          field_owner_id: field.user_id,
        },
        stats: stats,
        dateRange: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      });
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ success: false, error: "Failed to get bookings" });
    }
  });

  router.get(
    "/bookings-detail/:booking_id",
    authMiddleware,
    async (req, res) => {
      const { booking_id } = req.params;
      const requestingUser = req.user;

      try {
        const result = await pool.query(
          `
  SELECT 
  b.booking_id,
  b.user_id,
  b.field_id,
  u.first_name,
  u.last_name,
  u.email,
  f.field_name,
  f.user_id AS field_user_id,
  f.name_bank,
  f.account_holder,
  f.number_bank, 
  f.gps_location,
  f.price_deposit,
  f.cancel_hours,
  b.sub_field_id,
  sf.sub_field_name,
  sf.price,
  b.booking_date,
  b.start_date,
  b.start_time,
  b.end_date,
  b.end_time,
  b.total_hours,
  b.total_price,
  b.total_remaining,
  b.pay_method,
  b.status,
  b.activity,
  b.selected_slots,
  p.deposit_slip,
  p.total_slip,
  facs.facilities 
FROM bookings b
LEFT JOIN field f ON b.field_id = f.field_id
LEFT JOIN sub_field sf ON b.sub_field_id = sf.sub_field_id
LEFT JOIN users u ON u.user_id = b.user_id


LEFT JOIN LATERAL (
  SELECT deposit_slip, total_slip
  FROM payment
  WHERE booking_id = b.booking_id
  ORDER BY payment_id DESC
  LIMIT 1
) p ON true


LEFT JOIN LATERAL (
  SELECT COALESCE(json_agg(jsonb_build_object(
    'field_fac_id', bf.field_fac_id,
    'fac_name', bf.fac_name,
    'fac_price', ff.fac_price
  )), '[]') AS facilities
  FROM booking_fac bf
  LEFT JOIN field_facilities ff ON ff.field_fac_id = bf.field_fac_id
  WHERE bf.booking_id = b.booking_id
) facs ON true

WHERE b.booking_id = $1
LIMIT 1;

  `,
          [booking_id]
        );

        const booking = result.rows[0];
        const slipAll = await pool.query(
          `SELECT * FROM payment WHERE booking_id = $1 ORDER BY payment_id DESC`,
          [booking_id]
        );
        if (!booking) {
          return res.status(404).json({
            success: false,
            error: "ไม่พบข้อมูลการจองนี้",
          });
        }

        const isAdmin = requestingUser.role === "admin";
        const isBookingOwner = requestingUser.user_id === booking.user_id;
        const isFieldOwner = requestingUser.user_id === booking.field_user_id;

        if (!isAdmin && !isBookingOwner && !isFieldOwner) {
          return res.status(403).json({
            success: false,
            error: "คุณไม่มีสิทธิ์ดูข้อมูลการจองนี้",
          });
        }

        return res.status(200).json({ data: booking, slipAll: slipAll.rows });
      } catch (error) {
        console.error("Error fetching booking detail:", error);
        return res.status(500).json({
          success: false,
          error: "เกิดข้อผิดพลาดในการดึงข้อมูล",
        });
      }
    }
  );

  router.put(
    "/booking-status/:booking_id",
    authMiddleware,
    async (req, res) => {
      const { booking_id } = req.params;
      const { booking_status, reasoning } = req.body;
      const updatedAtThai = DateTime.now().setZone("Asia/Bangkok").toISO();

      try {
        let result;

        const field = await pool.query(
          `SELECT field_id FROM bookings WHERE booking_id = $1`,
          [booking_id]
        );

        const filedData = await pool.query(
          `SELECT number_bank, name_bank,price_deposit FROM field WHERE field_id = $1`,
          [field.rows[0].field_id]
        );

        if (booking_status === "approved") {
          result = await pool.query(
            "UPDATE bookings SET status = $1, updated_at = $2 WHERE booking_id = $3 RETURNING *",
            [booking_status, updatedAtThai, booking_id]
          );
        } else {
          result = await pool.query(
            "UPDATE bookings SET status = $1 WHERE booking_id = $2 RETURNING *",
            [booking_status, booking_id]
          );
        }

        if (result.rowCount === 0) {
          return res.status(404).json({
            success: false,
            error: "ไม่พบ booking ที่ต้องการอัปเดต",
          });
        }

        const booking = result.rows[0];

        const userInfoRes = await pool.query(
          `SELECT u.email, f.field_name
       FROM bookings b
       JOIN users u ON b.user_id = u.user_id
       JOIN field f ON b.field_id = f.field_id
       WHERE b.booking_id = $1`,
          [booking_id]
        );

        const userInfo = userInfoRes.rows[0];

        if (userInfo) {
          let subject = "";
          let message = "";

          if (booking_status === "approved") {
            subject = `การจองสนาม ${userInfo.field_name} ได้รับการอนุมัติแล้ว`;
            message = bookingApproved({ fieldName: userInfo.field_name, bookingId: booking_id });
            try {
              const notifyInsert = await pool.query(
                `INSERT INTO notifications (sender_id, recive_id, topic, messages, key_id, status)
                 VALUES ($1,$2,$3,$4,$5,'unread') RETURNING notify_id`,
                [
                  req.user?.user_id || null,
                  booking.user_id,
                  "booking_approved",
                  "การจองของคุณได้รับการอนุมัติแล้ว",
                  booking.booking_id,
                ]
              );
              if (req.io) {
                req.io.emit("new_notification", {
                  notifyId: notifyInsert.rows[0].notify_id,
                  topic: "booking_approved",
                  reciveId: booking.user_id,
                  keyId: booking.booking_id,
                });
              }
            } catch (notifyErr) {
              console.error(
                "Insert booking_approved notification failed:",
                notifyErr.message
              );
            }
          } else if (booking_status === "rejected") {
            subject = `การจองสนาม ${userInfo.field_name} ไม่ได้รับการอนุมัติ`;
            message = bookingRejected({ fieldName: userInfo.field_name, bookingId: booking_id, reasoning });
            try {
              const notifyInsert = await pool.query(
                `INSERT INTO notifications (sender_id, recive_id, topic, messages, key_id, status)
                 VALUES ($1,$2,$3,$4,$5,'unread') RETURNING notify_id`,
                [
                  req.user?.user_id || null,
                  booking.user_id,
                  "booking_rejected",
                  reasoning,
                  booking.booking_id,
                ]
              );
              if (req.io) {
                req.io.emit("new_notification", {
                  notifyId: notifyInsert.rows[0].notify_id,
                  topic: "booking_rejected",
                  reciveId: booking.user_id,
                  keyId: booking.booking_id,
                });
              }
            } catch (notifyErr) {
              console.error(
                "Insert booking_rejected notification failed:",
                notifyErr.message
              );
            }
          } else if (booking_status === "complete") {
            subject = `การจองสนาม ${userInfo.field_name} เสร็จสิ้น`;
            message = bookingComplete({ fieldName: userInfo.field_name, bookingId: booking_id });
            try {
              const notifyInsert = await pool.query(
                `INSERT INTO notifications (sender_id, recive_id, topic, messages, key_id, status)
                 VALUES ($1,$2,$3,$4,$5,'unread') RETURNING notify_id`,
                [
                  req.user?.user_id || null,
                  booking.user_id,
                  "booking_complete",
                  "การจองเสร็จสิ้น",
                  booking.booking_id,
                ]
              );
              if (req.io) {
                req.io.emit("new_notification", {
                  notifyId: notifyInsert.rows[0].notify_id,
                  topic: "booking_complete",
                  reciveId: booking.user_id,
                  keyId: booking.booking_id,
                });
              }
            } catch (notifyErr) {
              console.error(
                "Insert booking_complete notification failed:",
                notifyErr.message
              );
            }
          } else if (booking_status === "verified") {
            try {
              const notifyInsert = await pool.query(
                `INSERT INTO notifications (sender_id, recive_id, topic, messages, key_id, status)
                 VALUES ($1,$2,$3,$4,$5,'unread') RETURNING notify_id`,
                [
                  req.user?.user_id || null,
                  booking.user_id,
                  "booking_verified",
                  "ระบบได้ตรวจสอบสลิปการชำระเงินมัดจำเรียบร้อยแล้ว",
                  booking.booking_id,
                ]
              );

              if (req.io) {
                req.io.emit("new_notification", {
                  notifyId: notifyInsert.rows[0].notify_id,
                  bookingId: booking.booking_id,
                  topic: "booking_verified",
                  reciveId: booking.user_id,
                  keyId: booking.booking_id,
                });
              }
            } catch (notifyErr) {
              console.error(
                "Insert booking_verified notification failed:",
                notifyErr.message
              );
            }
          }
          if (subject) {
            await sendEmail({
              to: userInfo.email,
              subject,
              html: message,
            });

            console.log(`ส่งอีเมลแจ้งผลการอัปเดตสถานะไปยัง ${userInfo.email}`);
          }
        }

        req.io.emit("slot_booked", {
          bookingId: booking_id,
        });

        await invalidatePattern(`statistics:field:${booking.field_id}:*`);

        return res.status(200).json({
          message: "อัปเดตสถานะสำเร็จ",
          data: booking,
        });
      } catch (error) {
        console.error("Error updating booking status:", error);
        return res.status(500).json({
          success: false,
          error: "เกิดข้อผิดพลาดในระบบ",
        });
      }
    }
  );

  router.put(
    "/cancel-bookings/:booking_id",
    authMiddleware,
    async (req, res) => {
      const { booking_id } = req.params;
      const { cancel_time, reasoning } = req.body;
      const user_id = req.user.user_id;

      try {
        if (!cancel_time) {
          return res.status(400).json({
            status: 0,
            message: "Missing cancel_time in request body.",
          });
        }

        const now = DateTime.fromISO(cancel_time, { zone: "Asia/Bangkok" });
        if (!now.isValid) {
          return res.status(400).json({
            status: 0,
            message: "Invalid cancel_time format. Must be ISO string.",
          });
        }

        console.log(` ยกเลิก booking_id = ${booking_id}`);
        console.log(` เวลาที่กดปุ่ม cancel: ${now.toISO()}`);

        const fieldDataResult = await pool.query(
          `
        SELECT f.cancel_hours, b.start_date, b.start_time, b.end_time, f.field_name, f.user_id as owner_id, b.user_id, u.email as user_email, u.first_name, u.last_name, b.field_id
        FROM bookings b
        JOIN field f ON b.field_id = f.field_id
        JOIN users u ON u.user_id = b.user_id
        WHERE b.booking_id = $1
      `,
          [booking_id]
        );

        if (fieldDataResult.rowCount === 0) {
          return res.status(404).json({
            status: 0,
            message: `Booking ID ${booking_id} not found.`,
            timestamp: now.toISO(),
          });
        }

        const formatDateToThai = (date) => {
          if (!date) return "ไม่ทราบวันที่";

          const parsedDate = new Date(date);
          if (isNaN(parsedDate)) return "ไม่สามารถแปลงวันที่ได้";

          const options = { day: "numeric", month: "long", year: "numeric" };
          return new Intl.DateTimeFormat("th-TH", options).format(parsedDate);
        };

        const {
          cancel_hours,
          start_date,
          start_time,
          end_time,
          field_name,
          owner_id,
          user_email,
          first_name,
          last_name,
          field_id,
        } = fieldDataResult.rows[0];
        const booking_user_id = fieldDataResult.rows[0].user_id;
        console.log("owner_id:", owner_id, " user_id:", user_id);

        let startDateStr;
        try {
          const startDateObj = new Date(start_date);
          if (isNaN(startDateObj.getTime()))
            throw new Error("Invalid start_date");
          const yyyy = startDateObj.getFullYear();
          const mm = String(startDateObj.getMonth() + 1).padStart(2, "0");
          const dd = String(startDateObj.getDate()).padStart(2, "0");
          startDateStr = `${yyyy}-${mm}-${dd}`;
        } catch (err) {
          console.error(" start_date is invalid:", start_date);
          return res.status(500).json({
            status: 0,
            message: "Invalid start_date format from database.",
            booking_id,
          });
        }

        if (
          !start_time ||
          typeof start_time !== "string" ||
          !/^\d{2}:\d{2}(:\d{2})?$/.test(start_time)
        ) {
          console.error(" Invalid start_time:", start_time);
          return res.status(500).json({
            status: 0,
            message: "Invalid start_time format from database.",
            booking_id,
          });
        }

        const trimmedStartTime = start_time.slice(0, 5);
        const trimmedEndTime = end_time.slice(0, 5);

        const startDateTime = DateTime.fromISO(
          `${startDateStr}T${trimmedStartTime}:00`,
          { zone: "Asia/Bangkok" }
        );

        if (!startDateTime.isValid) {
          console.error(
            " Invalid startDateTime:",
            `${startDateStr}T${trimmedStartTime}:00`
          );
          return res.status(500).json({
            status: 0,
            message: "Cannot parse combined start date/time.",
            booking_id,
          });
        }

        console.log("startDateStr:", startDateStr);
        console.log("start_time:", start_time);

        if (cancel_hours === null || owner_id === user_id) {
          const paymentResult = await pool.query(
            `SELECT deposit_slip, total_slip FROM payment WHERE booking_id = $1`,
            [booking_id]
          );

          if (paymentResult.rowCount > 0) {
            const { deposit_slip, total_slip } = paymentResult.rows[0];

            if (deposit_slip) await deleteCloudinaryFile(deposit_slip);
            if (total_slip) await deleteCloudinaryFile(total_slip);
            await pool.query(`DELETE FROM payment WHERE booking_id = $1`, [
              booking_id,
            ]);
          }
          await pool.query(`DELETE FROM booking_fac WHERE booking_id = $1`, [
            booking_id,
          ]);
          await pool.query(`DELETE FROM bookings WHERE booking_id = $1`, [
            booking_id,
          ]);

          try {
            const notifyData = await pool.query(
              `INSERT INTO notifications (sender_id, recive_id, topic, messages, key_id, status)
   VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
              [
                owner_id,
                booking_user_id,
                "booking_cancelled",
                `${reasoning}`,
                booking_id,
                "unread",
              ]
            );

            if (req.io) {
              req.io.emit("new_notification", {
                notifyId: notifyData.rows[0].notify_id,
                topic: "booking_cancelled",
                reciveId: booking_user_id,
                keyId: booking_id,
              });
            }
          } catch (notifyErr) {
            console.error(
              "Insert booking_cancelled notification failed:",
              notifyErr.message
            );
          }

          await invalidatePattern(`statistics:field:${field_id}:*`);

          return res.status(200).json({
            status: 1,
            message: `การจองสนาม ${field_name} เวลา ${trimmedStartTime} - ${trimmedEndTime} วันที่ ${formatDateToThai(startDateStr)} ถูกยกเลิกเรียบร้อย`,
            cancelDeadline: null,
            now: now.toISO(),
          });
        }

        const cancelDeadline = startDateTime.minus({ hours: cancel_hours });

        console.log("Frontend ส่งมา (cancel_time):", now.toISO());
        console.log("เวลาเริ่ม:", startDateTime.toISO());
        console.log("เส้นตายยกเลิก:", cancelDeadline.toISO());

        if (now < cancelDeadline) {
          const paymentResult = await pool.query(
            `SELECT deposit_slip, total_slip FROM payment WHERE booking_id = $1`,
            [booking_id]
          );

          if (paymentResult.rowCount > 0) {
            const { deposit_slip, total_slip } = paymentResult.rows[0];

            if (deposit_slip) await deleteCloudinaryFile(deposit_slip);
            if (total_slip) await deleteCloudinaryFile(total_slip);

            await pool.query(`DELETE FROM payment WHERE booking_id = $1`, [
              booking_id,
            ]);
          }
          await pool.query(`DELETE FROM booking_fac WHERE booking_id = $1`, [
            booking_id,
          ]);
          await pool.query(`DELETE FROM bookings WHERE booking_id = $1`, [
            booking_id,
          ]);

          if (req.io) {
            req.io.emit("slot_booked", {
              bookingId: booking_id,
            });
          }
          try {
            const notifyData = await pool.query(
              `INSERT INTO notifications (sender_id, recive_id, topic, messages, key_id, status)
   VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
              [
                booking_user_id,
                owner_id,
                "cancel_booking_by_customer",
                `${reasoning}`,
                booking_id,
                "unread",
              ]
            );

            if (req.io) {
              req.io.emit("new_notification", {
                notifyId: notifyData.rows[0].notify_id,
                topic: "cancel_booking_by_customer",
                reciveId: owner_id,
                keyId: booking_id,
              });
            }
          } catch (notifyErr) {
            console.error(
              "Insert cancel_booking_by_customer notification failed:",
              notifyErr.message
            );
          }

          await invalidatePattern(`statistics:field:${field_id}:*`);

          return res.status(200).json({
            message: `การจองสนาม ${field_name} เวลา ${trimmedStartTime} - ${trimmedEndTime}  วันที่ ${formatDateToThai(startDateStr)} ถูกยกเลิกเรียบร้อย`,
            cancelDeadline: cancelDeadline.toISO(),
            now: now.toISO(),
          });
        } else {
          return res.status(400).json({
            message: `ไม่สามารถยกเลิกได้ เลยเวลาการยกเลิกภายใน ${cancel_hours} ชม. ก่อนจะเริ่ม`,
            field: field_name,
            startDateTime: startDateTime.toISO(),
            cancelDeadline: cancelDeadline.toISO(),
            now: now.toISO(),
          });
        }
      } catch (error) {
        console.error(" Error while canceling booking:", error);

        return res.status(500).json({
          message: "Internal Server Error",
          error: error.message,
          booking_id,
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  router.delete("/delete/:booking_id", authMiddleware, async (req, res) => {
    const { booking_id } = req.params;

    try {
      const client = await pool.connect();
      const bookingCheck = await client.query(
        `SELECT * FROM bookings WHERE booking_id = $1`,
        [booking_id]
      );

      if (bookingCheck.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: "ไม่พบการจองนี้",
        });
      }

      const paymentResult = await pool.query(
        `SELECT deposit_slip, total_slip FROM payment WHERE booking_id = $1`,
        [booking_id]
      );
      if (paymentResult.rowCount > 0) {
        const { deposit_slip, total_slip } = paymentResult.rows[0];

        if (deposit_slip) await deleteCloudinaryFile(deposit_slip);
        if (total_slip) await deleteCloudinaryFile(total_slip);

        await pool.query(`DELETE FROM payment WHERE booking_id = $1`, [
          booking_id,
        ]);
      }

      await pool.query(`DELETE FROM booking_fac WHERE booking_id = $1`, [
        booking_id,
      ]);
      await pool.query(`DELETE FROM bookings WHERE booking_id = $1`, [
        booking_id,
      ]);

      client.release();

      if (req.io) req.io.emit("slot_booked", { bookingId: booking_id });

      await invalidatePattern(`statistics:field:${bookingCheck.rows[0].field_id}:*`);

      res.status(200).json({
        message: "การจองถูกลบเรียบร้อยแล้ว",
      });
    } catch (error) {
      console.error("Error deleting booking:", error);
      res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการลบการจอง",
      });
    }
  });

  router.post(
    "/upload-slip/:booking_id",
    upload.fields([
      { name: "deposit_slip", maxCount: 1 },
      { name: "total_slip", maxCount: 1 },
    ]),
    async (req, res) => {
      const client = await pool.connect();
      try {
        const bookingId = req.params.booking_id;

        let depositSlip =
          req.files["deposit_slip"]?.[0]?.path?.replace(/\\/g, "/") || null;
        let totalSlip =
          req.files["total_slip"]?.[0]?.path?.replace(/\\/g, "/") || null;

        if (!depositSlip && !totalSlip) {
          return res.status(400).json({
            success: false,
            message: "ต้องแนบสลิปอย่างน้อยหนึ่งรายการ",
          });
        }

        const result = await client.query(
          `
        INSERT INTO payment (booking_id, deposit_slip, total_slip)
        VALUES ($1, $2, $3)
        RETURNING *;
        `,
          [bookingId, depositSlip, totalSlip]
        );

        if (req.io) req.io.emit("slot_booked", { bookingId });

        try {
          const info = await client.query(
            `SELECT b.user_id AS booker_id, f.user_id AS owner_id
             FROM bookings b JOIN field f ON b.field_id = f.field_id
             WHERE b.booking_id = $1 LIMIT 1`,
            [bookingId]
          );
          if (info.rows.length > 0) {
            const { booker_id, owner_id } = info.rows[0];
            const msg = "มีการอัปโหลดสลิปมัดจำ";
            const notifyInsert = await client.query(
              `INSERT INTO notifications (sender_id, recive_id, topic, messages, key_id, status)
               VALUES ($1,$2,$3,$4,$5,'unread') RETURNING notify_id`,
              [
                booker_id || null,
                owner_id || null,
                "deposit_payment_uploaded",
                msg,
                bookingId,
              ]
            );
            if (req.io) {
              req.io.emit("new_notification", {
                notifyId: notifyInsert.rows[0].notify_id,
                topic: "deposit_payment_uploaded",
                reciveId: owner_id || null,
                keyId: bookingId,
              });
            }
          }
        } catch (notifyErr) {
          console.error(
            "Insert deposit_payment_uploaded notification failed:",
            notifyErr.message
          );
        }

        res.json({
          message: "Upload success",
          filePath: { depositSlip, totalSlip },
          payment_id: result.rows[0].payment_id,
        });
      } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({
          message: "Server error",
          error: error.message,
        });
      } finally {
        client.release();
      }
    }
  );

  router.put(
    "/upload-slip/:booking_id",
    upload.fields([{ name: "total_slip", maxCount: 1 }]),
    async (req, res) => {
      const client = await pool.connect();
      try {
        const bookingId = req.params.booking_id;
        const totalSlip = req.files["total_slip"]?.[0]?.path?.replace(
          /\\/g,
          "/"
        );

        if (!totalSlip) {
          return res
            .status(400)
            .json({ success: false, message: "ต้องแนบสลิป" });
        }
        const check = await client.query(
          `SELECT * FROM payment WHERE booking_id = $1 ORDER BY payment_id DESC LIMIT 1`,
          [bookingId]
        );

        let result;
        if (check.rows.length > 0) {
          result = await client.query(
            `UPDATE payment SET total_slip = $1 WHERE booking_id = $2 AND payment_id = $3 RETURNING *`,
            [totalSlip, bookingId, check.rows[0].payment_id]
          );
        } else {
          result = await client.query(
            `INSERT INTO payment (booking_id, total_slip) VALUES ($1, $2) RETURNING *`,
            [bookingId, totalSlip]
          );
        }

        if (result.rows.length > 0) {
          const data = await client.query(
            `SELECT 
              ub.first_name AS booker_first_name,
              ub.last_name AS booker_last_name,
              ub.email AS booker_email,
              uf.email AS field_owner_email,
              f.field_name, 
              sf.sub_field_name,
              b.booking_date,
              b.start_time,
              b.end_time  
            FROM bookings b 
            LEFT JOIN field f ON b.field_id = f.field_id
            LEFT JOIN sub_field sf ON b.sub_field_id = sf.sub_field_id
            LEFT JOIN users ub ON ub.user_id = b.user_id         -- ผู้จอง
            LEFT JOIN users uf ON uf.user_id = f.user_id         -- เจ้าของสนาม
            WHERE b.booking_id = $1`,
            [bookingId]
          );

          if (data.rows.length === 0) {
            return res
              .status(404)
              .json({ success: false, message: "ไม่พบข้อมูลการจอง" });
          }
          const bookingData = data.rows[0];
          console.log("bookingData:", bookingData);

          if (!bookingData.field_owner_email) {
            console.error("ไม่พบอีเมลเจ้าของสนาม");
          } else {
            try {
              const emailRes = await sendEmail({
                to: bookingData.field_owner_email,
                subject: "ตรวจสอบสลิปและอัปเดตสถานะการจองให้เสร็จสิ้น",
                html: bookingSlipUploaded({ fieldName: bookingData.field_name, bookingId }),
              });
              console.log("Email sent:", emailRes);
            } catch (emailErr) {
              console.error("Email send error:", emailErr);
            }
            try {
              const info = await client.query(
                `SELECT b.user_id AS booker_id, f.user_id AS owner_id
             FROM bookings b JOIN field f ON b.field_id = f.field_id
             WHERE b.booking_id = $1 LIMIT 1`,
                [bookingId]
              );
              if (info.rows.length > 0) {
                const { booker_id, owner_id } = info.rows[0];
                const msg = "มีการอัปโหลดสลิปยอดคงเหลือ";
                const notifyInsert = await client.query(
                  `INSERT INTO notifications (sender_id, recive_id, topic, messages, key_id, status)
               VALUES ($1,$2,$3,$4,$5,'unread') RETURNING notify_id`,
                  [
                    booker_id || null,
                    owner_id || null,
                    "total_slip_payment_uploaded",
                    msg,
                    bookingId,
                  ]
                );
                if (req.io) {
                  req.io.emit("new_notification", {
                    notifyId: notifyInsert.rows[0].notify_id,
                    topic: "total_slip_payment_uploaded",
                    reciveId: owner_id || null,
                    keyId: bookingId,
                  });
                }
              }
            } catch (notifyErr) {
              console.error(
                "Insert deposit_payment_uploaded notification failed:",
                notifyErr.message
              );
            }
          }
        }

        if (req.io) req.io.emit("slot_booked", { bookingId });

        res.json({
          message: "Upload success",
          filePath: { totalSlip },
          payment_id: result.rows[0].payment_id,
        });
      } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({
          message: "Server error",
          error: error.message,
        });
      } finally {
        client.release();
      }
    }
  );

  router.post("/gen-qr", async (req, res) => {
    const { bookingId, amount } = req.body;
    if (!bookingId || !amount) {
      return res
        .status(400)
        .json({ success: false, message: "Missing bookingId or amount" });
    }
    try {
      const fieldIdResult = await pool.query(
        `SELECT field_id FROM bookings WHERE booking_id = $1`,
        [bookingId]
      );

      if (fieldIdResult.rowCount === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Booking not found" });
      }

      const fieldId = fieldIdResult.rows[0].field_id;

      const fieldData = await pool.query(
        `SELECT number_bank FROM field WHERE field_id = $1`,
        [fieldId]
      );
      if (fieldData.rowCount === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Field not found" });
      }

      const number_bank = fieldData.rows[0].number_bank;

      if (!number_bank) {
        return res
          .status(400)
          .json({ success: false, message: "Missing bank number" });
      }

      const qrCodeData = promptpay(number_bank, {
        amount: Number(amount),
      });

      const qr = await qrcode.toDataURL(qrCodeData);
      console.log("QR Code generated:", qr);
      res.status(200).json({
        message: "QR code generated successfully",
        qrCode: qr,
      });
    } catch (error) {
      console.error("Error generating QR code:", error);
      return res.status(500).json({ status: false, message: "Server error" });
    }
  });



  router.get('/server-time', (req, res) => {
    const serverTime = DateTime.now().setZone('Asia/Bangkok');
    res.json({
      time: serverTime.toISO(),
      timestamp: serverTime.toMillis()
    });
    console.log("Server time fetched:", serverTime.toISO());
  });

  return router;
};
