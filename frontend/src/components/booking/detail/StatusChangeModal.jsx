import React from "react";
import { BOOKING_STATUS } from "@/constants/status";

const getStatusLabel = (status) => {
  switch (status) {
    case BOOKING_STATUS.APPROVED:
      return { text: "อนุมัติ", className: "approved" };
    case BOOKING_STATUS.REJECTED:
      return { text: "ไม่อนุมัติ", className: "rejected" };
    case BOOKING_STATUS.PENDING:
      return { text: "รอตรวจสอบ", className: "pending" };
    case BOOKING_STATUS.COMPLETE:
      return { text: "การจองสำเร็จ", className: "complete" };
    case BOOKING_STATUS.VERIFIED:
      return { text: "ตรวจสอบสลิปมัดจำแล้ว", className: "complete" };
    case BOOKING_STATUS.CANCELLED:
      return { text: "ยกเลิกแล้ว", className: "rejected" };
    default:
      return { text: "ไม่ทราบสถานะ", className: "unknown" };
  }
};

export default function StatusChangeModal({
  newStatus,
  onConfirm,
  onClose,
  reasoning,
  setReasoning,
}) {
  const { text, className } = getStatusLabel(newStatus);

  return (
    <div className="modal-overlay-order-detail">
      <div className="modal-content-order-detail">
        <div className="modal-header-order-detail">
          <h2>เปลี่ยนสถานะการจอง</h2>
          <div className={`status-label-order-detail ${className}`}>
            <strong>{text}</strong>
          </div>
          {newStatus === BOOKING_STATUS.REJECTED && (
            <div className="resoning-booking-detail">
              <textarea
                placeholder="กรุณาใส่เหตุผลที่ไม่ผ่านการอนุมัติ"
                required
                maxLength={300}
                value={reasoning}
                onChange={(e) => {
                  setReasoning(e.target.value);
                }}
              />
            </div>
          )}
        </div>
        <div className="modal-actions-order-detail">
          <button
            disabled={reasoning.length === 0 && newStatus === BOOKING_STATUS.REJECTED}
            className="btn-primary-premium modal-confirm-btn-order-detail"
            onClick={onConfirm}
          >
            ยืนยัน
          </button>
          <button className="btn-secondary-premium modal-cancel-btn-order-detail" onClick={onClose}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}
