import React from "react";
import { formatPrice } from "@/app/utils/format";
import { ACCOUNT_TYPE } from "@/constants/status";

export default function UploadSlipModal({
  isOpen,
  onClose,
  title,
  booking,
  qrCode,
  handleGenQR,
  amount,
  startProcessLoad,
  fileInputHandler,
  imgPreview,
  selectedFile,
  onUpload,
  onCancel,
  copied,
  handleCopy,
}) {
  if (!isOpen) return null;

  const renderBankAccountInfo = () => {
    if (booking?.name_bank === ACCOUNT_TYPE.PROMPTPAY) return null;

    return (
      <div
        className="premium-bank-card"
        style={{ textAlign: "left", margin: "10px auto 20px auto" }}
      >
        <div className="bank-logo-row">
          <span className="bank-name-badge">{booking.name_bank}</span>
          <div className="bank-holder-row">
            <div className="holder-label">ชื่อบัญชีผู้รับเงิน</div>
            <div className="holder-name">{booking.account_holder}</div>
          </div>
        </div>
        <div className="bank-account-number-row">
          <span className="bank-account-number">{booking.number_bank}</span>
          <button
            type="button"
            className={`copy-btn-premium ${copied ? "copied" : ""}`}
            onClick={() => handleCopy(booking.number_bank)}
          >
            {copied ? "คัดลอกสำเร็จ" : "คัดลอก"}
          </button>
        </div>
      </div>
    );
  };

  const renderQRSection = () => {
    if (booking?.name_bank !== ACCOUNT_TYPE.PROMPTPAY) return null;

    return (
      <div className="premium-qr-card-unified" style={{ marginBottom: "20px" }}>
        {/* PromptPay Header */}

        {/* PromptPay Details */}
        <div className="promptpay-details-unified">
          <div className="detail-row">
            <span className="detail-label">
              เบอร์โทรศัพท์ / เลขประจำตัว (PromptPay ID)
            </span>
            <div className="promptpay-number-copy-row">
              <strong className="detail-value monospace">
                {booking.number_bank}
              </strong>

              <button
                type="button"
                className={`copy-btn-premium ${copied ? "copied" : ""}`}
                onClick={() => handleCopy(booking.number_bank)}
              >
                {copied ? "คัดลอกสำเร็จ" : "คัดลอก"}
              </button>
            </div>
          </div>
          <div className="detail-row">
            <span className="detail-label">ชื่อบัญชีผู้รับเงิน</span>
            <strong className="detail-value">{booking.account_holder}</strong>
          </div>
        </div>

        {/* QR Section */}
        <div className="qr-header-promptpay-unified">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5fFvHNeNx1a2PAmCMPLORgS-yE2c4bLWe0g&s"
            alt="PromptPay"
            className="promptpay-logo-img"
          />
          <span className="card-type-unified">
            โอนเงินผ่านระบบพร้อมเพย์ (PromptPay)
          </span>
        </div>
        <div className="qr-code-section-unified">
          {!qrCode ? (
            <button
              type="button"
              className="premium-action-btn gen-qr-btn"
              onClick={() => handleGenQR(booking.booking_id, amount)}
              disabled={startProcessLoad}
              style={{ width: "100%" }}
            >
              {startProcessLoad ? (
                <span className="dot-loading">
                  กำลังสร้าง QR<span className="dot one">.</span>
                  <span className="dot two">.</span>
                  <span className="dot three">.</span>
                </span>
              ) : (
                `สร้าง QR Code สแกนจ่าย ${formatPrice(amount)} บาท`
              )}
            </button>
          ) : (
            <div className="qr-content-wrapper">
              <div className="qr-body-code">
                <img src={qrCode} alt="QR Code" className="qr-image-display" />
              </div>
              <div className="qr-footer-info">
                <span>สแกน QR Code ด้วยแอปธนาคารเพื่อจ่ายเงิน</span>
                <strong>ยอดโอน {formatPrice(amount)} บาท</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderUploadZone = () => (
    <label
      className="file-upload-zone-premium"
      style={{ marginBottom: "20px" }}
    >
      <input
        type="file"
        onChange={fileInputHandler}
        accept="image/*"
        className="hidden-file-input-premium"
      />
      <div className="upload-zone-content">
        <svg
          className="upload-icon-svg"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{
            width: "36px",
            height: "36px",
            color: "#64748b",
            marginBottom: "4px",
          }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
        <span
          className="upload-label-main"
          style={{ fontSize: "0.95rem", fontWeight: "700" }}
        >
          {selectedFile ? "เลือกสลิปอื่น" : "เลือกรูปภาพสลิปการโอนเงิน"}
        </span>
        <span className="upload-label-sub" style={{ fontSize: "0.75rem" }}>
          รองรับไฟล์ภาพ JPG, PNG ขนาดไม่เกิน 5MB
        </span>
      </div>
    </label>
  );

  return (
    <div className="modal-overlay-order-detail">
      <div className="modal-content-order-detail">
        <div className="modal-header-order-detail">
          <h2>{title}</h2>
          <button className="close-modal-btn" onClick={onCancel}>
            ✕
          </button>
        </div>

        <div
          style={{ maxHeight: "65vh", overflowY: "auto", paddingRight: "4px" }}
        >
          {renderBankAccountInfo()}
          {renderQRSection()}
          {renderUploadZone()}

          {imgPreview && (
            <div
              className="slip-item-card"
              style={{ maxWidth: "260px", margin: "0 auto 20px auto" }}
            >
              <div className="slip-card-header">ตัวอย่างสลิปที่เลือก</div>
              <div className="slip-image-wrapper">
                <img
                  src={imgPreview}
                  alt="preview"
                  className="slip-img-display"
                />
              </div>
            </div>
          )}
        </div>

        <div
          className="button-row-premium"
          style={{ display: "flex", gap: "12px", marginTop: "1.5rem" }}
        >
          <button
            type="button"
            className="premium-action-btn"
            onClick={onUpload}
            disabled={!selectedFile || startProcessLoad}
            style={{ flex: 1 }}
          >
            {startProcessLoad ? (
              <span className="dot-loading">
                กำลังอัปโหลด<span className="dot one">.</span>
                <span className="dot two">.</span>
                <span className="dot three">.</span>
              </span>
            ) : (
              "บันทึกและอัปโหลด"
            )}
          </button>
          <button
            type="button"
            className="premium-action-btn secondary"
            onClick={onCancel}
            disabled={startProcessLoad}
            style={{ flex: 1 }}
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}
