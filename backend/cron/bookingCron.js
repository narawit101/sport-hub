const cron = require("node-cron");
const pool = require("../config/db");
const { DateTime } = require("luxon");
const { sendEmail } = require("../utils/email");
const {
  bookingReminder,
  bookingStarted,
  bookingAutoCancelled,
} = require("../utils/emailTemplates");
const { invalidatePattern } = require("../config/cache");
const { BOOKING_STATUS } = require("../utils/constants");

module.exports = function (io) {
  cron.schedule(
    "*/5 * * * *",
    async () => {
      const now = DateTime.now().setZone("Asia/Bangkok");
      const todayStr = now.toFormat("yyyy-MM-dd");
      console.log(" CRON WORKING", now.toISO());

      try {
        const result = await pool.query(
          `
      SELECT b.*, u.email, f.field_name
      FROM bookings b
      JOIN users u ON u.user_id = b.user_id
      JOIN field f ON f.field_id = b.field_id
      WHERE b.status IN ('${BOOKING_STATUS.PENDING}', '${BOOKING_STATUS.APPROVED}') AND b.start_date = $1
    `,
          [todayStr]
        );

        console.log(` พบการจองทั้งหมด ${result.rows.length} รายการ`);

        for (const booking of result.rows) {
          try {
            const startTime = DateTime.fromISO(
              `${todayStr}T${booking.start_time}`,
              { zone: "Asia/Bangkok" }
            );
            const diffMinutes = startTime
              .diff(now, "minutes")
              .toObject().minutes;

            console.log(` ตรวจ booking: ${booking.booking_id}`);
            console.log(` startTime: ${startTime.toISO()}`);
            console.log(` nowTime:   ${now.toISO()}`);
            console.log(` diff:      ${diffMinutes.toFixed(2)} นาที`);

            if (diffMinutes >= 29 && diffMinutes <= 31) {
              await sendEmail({
                to: booking.email,
                subject: "ใกล้ถึงเวลาจองสนามแล้ว",
                html: bookingReminder({ fieldName: booking.field_name, startTime: booking.start_time, date: todayStr }),
              });

              console.log(` แจ้งเตือน: ${booking.email}`);
            } else if (diffMinutes === 0) {
              await sendEmail({
                to: booking.email,
                subject: "ถึงเวลาจองสนามแล้ว",
                html: bookingStarted({ fieldName: booking.field_name, startTime: booking.start_time, startDate: booking.start_date }),
              });

              console.log(` แจ้งเตือนเริ่มเตะ: ${booking.email}`);
            } else {
              console.log(
                ` ยังไม่ถึงเวลาแจ้งเตือน (${diffMinutes.toFixed(2)} นาที)`
              );
            }
          } catch (error) {
            console.warn(
              ` ข้าม booking ${booking.booking_id} เพราะ error:`,
              error.message
            );
          }
        }

        const expired = await pool.query(
          `
    DELETE FROM bookings b
    USING users u, field f
    WHERE b.user_id = u.user_id
      AND b.field_id = f.field_id
      AND b.status IN ('${BOOKING_STATUS.APPROVED}', '${BOOKING_STATUS.COMPLETE}','${BOOKING_STATUS.VERIFIED}')
      AND f.price_deposit > 0
      AND b.booking_id NOT IN (SELECT booking_id FROM payment)
      AND (
        $1 > b.updated_at + INTERVAL '60 minutes'
        OR (
          b.updated_at > (b.start_date || ' ' || b.start_time)::timestamp - INTERVAL '10 minutes'
          AND $1 >= (b.start_date || ' ' || b.start_time)::timestamp
        )
      )
    RETURNING b.booking_id, b.sub_field_id, u.email, f.field_name, b.start_time, b.start_date, b.field_id;
  `,
          [now.toISO()]
        );

        if (expired.rows.length > 0) {
          for (const row of expired.rows) {
            await invalidatePattern(`statistics:field:${row.field_id}:*`);
            await sendEmail({
              to: row.email,
              subject: "การจองสนามของคุณถูกยกเลิกอัตโนมัติ",
              html: bookingAutoCancelled({ fieldName: row.field_name, startTime: row.start_time, startDate: row.start_date }),
            });
            console.log(` ส่งแจ้งเตือนการลบไปยัง ${row.email}`);
            if (io) {
              io.emit("slot_booked", {
                subFieldId: row.sub_field_id,
                bookingDate: row.start_date,
                bookingId: row.booking_id,
              });
            }
          }

          console.log(
            ` ลบ booking หมดอายุทั้งหมด ${expired.rows.length} รายการ`
          );
        } else {
          console.log(" ไม่มี booking ที่ต้องลบ");
        }
      } catch (err) {
        console.error("เกิดข้อผิดพลาดใน CRON:", err.message);
      }
    },
    {
      timezone: "Asia/Bangkok",
    }
  );
};
