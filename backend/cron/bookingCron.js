const cron = require("node-cron");
const pool = require("../config/db");
const { DateTime } = require("luxon");
const { sendEmail } = require("../utils/email");
const { bookingReminder, bookingStarted } = require("../utils/emailTemplates");
const { BOOKING_STATUS } = require("../utils/constants");
const slotLockEngine = require("../services/slotLockEngine");

module.exports = function (io) {
  cron.schedule(
    "*/5 * * * *",
    async () => {
      const now = DateTime.now().setZone("Asia/Bangkok");
      const todayStr = now.toFormat("yyyy-MM-dd");
      console.log(" CRON WORKING", now.toISO());

      try {
        const result = await pool.query(
          `SELECT b.*, u.email, f.field_name
           FROM bookings b
           JOIN users u ON u.user_id = b.user_id
           JOIN field f ON f.field_id = b.field_id
           WHERE b.status IN ('${BOOKING_STATUS.PENDING}', '${BOOKING_STATUS.APPROVED}') AND b.start_date = $1`,
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
            }
          } catch (error) {
            console.warn(` ข้าม booking ${booking.booking_id} เพราะ error:`, error.message);
          }
        }

        // Delegate lock expiration and slot releases to SlotLockEngine
        await slotLockEngine.processExpiredLocks(io);
      } catch (err) {
        console.error("เกิดข้อผิดพลาดใน CRON:", err.message);
      }
    },
    {
      timezone: "Asia/Bangkok",
    }
  );
};
