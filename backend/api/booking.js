const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const authMiddleware = require("../middlewares/auth");
const { createUploader } = require("../utils/upload");
const { createRateLimiter } = require("../utils/rateLimiter");
const { DateTime } = require("luxon");

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

module.exports = function (io) {
  // Attach io to req
  router.use((req, res, next) => {
    req.io = io;
    next();
  });

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
        }
      });

      socket.on('disconnect', () => {
        if (joinedBooking) global.__bookingClients.delete(socket.id);
        if (global.__bookingClients.size === 0 && global.__serverTimeTicker) {
          clearInterval(global.__serverTimeTicker);
          global.__serverTimeTicker = null;
        }
      });
    });
  }

  // Routes
  router.get("/server-time", (req, res) => {
    res.status(200).json({ timestamp: Date.now() });
  });
  router.post("/", authMiddleware, LimiterBookingsRequest, upload.fields([{ name: "deposit_slip" }]), bookingController.createBooking);
  router.get("/booked-block/:subFieldId/:startDate/:endDate", authMiddleware, bookingController.getBookedBlock);
  router.get("/my-bookings/:user_id", authMiddleware, bookingController.getMyBookings);
  router.get("/my-orders/:field_id", authMiddleware, bookingController.getMyOrders);
  router.get("/bookings-detail/:booking_id", authMiddleware, bookingController.getBookingDetails);
  router.put("/booking-status/:booking_id", authMiddleware, bookingController.updateBookingStatus);
  router.put("/cancel-bookings/:booking_id", authMiddleware, bookingController.cancelBooking);
  
  router.post("/upload-slip/:booking_id", authMiddleware, upload.fields([{ name: "deposit_slip" }, { name: "total_slip" }]), bookingController.uploadSlip);
  router.put("/upload-slip/:booking_id", authMiddleware, upload.fields([{ name: "total_slip" }]), bookingController.uploadSlip);
  router.post("/gen-qr", authMiddleware, bookingController.generateQRCode);

  return router;
};
