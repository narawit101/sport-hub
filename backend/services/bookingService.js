const pool = require("../config/db");
const { DateTime } = require("luxon");
const qrcode = require("qrcode");
const promptpay = require("promptpay-qr");
const { invalidatePattern } = require("../config/cache");
const { sendEmail } = require("../utils/email");
const { BOOKING_STATUS, PAYMENT_METHOD, USER_ROLE } = require("../utils/constants");
const {
  bookingNewOrder,
  bookingApproved,
  bookingRejected,
  bookingComplete,
  bookingSlipUploaded,
} = require("../utils/emailTemplates");

class BookingService {
  async createBooking(data, io) {
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
    } = data;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const overlapResult = await client.query(
        `SELECT * FROM bookings
        WHERE sub_field_id = $1
          AND status NOT IN ('${BOOKING_STATUS.REJECTED}', '${BOOKING_STATUS.CANCELLED}')
          AND (
            (start_date || ' ' || start_time)::timestamp < $3::timestamp
            AND (end_date || ' ' || end_time)::timestamp > $2::timestamp
          )
        FOR UPDATE`,
        [subFieldId, `${startDate} ${startTime}`, `${endDate} ${endTime}`]
      );

      const timeNow = DateTime.now().setZone("Asia/Bangkok");
      const timeSubmitDate = DateTime.fromISO(`${startDate}T${startTime}`, {
        zone: "Asia/Bangkok",
      });

      if (timeSubmitDate < timeNow) {
        throw new Error("ไม่สามารถเลือกเวลาที่ผ่านไปแล้วได้");
      }

      if (overlapResult.rows.length > 0) {
        throw new Error("ช่วงเวลาที่เลือกมีผู้จองแล้ว กรุณาเลือกเวลาใหม่");
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
          throw new Error(`ไม่พบสิ่งอำนวยความสะดวก "${facility.fac_name}" ในสนามนี้`);
        }

        const { field_fac_id, quantity_total, fac_name } = facInfoRes.rows[0];
        const quantityTotal = parseInt(quantity_total || 1, 10);

        const facBookedRes = await client.query(
          `SELECT COALESCE(SUM(bf.quantity), 0) AS booked_qty
           FROM booking_fac bf
           JOIN bookings b ON bf.booking_id = b.booking_id
           WHERE bf.field_fac_id = $1
             AND b.field_id = $2
             AND b.status NOT IN ('${BOOKING_STATUS.REJECTED}', '${BOOKING_STATUS.CANCELLED}')
             AND (
               (b.start_date || ' ' || b.start_time)::timestamp < $4::timestamp
               AND (b.end_date || ' ' || b.end_time)::timestamp > $3::timestamp
             )`,
          [field_fac_id, fieldId, `${startDate} ${startTime}`, `${endDate} ${endTime}`]
        );

        const bookedQty = parseInt(facBookedRes.rows[0]?.booked_qty || 0, 10);
        const requestedQty = parseInt(facility.quantity || 1, 10);

        if (bookedQty + requestedQty > quantityTotal) {
          throw new Error(`สิ่งอำนวยความสะดวก "${fac_name}" ถูกจองเต็มจำนวนในช่วงเวลานี้แล้ว (${bookedQty}/${quantityTotal})`);
        }
      }

      const bookingResult = await client.query(
        `INSERT INTO bookings (field_id, user_id, sub_field_id, booking_date, start_time, end_time, total_hours, total_price, pay_method, total_remaining, activity, status, start_date, end_date, selected_slots)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING booking_id`,
        [fieldId, userId, subFieldId, bookingDate, startTime, endTime, totalHours, totalPrice, payMethod, totalRemaining, activity, status, startDate, endDate, selectedSlots]
      );

      const bookingId = bookingResult.rows[0].booking_id;

      for (const facility of selectedFacilities || []) {
        await client.query(
          `INSERT INTO booking_fac (booking_id, field_fac_id, fac_name, quantity) 
           VALUES ($1, $2, $3, $4)`,
          [bookingId, facility.field_fac_id, facility.fac_name, Number(facility.quantity || 1)]
        );
      }

      const ownerRes = await client.query(
        `SELECT uf.user_id, uf.email AS field_owner_email, f.field_name
         FROM field f
         JOIN users uf ON uf.user_id = f.user_id
         WHERE f.field_id = $1`,
        [fieldId]
      );
      const owner = ownerRes.rows[0];

      if (owner?.field_owner_email) {
        sendEmail({
          to: owner.field_owner_email,
          subject: "มีการจองสนามของคุณ",
          html: bookingNewOrder({ fieldName: owner.field_name, bookingId }),
        }).catch(err => console.error("Email send error:", err));
      }

      const notifyData = await client.query(
        `INSERT INTO notifications (sender_id, recive_id, topic, messages, key_id, status)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [userId, owner.user_id, "new_booking", "มีการจองใหม่", bookingId, "unread"]
      );

      await client.query("COMMIT");

      if (io) {
        io.emit("slot_booked", { subFieldId, bookingDate, bookingId });
        io.to(owner.user_id.toString()).emit("new_notification", {
          notifyId: notifyData.rows[0].notify_id,
          topic: "new_booking",
          reciveId: owner.user_id,
          keyId: bookingId,
        });
      }

      await invalidatePattern(`statistics:field:${fieldId}:*`);
      return { success: true, bookingId };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getBookedBlock(subFieldId, startDate, endDate) {
    const result = await pool.query(
      `SELECT * FROM bookings WHERE sub_field_id = $1 AND booking_date >= $2 AND booking_date < $3 AND status IN ('${BOOKING_STATUS.PENDING}', '${BOOKING_STATUS.APPROVED}', '${BOOKING_STATUS.COMPLETE}', '${BOOKING_STATUS.VERIFIED}')`,
      [subFieldId, startDate, endDate]
    );
    return result.rows;
  }

  async getBookingsByUserId(userId, { date, status }) {
    const userResult = await pool.query(
      `SELECT user_name, first_name, last_name FROM users WHERE user_id = $1`,
      [userId]
    );
    if (userResult.rows.length === 0) throw new Error("ไม่พบผู้ใช้");

    let query = `
      SELECT 
        b.booking_id, b.user_id, b.field_id, f.field_name, f.gps_location, f.price_deposit, f.cancel_hours,
        b.sub_field_id, sf.sub_field_name, sf.price, b.booking_date, b.start_date, b.start_time, b.end_date, b.end_time,
        b.total_hours, b.total_price, b.total_remaining, b.pay_method, b.status, b.activity, b.selected_slots,
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

    const values = [userId];
    let i = 2;
    if (date) { query += ` AND b.start_date = $${i++}`; values.push(date); }
    if (status) { query += ` AND b.status = $${i++}`; values.push(status); }
    query += ` ORDER BY b.booking_date DESC, b.start_time ASC`;

    const result = await pool.query(query, values);
    return { user: userResult.rows[0], data: result.rows };
  }

  async getOrdersByFieldId(fieldId, { startDate, endDate, status, bookingDate }, currentUser) {
    const fieldRes = await pool.query(
      `SELECT user_id, field_name, status AS field_status FROM field WHERE field_id = $1`,
      [fieldId]
    );
    if (fieldRes.rowCount === 0) throw new Error("Field not found");
    const field = fieldRes.rows[0];

    if (field.user_id !== currentUser.user_id && currentUser.role !== USER_ROLE.ADMIN) {
      throw new Error("Unauthorized");
    }

    let query = `
      SELECT 
        b.booking_id, b.field_id, b.user_id, b.sub_field_id, b.booking_date, b.start_time, b.end_time,
        b.total_hours, b.total_price, b.pay_method, b.total_remaining, b.activity, b.status, b.created_at,
        b.start_date, b.end_date, u.first_name, u.last_name, sf.sub_field_name, b.selected_slots,
        (
          SELECT COALESCE(json_agg(jsonb_build_object(
            'field_fac_id', bf.field_fac_id,
            'fac_name', bf.fac_name,
            'quantity', bf.quantity
          )), '[]')
          FROM booking_fac bf
          WHERE bf.booking_id = b.booking_id
        ) AS facilities
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      JOIN sub_field sf ON b.sub_field_id = sf.sub_field_id
      WHERE b.field_id = $1
    `;

    const values = [fieldId];
    let i = 2;
    if (startDate && endDate) {
      query += ` AND b.start_date BETWEEN $${i} AND $${i + 1}`;
      values.push(startDate, endDate);
      i += 2;
    }
    if (status) { query += ` AND b.status = $${i++}`; values.push(status); }
    if (bookingDate) { query += ` AND b.booking_date = $${i++}`; values.push(bookingDate); }

    query += ` ORDER BY b.start_date DESC, b.start_time ASC`;
    const result = await pool.query(query, values);
    return { field, data: result.rows };
  }

  async getBookingDetails(bookingId) {
    const result = await pool.query(
      `SELECT 
        b.*, f.field_name, f.gps_location, f.price_deposit, f.cancel_hours, f.name_bank,
        f.account_holder, f.number_bank, f.user_id AS field_user_id, sf.sub_field_name, sf.price,
        u.first_name, u.last_name, u.email,
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
      LEFT JOIN users u ON b.user_id = u.user_id
      WHERE b.booking_id = $1`,
      [bookingId]
    );

    if (result.rows.length === 0) throw new Error("Booking not found");

    const slipRes = await pool.query(
        `SELECT * FROM payment WHERE booking_id = $1 ORDER BY created_at ASC`,
        [bookingId]
    );

    const bookingData = result.rows[0];
    if (bookingData) {
      if (!bookingData.deposit_slip || !bookingData.total_slip) {
        const depositPayment = slipRes.rows.find(p => p.deposit_slip);
        const totalPayment = slipRes.rows.find(p => p.total_slip);
        if (!bookingData.deposit_slip && depositPayment) {
          bookingData.deposit_slip = depositPayment.deposit_slip;
        }
        if (!bookingData.total_slip && totalPayment) {
          bookingData.total_slip = totalPayment.total_slip;
        }
      }
    }

    return { data: bookingData, slipAll: slipRes.rows };
  }

  async updateBookingStatus(bookingId, status, reasoning, io) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        `UPDATE bookings SET status = $1, reasoning = $2 WHERE booking_id = $3 RETURNING *`,
        [status, reasoning, bookingId]
      );
      if (result.rowCount === 0) throw new Error("Booking not found");
      const booking = result.rows[0];

      const userRes = await client.query(`SELECT email, first_name FROM users WHERE user_id = $1`, [booking.user_id]);
      const fieldRes = await client.query(`SELECT field_name FROM field WHERE field_id = $1`, [booking.field_id]);
      
      const notifyData = await client.query(
        `INSERT INTO notifications (sender_id, recive_id, topic, messages, key_id, status)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [null, booking.user_id, `booking_${status}`, reasoning || "อัปเดตสถานะ", bookingId, "unread"]
      );

      await client.query("COMMIT");

      if (io) {
        io.emit("slot_booked", {
          subFieldId: booking.sub_field_id,
          bookingDate: booking.booking_date,
          bookingId: bookingId
        });
        io.to(booking.user_id.toString()).emit("new_notification", {
          notifyId: notifyData.rows[0].notify_id,
          topic: `booking_${status}`,
          reciveId: booking.user_id,
          keyId: bookingId,
        });
      }

      if (userRes.rows[0]?.email) {
          const emailData = { fieldName: fieldRes.rows[0].field_name, bookingId, reasoning };
          let html;
          if (status === BOOKING_STATUS.APPROVED || status === BOOKING_STATUS.VERIFIED) html = bookingApproved(emailData);
          else if (status === BOOKING_STATUS.REJECTED) html = bookingRejected(emailData);
          else if (status === BOOKING_STATUS.COMPLETE) html = bookingComplete(emailData);

          if (html) {
              sendEmail({ to: userRes.rows[0].email, subject: `อัปเดตสถานะการจอง #${bookingId}`, html })
                .catch(err => console.error("Email send error:", err));
          }
      }

      return booking;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async cancelBooking(bookingId, { reasoning, cancel_time }, io, currentUser) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const bookingRes = await client.query(`SELECT * FROM bookings WHERE booking_id = $1`, [bookingId]);
      if (bookingRes.rowCount === 0) throw new Error("Booking not found");
      const booking = bookingRes.rows[0];

      const result = await client.query(
        `UPDATE bookings SET status = '${BOOKING_STATUS.CANCELLED}', reasoning = $1, cancel_time = $2 WHERE booking_id = $3 RETURNING *`,
        [reasoning, cancel_time, bookingId]
      );

      const isOwner = currentUser.role === USER_ROLE.FIELD_OWNER || currentUser.role === USER_ROLE.ADMIN;
      const topic = isOwner ? "booking_cancelled" : "cancel_booking_by_customer";
      const recive_id = isOwner ? booking.user_id : (await client.query(`SELECT user_id FROM field WHERE field_id = $1`, [booking.field_id])).rows[0].user_id;

      const notifyData = await client.query(
        `INSERT INTO notifications (sender_id, recive_id, topic, messages, key_id, status)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [currentUser.user_id, recive_id, topic, reasoning || "ยกเลิกการจอง", bookingId, "unread"]
      );

      await client.query("COMMIT");

      if (io) {
        io.emit("slot_booked", { subFieldId: booking.sub_field_id, bookingDate: booking.booking_date });
        io.to(recive_id.toString()).emit("new_notification", {
          notifyId: notifyData.rows[0].notify_id,
          topic,
          reciveId: recive_id,
          keyId: bookingId,
        });
      }

      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async uploadSlip(bookingId, { deposit_slip, total_slip }, io) {
      const client = await pool.connect();
      try {
          await client.query("BEGIN");
          let booking;
          let topic;
          const updateVal = deposit_slip || total_slip;

          if (deposit_slip) {
              const res = await client.query(
                  `UPDATE bookings SET status = $1, deposit_slip = $2 WHERE booking_id = $3 RETURNING *`,
                  [BOOKING_STATUS.PENDING, deposit_slip, bookingId]
              );
              booking = res.rows[0];
              topic = "deposit_payment_uploaded";
          } else {
              const res = await client.query(
                  `UPDATE bookings SET total_slip = $1 WHERE booking_id = $2 RETURNING *`,
                  [total_slip, bookingId]
              );
              booking = res.rows[0];
              topic = "total_slip_payment_uploaded";
          }


          const paymentCheck = await client.query(`SELECT * FROM payment WHERE booking_id = $1`, [bookingId]);
          if (paymentCheck.rowCount === 0) {
              await client.query(
                  `INSERT INTO payment (booking_id, ${deposit_slip ? "deposit_slip" : "total_slip"}) VALUES ($1, $2)`,
                  [bookingId, updateVal]
              );
          } else {
              await client.query(
                  `UPDATE payment SET ${deposit_slip ? "deposit_slip" : "total_slip"} = $1 WHERE booking_id = $2`,
                  [updateVal, bookingId]
              );
          }

          const ownerRes = await client.query(`SELECT user_id, field_name FROM field WHERE field_id = $1`, [booking.field_id]);
          const owner = ownerRes.rows[0];

          const notifyData = await client.query(
            `INSERT INTO notifications (sender_id, recive_id, topic, messages, key_id, status)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [booking.user_id, owner.user_id, topic, "มีการอัปโหลดสลิป", bookingId, "unread"]
          );

          await client.query("COMMIT");

          if (io) {
            io.emit("slot_booked", {
              subFieldId: booking.sub_field_id,
              bookingDate: booking.booking_date,
              bookingId: bookingId
            });
            io.to(owner.user_id.toString()).emit("new_notification", {
              notifyId: notifyData.rows[0].notify_id,
              topic,
              reciveId: owner.user_id,
              keyId: bookingId,
            });
          }

          const ownerEmailRes = await client.query(`SELECT email FROM users WHERE user_id = $1`, [owner.user_id]);
          if (ownerEmailRes.rows[0]?.email) {
              sendEmail({
                  to: ownerEmailRes.rows[0].email,
                  subject: `มีการอัปโหลดสลิปการจอง #${bookingId}`,
                  html: bookingSlipUploaded({ fieldName: owner.field_name, bookingId })
              }).catch(err => console.error("Email send error:", err));
          }

          return booking;
      } catch (error) {
          await client.query("ROLLBACK");
          throw error;
      } finally {
          client.release();
      }
  }

  async generateQRCode(bookingId, amount) {
      const result = await pool.query(`SELECT f.number_bank FROM bookings b JOIN field f ON b.field_id = f.field_id WHERE b.booking_id = $1`, [bookingId]);
      if (result.rows.length === 0) throw new Error("Booking not found");
      const mobileNumber = result.rows[0].number_bank;
      const payload = promptpay(mobileNumber, { amount: parseFloat(amount) });
      const svg = await qrcode.toDataURL(payload, { type: "image/png" });
      return svg;
  }
}

module.exports = new BookingService();
