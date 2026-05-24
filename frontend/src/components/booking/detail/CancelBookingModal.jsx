import React from "react";

export default function CancelBookingModal({
  onConfirm,
  onClose,
  reasoningCancel,
  setReasoningCancel,
}) {
  return (
    <div className="modal-overlay-order-detail">
      <div className="modal-content-order-detail">
        <div className="modal-header-order-detail">
          <h2>ยกเลิกการจอง</h2>
        </div>
        <div className="resoning-booking-detail">
          <textarea
            placeholder="กรุณาใส่เหตุผลที่ยกเลิกการจอง"
            required
            maxLength={300}
            value={reasoningCancel}
            onChange={(e) => {
              setReasoningCancel(e.target.value);
            }}
          />
        </div>
        <div className="modal-actions-order-detail">
          <button
            className="modal-confirm-btn-order-detail"
            style={{
              cursor: reasoningCancel.length === 0 ? "not-allowed" : "pointer",
            }}
            disabled={reasoningCancel.length === 0}
            onClick={onConfirm}
          >
            ยืนยัน
          </button>
          <button className="modal-cancel-btn-order-detail" onClick={onClose}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}
