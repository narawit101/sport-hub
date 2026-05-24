import React from "react";
import { BOOKING_STATUS, PAYMENT_METHOD } from "@/constants/status";

export default function BookingActions({
  booking,
  user,
  openConfirmModal,
  setShowCancelModal,
  handleOpenReviewModal,
  reviewData,
  startProcessLoad,
}) {
  const isFieldOwner = booking.field_user_id === user?.user_id;
  const isCustomer = booking.user_id === user?.user_id;
  const status = booking.status;

  const isTransfer = booking.pay_method === PAYMENT_METHOD.TRANSFER;
  const needsDeposit = Number(booking.price_deposit) > 0;
  const isApproveDisabled = startProcessLoad || (
    isTransfer && (
      (needsDeposit && !booking.deposit_slip) ||
      (!needsDeposit && !booking.total_slip)
    )
  );
  const isCompleteDisabled = startProcessLoad || (
    isTransfer && Number(booking.total_remaining) > 0 && !booking.total_slip
  );

  return (
    <div className="booking-actions-order-detail">
      {isFieldOwner && (
        <div className="status-buttons-order-detail">
          {status === BOOKING_STATUS.PENDING && (
            <>
              <button
                className="approve-btn-order-detail"
                onClick={() => openConfirmModal(BOOKING_STATUS.APPROVED)}
                disabled={isApproveDisabled}
                style={{ cursor: isApproveDisabled ? "not-allowed" : "pointer", background: isApproveDisabled ? "#94a3b8" : "" }}
              >
                อนุมัติการจอง
              </button>
              {isTransfer && needsDeposit && booking.deposit_slip && (
                <button
                  className="complete-deposit-btn-order-detail"
                  onClick={() => openConfirmModal(BOOKING_STATUS.VERIFIED)}
                  disabled={startProcessLoad}
                  style={{ background: "#0369a1" }}
                >
                  อนุมัติและยืนยันสลิป
                </button>
              )}
              <button
                className="reject-btn-order-detail"
                onClick={() => openConfirmModal(BOOKING_STATUS.REJECTED)}
                disabled={startProcessLoad}
              >
                ไม่อนุมัติ
              </button>
            </>
          )}

          {status === BOOKING_STATUS.APPROVED && Number(booking.price_deposit) > 0 && (
            <button
              className="complete-deposit-btn-order-detail"
              onClick={() => openConfirmModal(BOOKING_STATUS.VERIFIED)}
              disabled={startProcessLoad}
            >
              ตรวจสอบสลิปค่ามัดจำเสร็จสิ้น
            </button>
          )}

          {(status === BOOKING_STATUS.VERIFIED || (status === BOOKING_STATUS.APPROVED && Number(booking.price_deposit) === 0)) && (
            <button
              className="complete-btn-order-detail"
              onClick={() => openConfirmModal(BOOKING_STATUS.COMPLETE)}
              disabled={isCompleteDisabled}
              style={{ cursor: isCompleteDisabled ? "not-allowed" : "pointer" }}
            >
              การจองสำเร็จ
            </button>
          )}

          {(status === BOOKING_STATUS.APPROVED || status === BOOKING_STATUS.PENDING || status === BOOKING_STATUS.VERIFIED) && (
            <button
              className="cancel-booking-btn-order-detail"
              onClick={() => setShowCancelModal(true)}
              disabled={startProcessLoad}
            >
              ยกเลิกการจอง
            </button>
          )}
        </div>
      )}

      {isCustomer && (
        <div className="customer-actions">
          {status === BOOKING_STATUS.COMPLETE && reviewData.length === 0 && (
            <button
              className="btn-review-detail"
              onClick={handleOpenReviewModal}
              disabled={startProcessLoad}
            >
              เขียนรีวิว
            </button>
          )}
          {(status === BOOKING_STATUS.PENDING || status === BOOKING_STATUS.APPROVED || status === BOOKING_STATUS.VERIFIED) && (
            <button
              className="cancel-booking-btn-order-detail"
              onClick={() => setShowCancelModal(true)}
              disabled={startProcessLoad}
            >
              ยกเลิกการจอง
            </button>
          )}
        </div>
      )}
    </div>
  );
}
