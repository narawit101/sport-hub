const bookingService = require("../services/bookingService");

class BookingController {
  async createBooking(req, res) {
    try {
      const data = JSON.parse(req.body.data);
      const result = await bookingService.createBooking(data, req.io);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error saving booking:", error);
      res.status(500).json({ success: false, message: error.message || "Unexpected error" });
    }
  }

  async getBookedBlock(req, res) {
    const { subFieldId, startDate, endDate } = req.params;
    try {
      const data = await bookingService.getBookedBlock(subFieldId, startDate, endDate);
      res.status(200).json({ data });
    } catch (error) {
      console.error("Error fetching booked range:", error);
      res.status(500).json({ success: false, error: "Database error" });
    }
  }

  async getMyBookings(req, res) {
    const { user_id } = req.params;
    const { date, status } = req.query;
    try {
      const result = await bookingService.getBookingsByUserId(user_id, { date, status });
      res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ success: false, error: error.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล" });
    }
  }

  async getMyOrders(req, res) {
    const { field_id } = req.params;
    const { startDate, endDate, status, bookingDate } = req.query;
    try {
      const result = await bookingService.getOrdersByFieldId(field_id, { startDate, endDate, status, bookingDate }, req.user);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ success: false, error: error.message || "เกิดข้อผิดพลาด" });
    }
  }

  async getBookingDetails(req, res) {
    const { booking_id } = req.params;
    try {
      const result = await bookingService.getBookingDetails(booking_id);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching booking details:", error);
      res.status(error.message === "Booking not found" ? 404 : 500).json({ success: false, error: error.message });
    }
  }

  async updateBookingStatus(req, res) {
    const { booking_id } = req.params;
    const { booking_status, reasoning } = req.body;
    try {
      const result = await bookingService.updateBookingStatus(booking_id, booking_status, reasoning, req.io);
      res.status(200).json({ success: true, booking: result });
    } catch (error) {
      console.error("Error updating status:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async cancelBooking(req, res) {
    const { booking_id } = req.params;
    const { reasoning, cancel_time } = req.body;
    try {
      const result = await bookingService.cancelBooking(booking_id, { reasoning, cancel_time }, req.io, req.user);
      res.status(200).json({ success: true, message: "ยกเลิกการจองสำเร็จ", booking: result });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async uploadSlip(req, res) {
    const { booking_id } = req.params;
    const deposit_slip = req.files["deposit_slip"]?.[0]?.path;
    const total_slip = req.files["total_slip"]?.[0]?.path;
    try {
      const result = await bookingService.uploadSlip(booking_id, { deposit_slip, total_slip }, req.io);
      res.status(200).json({ success: true, booking: result });
    } catch (error) {
      console.error("Error uploading slip:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async generateQRCode(req, res) {
    const { bookingId, amount } = req.body;
    try {
      const qrCode = await bookingService.generateQRCode(bookingId, amount);
      res.status(200).json({ qrCode });
    } catch (error) {
      console.error("Error generating QR Code:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new BookingController();
