"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import NotFoundCard from "@/components/ui/NotFoundCard";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";

import "@/app/css/order-detail.css";
import { useSocket } from "@/app/contexts/SocketContext";
import {
  formatPrice,
  formatDateToThai,
  getBookingStatusDisplay,
} from "@/app/utils/format";
import apiClient from "@/lib/apiClient";
import { useNotification } from "@/app/contexts/NotificationContext";
import { USER_STATUS, BOOKING_STATUS } from "@/constants/status";

import StatusChangeModal from "@/components/booking/detail/StatusChangeModal";
import CancelBookingModal from "@/components/booking/detail/CancelBookingModal";
import PaymentSection from "@/components/booking/detail/PaymentSection";
import BookingInfo from "@/components/booking/detail/BookingInfo";
import ReviewModal from "@/components/booking/detail/ReviewModal";
import BookingActions from "@/components/booking/detail/BookingActions";

export default function BookingDetail() {
  const { user, isLoading } = useAuth();
  const { notify } = useNotification();
  const socket = useSocket();
  const [booking, setBooking] = useState(null);
  const router = useRouter();
  const { booking_id } = useParams();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [depositSlip, setDepositSlip] = useState(null);
  const [totalSlip, setTotalSlip] = useState(null);
  const [imgPreviewTotal, setImgPreviewTotal] = useState("");
  const [imgPreviewDeposit, setImgPreviewDeposit] = useState("");
  const [dataLoading, setDataLoading] = useState(true);

  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  const [canUploadslip, setCanUploadslip] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const handleOpenReviewModal = () => setShowReviewModal(true);
  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setRating(0);
    setComment("");
  };
  const [reviewData, setReviewData] = useState([]);
  const [qrCode, setQrCode] = useState(null);
  const [reasoning, setReasoning] = useState("");
  const [reasoningCancel, setReasoningCancel] = useState("");
  const [notFoundFlag, setNotFoundFlag] = useState(false);
  const [editSlip, setEditSlip] = useState(false);
  const [slipAll, setSlipAll] = useState([]);

  usePreventLeave(startProcessLoad);
  useEffect(() => {
    if (isLoading || !booking_id) return;

    if (!user) {
      const encoded = encodeURIComponent(`/booking-detail/${booking_id}`);
      router.push(`/login?redirectTo=${encoded}`);
    } else if (user?.status !== USER_STATUS.VERIFIED) {
      router.replace("/verification");
    }
  }, [user, isLoading, booking_id, router]);

  const fetchData = useCallback(async () => {
    try {
      if (!booking_id) return;

      const data = await apiClient.get(
        `/booking/bookings-detail/${booking_id}`,
      );
      setBooking(data.data);
      setSlipAll(data.slipAll || []);
    } catch (error) {
      console.error("Fetch error:", error);
      if (error.status === 404) {
        setNotFoundFlag(true);
      }
    } finally {
      setDataLoading(false);
    }
  }, [booking_id]);

  const fetchReview = useCallback(async () => {
    try {
      const data = await apiClient.get(`/reviews/get/${booking_id}`);
      if (data && data.data) {
        setReviewData([data.data]);
      } else {
        setReviewData([]);
      }
    } catch (error) {
      console.error("Error fetching review:", error);
      setReviewData([]);
    }
  }, [booking_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  useEffect(() => {
    const readNotifications = async () => {
      if (!booking_id) return;
      try {
        await apiClient.put("/notification/read-notification", {
          key_id: Number(booking_id),
        });
        window.dispatchEvent(
          new CustomEvent("notifications-marked-read", {
            detail: { key_id: Number(booking_id) },
          }),
        );
      } catch (error) {
        console.error("Error marking notifications as read:", error);
      }
    };

    readNotifications();
  }, [booking_id]);

  useEffect(() => {
    if (!socket) return;

    const handleSlotBooked = (data) => {
      if (String(data.bookingId) === String(booking_id)) fetchData();
    };

    const handleReviewPosted = (data) => {
      if (String(data.bookingId) === String(booking_id)) fetchReview();
    };

    const handleNewNotification = (data) => {
      if (String(data.keyId) === String(booking_id)) {
        console.log("Real-time update: status changed, reloading detail...");
        fetchData();
      }
    };

    socket.on("slot_booked", handleSlotBooked);
    socket.on("review_posted", handleReviewPosted);
    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("slot_booked", handleSlotBooked);
      socket.off("review_posted", handleReviewPosted);
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket, booking_id, fetchData, fetchReview]);

  const formatDate = (isoString) => formatDateToThai(isoString);

  const getCancelDeadlineTime = (start_date, start_time, cancel_hours) => {
    if (
      !start_date ||
      !start_time ||
      cancel_hours === undefined ||
      cancel_hours === null
    )
      return "-";
    const cleanDate = start_date.includes("T")
      ? start_date.split("T")[0]
      : start_date;
    const bookingDateTime = new Date(`${cleanDate}T${start_time}+07:00`);
    if (isNaN(bookingDateTime.getTime())) return "-";
    bookingDateTime.setHours(bookingDateTime.getHours() - cancel_hours);
    return bookingDateTime.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const calTotalHours = (totalHours) => {
    if (totalHours === 0.5) return "30 นาที";
    else if (totalHours % 1 === 0.5)
      return `${Math.floor(totalHours)} ชั่วโมง 30 นาที`;
    else return `${totalHours} ชั่วโมง`;
  };

  const openConfirmModal = (status) => {
    setNewStatus(status);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setReasoning("");
  };

  const updateStatus = async (status, b_id, reason) => {
    if (!b_id || isNaN(Number(b_id))) {
      notify("booking_id ไม่ถูกต้อง", "error");
      return;
    }
    if (status === BOOKING_STATUS.REJECTED && reason.length === 0) {
      notify("กรุณาใส่เหตุผลที่ไม่อนุมัติ", "error");
      return;
    }
    SetstartProcessLoad(true);
    try {
      await apiClient.put(`/booking/booking-status/${b_id}`, {
        booking_status: status,
        reasoning: reason,
      });

      notify(`อัปเดตสถานะสำเร็จ`, "success");
      const updatedData = await apiClient.get(
        `/booking/bookings-detail/${b_id}`,
      );
      setBooking(updatedData.data);
      closeConfirmModal();
    } catch (error) {
      notify(error.message || "เกิดข้อผิดพลาดในการอัปเดตสถานะ", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const confirmCancelBooking = async () => {
    SetstartProcessLoad(true);
    try {
      const data = await apiClient.put(
        `/booking/cancel-bookings/${booking.booking_id}`,
        {
          cancel_time: new Date().toISOString(),
          reasoning: reasoningCancel,
        },
      );
      notify(data.message, "success");
      setTimeout(() => router.push("/"), 2000);
    } catch (error) {
      notify(error.message || "เกิดข้อผิดพลาดในการยกเลิกการจอง", "error");
    } finally {
      setShowCancelModal(false);
      SetstartProcessLoad(false);
    }
  };

  const handleDepositSlip = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      notify("ไฟล์รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 5MB)", "error");
      return;
    }
    if (file && file.type.startsWith("image/")) {
      setDepositSlip(file);
      setCanUploadslip(true);
      setImgPreviewDeposit(URL.createObjectURL(file));
    }
  };

  const handleTotalSlip = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      notify("ไฟล์รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 5MB)", "error");
      return;
    }
    if (file && file.type.startsWith("image/")) {
      setTotalSlip(file);
      setCanUploadslip(true);
      setImgPreviewTotal(URL.createObjectURL(file));
    }
  };

  const uploadSlip = async () => {
    if (!depositSlip) {
      notify("กรุณาแนบสลิป", "error");
      return false;
    }
    const formData = new FormData();
    formData.append("deposit_slip", depositSlip);
    SetstartProcessLoad(true);
    try {
      await apiClient.postForm(
        `/booking/upload-slip/${booking.booking_id}`,
        formData,
      );
      notify("อัปโหลดเรียบร้อยแล้ว", "success");
      fetchData();
      setDepositSlip(null);
      setImgPreviewDeposit("");
      setEditSlip(false);
      return true;
    } catch (err) {
      notify(err.message || "เกิดข้อผิดพลาดในการอัปโหลด", "error");
      return false;
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const uploadTotalSlip = async () => {
    if (!totalSlip) {
      notify("กรุณาแนบสลิป", "error");
      return false;
    }
    const formData = new FormData();
    formData.append("total_slip", totalSlip);
    SetstartProcessLoad(true);
    try {
      await apiClient.putForm(
        `/booking/upload-slip/${booking.booking_id}`,
        formData,
      );
      notify("อัปโหลดเรียบร้อยแล้ว", "success");
      fetchData();
      setTotalSlip(null);
      setImgPreviewTotal("");
      return true;
    } catch (err) {
      notify(err.message || "เกิดข้อผิดพลาดในการอัปโหลด", "error");
      return false;
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const handleGenQR = async (b_id, amount) => {
    SetstartProcessLoad(true);
    try {
      const data = await apiClient.post("/booking/gen-qr", {
        bookingId: b_id,
        amount: amount,
      });
      setQrCode(data.qrCode);
      notify("สร้าง QR Code สำเร็จ", "success");
    } catch (error) {
      notify(error.message || "ไม่สามารถสร้าง QR Code ได้", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!rating || rating < 1) {
      notify("กรุณาให้คะแนนการรีวิว", "error");
      return;
    }
    if (comment.trim().length === 0) {
      notify("กรุณาเขียนรีวิว", "error");
      return;
    }
    SetstartProcessLoad(true);
    try {
      await apiClient.post("/reviews/post", {
        booking_id: booking.booking_id,
        field_id: booking.field_id,
        rating,
        comment,
        user_id: user?.user_id,
      });
      notify("เขียนรีวิวสำเร็จ", "success");
      handleCloseReviewModal();
      fetchReview();
    } catch (error) {
      notify(error.message || "เกิดข้อผิดพลาด", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  if (dataLoading)
    return (
      <div className="load">
        <span className="spinner"></span>
      </div>
    );

  if (notFoundFlag)
    return (
      <NotFoundCard
        title="ไม่พบการจองนี้"
        description="รายการจองที่คุณพยายามเข้าถึงอาจถูกลบ ยกเลิก หรือไม่มีอยู่จริง"
        primaryLabel="ไปหน้าการจองของฉัน"
        onPrimary={() => router.replace("/my-booking")}
      />
    );

  if (!booking) return null;

  const statusDisplay = getBookingStatusDisplay(booking);

  return (
    <div className="order-detail">
      <div className="order-detail-header-premium">
        <div className="header-main-content">
          <div className="field-info-main">
            <h1 className="field-name-premium">{booking.field_name}</h1>
            <div className="sub-field-name-premium">
              สนามย่อย: {booking.sub_field_name}
            </div>
          </div>

          <div className="booker-info-row">
            <span className="booker-label">ผู้จอง:</span>
            <span className="booker-name">
              {booking.first_name} {booking.last_name}
            </span>
          </div>
        </div>

        <div className="header-status-side">
          <div className="booking-id-badge">
            รหัสการจอง: #{booking.booking_id}
          </div>
          <div className={`status-badge-premium ${statusDisplay.className}`}>
            {statusDisplay.text}
          </div>
        </div>
      </div>

      <div className="booking-detail-grid">
        <div className="booking-info-column">
          <BookingInfo
            booking={booking}
            formatDate={formatDate}
            calTotalHours={calTotalHours}
            getCancelDeadlineTime={getCancelDeadlineTime}
          />

          {reviewData.length > 0 && (
            <div className="review-result-detail">
              <strong className="score-detail">
                คะแนนการจอง:
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    className={`star-detail ${s <= reviewData[0].rating ? "active" : ""}`}
                  >
                    ★
                  </span>
                ))}
              </strong>
              <strong className="comment-detail">
                ความคิดเห็น:
                <p> {reviewData[0].comment}</p>
              </strong>
            </div>
          )}
        </div>

        <div className="booking-payment-column">
          <PaymentSection
            booking={booking}
            user={user}
            qrCode={qrCode}
            handleGenQR={handleGenQR}
            booking_id={booking_id}
            editSlip={editSlip}
            setEditSlip={setEditSlip}
            depositSlip={depositSlip}
            handleDepositSlip={handleDepositSlip}
            imgPreviewDeposit={imgPreviewDeposit}
            setImgPreviewDeposit={setImgPreviewDeposit}
            setDepositSlip={setDepositSlip}
            uploadSlip={uploadSlip}
            totalSlip={totalSlip}
            handleTotalSlip={handleTotalSlip}
            imgPreviewTotal={imgPreviewTotal}
            setImgPreviewTotal={setImgPreviewTotal}
            setTotalSlip={setTotalSlip}
            uploadTotalSlip={uploadTotalSlip}
            startProcessLoad={startProcessLoad}
            canUploadslip={canUploadslip}
            setQrCode={setQrCode}
          />
        </div>
      </div>

      <BookingActions
        booking={booking}
        user={user}
        openConfirmModal={openConfirmModal}
        setShowCancelModal={setShowCancelModal}
        handleOpenReviewModal={handleOpenReviewModal}
        reviewData={reviewData}
        startProcessLoad={startProcessLoad}
      />

      {showConfirmModal && (
        <StatusChangeModal
          newStatus={newStatus}
          onConfirm={() => updateStatus(newStatus, booking_id, reasoning)}
          onClose={closeConfirmModal}
          reasoning={reasoning}
          setReasoning={setReasoning}
        />
      )}

      {showCancelModal && (
        <CancelBookingModal
          onConfirm={confirmCancelBooking}
          onClose={() => setShowCancelModal(false)}
          reasoningCancel={reasoningCancel}
          setReasoningCancel={setReasoningCancel}
        />
      )}

      <ReviewModal
        showReviewModal={showReviewModal}
        handleCloseReviewModal={handleCloseReviewModal}
        rating={rating}
        setRating={setRating}
        comment={comment}
        setComment={setComment}
        handleSubmitReview={handleSubmitReview}
        startProcessLoad={startProcessLoad}
      />
    </div>
  );
}
