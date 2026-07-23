const pool = require("../config/db");
const { DateTime } = require("luxon");
const { getCache, setCache, invalidateCache, invalidatePattern } = require("../config/cache");
const { BOOKING_STATUS } = require("../utils/constants");
const { sendEmail } = require("../utils/email");
const { bookingAutoCancelled } = require("../utils/emailTemplates");

/**
 * SlotLockEngine Module
 * Single source of truth for booking slot concurrency, lock acquisition,
 * timezone calculations (Asia/Bangkok), and automated expiration handling.
 */
class SlotLockEngine {
  /**
   * Check if a requested slot overlaps with existing active bookings.
   */
  async checkSlotOverlap(client, { subFieldId, startDate, startTime, endDate, endTime }) {
    const startIso = `${startDate} ${startTime}`;
    const endIso = `${endDate} ${endTime}`;

    const queryClient = client || pool;
    const overlapResult = await queryClient.query(
      `SELECT booking_id FROM bookings
       WHERE sub_field_id = $1
         AND status NOT IN ('${BOOKING_STATUS.REJECTED}', '${BOOKING_STATUS.CANCELLED}')
         AND (
           (COALESCE(start_date, booking_date) || ' ' || start_time)::timestamp < $3::timestamp
           AND (COALESCE(end_date, booking_date) || ' ' || end_time)::timestamp > $2::timestamp
         )
       FOR UPDATE`,
      [subFieldId, startIso, endIso]
    );

    return overlapResult.rows.length > 0;
  }

  /**
   * Invalidate slot availability cache for a sub-field and field.
   */
  async invalidateSlotCache(subFieldId, fieldId) {
    if (subFieldId) {
      await invalidatePattern(`bookings:subfield:${subFieldId}:*`);
    }
    if (fieldId) {
      await invalidatePattern(`statistics:field:${fieldId}:*`);
    }
  }

  /**
   * Get booked blocks for a sub-field within a date range.
   */
  async getSlotAvailability(subFieldId, startDate, endDate) {
    const cacheKey = `bookings:subfield:${subFieldId}:${startDate}:${endDate}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const result = await pool.query(
      `SELECT booking_id, booking_date, start_date, start_time, end_date, end_time, selected_slots, status
       FROM bookings
       WHERE sub_field_id = $1
         AND status NOT IN ('${BOOKING_STATUS.REJECTED}', '${BOOKING_STATUS.CANCELLED}')
         AND COALESCE(start_date, booking_date) >= $2
         AND COALESCE(start_date, booking_date) <= $3`,
      [subFieldId, startDate, endDate]
    );

    const data = result.rows;
    await setCache(cacheKey, data, 120); // 2 minutes TTL
    return data;
  }

  /**
   * Emit socket notification when slots are updated or unlocked.
   */
  emitSlotUpdate(io, { subFieldId, bookingDate, bookingId, action = "slot_booked" }) {
    if (!io) return;
    io.emit(action, {
      subFieldId,
      bookingDate,
      bookingId,
      timestamp: Date.now(),
    });
  }

  /**
   * Process expired locks and unpaid reservations (Runs via Cron or lifecycle triggers).
   * Lock Expiry: 60 minutes for unpaid deposits, or 10 minutes prior to match start.
   */
  async processExpiredLocks(io) {
    const now = DateTime.now().setZone("Asia/Bangkok");
    console.log("[SlotLockEngine] Processing expired locks at:", now.toISO());

    try {
      const expired = await pool.query(
        `DELETE FROM bookings b
         USING users u, field f
         WHERE b.user_id = u.user_id
           AND b.field_id = f.field_id
           AND b.status IN ('${BOOKING_STATUS.APPROVED}', '${BOOKING_STATUS.COMPLETE}', '${BOOKING_STATUS.VERIFIED}')
           AND f.price_deposit > 0
           AND b.booking_id NOT IN (SELECT booking_id FROM payment)
           AND (
             $1 > b.updated_at + INTERVAL '60 minutes'
             OR (
               b.updated_at > (COALESCE(b.start_date, b.booking_date) || ' ' || b.start_time)::timestamp - INTERVAL '10 minutes'
               AND $1 >= (COALESCE(b.start_date, b.booking_date) || ' ' || b.start_time)::timestamp
             )
           )
         RETURNING b.booking_id, b.sub_field_id, u.email, f.field_name, b.start_time, b.start_date, b.booking_date, b.field_id;`,
        [now.toISO()]
      );

      if (expired.rows.length > 0) {
        for (const row of expired.rows) {
          await this.invalidateSlotCache(row.sub_field_id, row.field_id);

          await sendEmail({
            to: row.email,
            subject: "การจองสนามของคุณถูกยกเลิกอัตโนมัติ",
            html: bookingAutoCancelled({
              fieldName: row.field_name,
              startTime: row.start_time,
              startDate: row.start_date || row.booking_date,
            }),
          }).catch((err) => console.error("[SlotLockEngine] Email error:", err.message));

          this.emitSlotUpdate(io, {
            subFieldId: row.sub_field_id,
            bookingDate: row.start_date || row.booking_date,
            bookingId: row.booking_id,
            action: "slot_booked",
          });
        }
        console.log(`[SlotLockEngine] Cleaned ${expired.rows.length} expired slot locks.`);
      }
      return expired.rows;
    } catch (err) {
      console.error("[SlotLockEngine] Error processing expired locks:", err.message);
      throw err;
    }
  }
}

module.exports = new SlotLockEngine();
