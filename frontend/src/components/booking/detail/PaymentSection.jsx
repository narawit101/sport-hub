import React from "react";
import { formatPrice } from "@/app/utils/format";
import {
  BOOKING_STATUS,
  PAYMENT_METHOD,
  ACCOUNT_TYPE,
} from "@/constants/status";

export default function PaymentSection({
  booking,
  user,
  qrCode,
  handleGenQR,
  booking_id,
  editSlip,
  setEditSlip,
  depositSlip,
  handleDepositSlip,
  imgPreviewDeposit,
  setImgPreviewDeposit,
  setDepositSlip,
  uploadSlip,
  totalSlip,
  handleTotalSlip,
  imgPreviewTotal,
  setImgPreviewTotal,
  setTotalSlip,
  uploadTotalSlip,
  startProcessLoad,
  canUploadslip,
  setQrCode,
}) {
  const [copied, setCopied] = React.useState(false);
  const [lightboxImage, setLightboxImage] = React.useState(null);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCash = booking.pay_method === PAYMENT_METHOD.CASH;
  const isTransfer = booking.pay_method === PAYMENT_METHOD.TRANSFER;
  const hasDepositSlip = !!booking.deposit_slip;
  const hasTotalSlip = !!booking.total_slip;
  const isBooker = booking?.user_id === user?.user_id;
  const needsDeposit = Number(booking.price_deposit) > 0;
  const isVerified = booking?.status === BOOKING_STATUS.VERIFIED;
  const isApproved = booking?.status === BOOKING_STATUS.APPROVED;
  const isApprovedNoDeposit = isApproved && Number(booking.price_deposit) === 0;
  const canUploadTotalSlip = isBooker && (isVerified || isApprovedNoDeposit);

  const renderBankAccountInfo = () => (
    <div className="premium-bank-card">
      <div className="bank-logo-row">
        <span className="bank-name-badge">{booking.name_bank}</span>
        <span className="card-type">โอนเงินเข้าบัญชีธนาคาร</span>
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
      <div className="bank-holder-row">
        <div className="holder-label">ชื่อบัญชีผู้รับเงิน</div>
        <div className="holder-name">{booking.account_holder}</div>
      </div>
    </div>
  );

  const renderQRSection = (amount) => {
    if (booking?.name_bank !== ACCOUNT_TYPE.PROMPTPAY) return null;

    return (
      <div className="premium-qr-card">
        <div className="qr-header-promptpay">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5fFvHNeNx1a2PAmCMPLORgS-yE2c4bLWe0g&s"
            alt="PromptPay"
            className="promptpay-logo-img"
          />
        </div>
        {!qrCode ? (
          <button
            type="button"
            className="premium-action-btn"
            onClick={() => handleGenQR(booking_id, amount)}
            disabled={startProcessLoad}
            style={{ marginTop: "10px" }}
          >
            {startProcessLoad
              ? "กำลังสร้าง QR..."
              : `สร้าง QR Code ยอด ${formatPrice(amount)} บาท`}
          </button>
        ) : (
          <>
            <div className="qr-body-code">
              <img src={qrCode} alt="QR Code" className="qr-image-display" />
            </div>
            <div className="qr-footer-info">
              <span>สแกนชำระเงินผ่านแอปพลิเคชันธนาคาร</span>
              <strong>ยอดโอน {formatPrice(amount)} บาท</strong>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderUploadZone = (
    onChange,
    labelText,
    hintText = "รองรับไฟล์ภาพ JPG, PNG ขนาดไม่เกิน 5MB",
  ) => (
    <label className="file-upload-zone-premium">
      <input
        type="file"
        onChange={onChange}
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
          style={{ fontSize: "0.95rem", fontWeight: "700", color: "#334155" }}
        >
          {labelText}
        </span>
        <span
          className="upload-label-sub"
          style={{ fontSize: "0.75rem", color: "#94a3b8" }}
        >
          {hintText}
        </span>
      </div>
    </label>
  );

  return (
    <div className="deposit-slip-container-order-detail">
      <div className="payment-title-premium">ข้อมูลการชำระเงิน</div>

      <div className="premium-payment-section">
        {isCash ? (
          <p className="no-slip-message">
            ไม่ต้องจ่ายค่ามัดจำ (ชำระเงินสดที่สนาม)
          </p>
        ) : (
          <>
            {(hasDepositSlip || hasTotalSlip) && !editSlip && (
              <div className="uploaded-slips-gallery-premium">
                {hasDepositSlip && (
                  <div className="slip-item-card">
                    <div className="slip-card-header">
                      สลิปมัดจำ (คลิกเพื่อขยาย)
                    </div>
                    <div
                      className="slip-image-wrapper"
                      onClick={() => setLightboxImage(booking.deposit_slip)}
                    >
                      <img
                        src={`${booking.deposit_slip}`}
                        alt="สลิปมัดจำ"
                        className="slip-img-display"
                      />
                    </div>
                    {isBooker && booking?.status === BOOKING_STATUS.PENDING && (
                      <button
                        type="button"
                        className="edit-slip-btn-premium"
                        onClick={() => setEditSlip(true)}
                      >
                        แก้ไขสลิป
                      </button>
                    )}
                  </div>
                )}
                {hasTotalSlip && (
                  <div className="slip-item-card">
                    <div className="slip-card-header">
                      สลิปยอดคงเหลือ (คลิกเพื่อขยาย)
                    </div>
                    <div
                      className="slip-image-wrapper"
                      onClick={() => setLightboxImage(booking.total_slip)}
                    >
                      <img
                        src={`${booking.total_slip}`}
                        alt="สลิปยอดคงเหลือ"
                        className="slip-img-display"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {hasDepositSlip &&
              !hasTotalSlip &&
              isBooker &&
              canUploadTotalSlip &&
              !editSlip && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  <h4
                    className="payment-subtitle-premium"
                    style={{
                      margin: 0,
                      fontSize: "1.05rem",
                      fontWeight: "600",
                      color: "#475569",
                    }}
                  >
                    อัปโหลดสลิปยอดคงเหลือ
                  </h4>
                  {renderBankAccountInfo()}
                  {renderQRSection(booking.total_remaining)}
                  {renderUploadZone(handleTotalSlip, "เลือกสลิปยอดคงเหลือ")}

                  {imgPreviewTotal && (
                    <div
                      className="slip-item-card"
                      style={{ maxWidth: "280px", margin: "0 auto" }}
                    >
                      <div className="slip-card-header">
                        ตัวอย่างสลิปยอดคงเหลือ
                      </div>
                      <div
                        className="slip-image-wrapper"
                        onClick={() => setLightboxImage(imgPreviewTotal)}
                      >
                        <img
                          src={imgPreviewTotal}
                          alt="preview total slip"
                          className="slip-img-display"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    className="premium-action-btn"
                    onClick={uploadTotalSlip}
                    disabled={startProcessLoad}
                  >
                    {startProcessLoad
                      ? "กำลังอัปโหลด..."
                      : "อัปโหลดสลิปยอดคงเหลือ"}
                  </button>
                </div>
              )}

            {editSlip && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <h4
                  className="payment-subtitle-premium"
                  style={{
                    margin: 0,
                    fontSize: "1.05rem",
                    fontWeight: "600",
                    color: "#475569",
                  }}
                >
                  แก้ไขสลิปมัดจำ
                </h4>
                {renderBankAccountInfo()}
                {renderQRSection(booking.price_deposit)}
                {renderUploadZone(handleDepositSlip, "เลือกสลิปมัดจำใหม่")}

                {imgPreviewDeposit && (
                  <div
                    className="slip-item-card"
                    style={{ maxWidth: "280px", margin: "0 auto" }}
                  >
                    <div className="slip-card-header">
                      ตัวอย่างสลิปมัดจำใหม่
                    </div>
                    <div
                      className="slip-image-wrapper"
                      onClick={() => setLightboxImage(imgPreviewDeposit)}
                    >
                      <img
                        src={imgPreviewDeposit}
                        alt="preview deposit slip"
                        className="slip-img-display"
                      />
                    </div>
                  </div>
                )}

                <div className="button-row-premium">
                  <button
                    type="button"
                    className="premium-action-btn"
                    onClick={uploadSlip}
                    disabled={!depositSlip || startProcessLoad}
                  >
                    {startProcessLoad
                      ? "กำลังอัปโหลด..."
                      : "บันทึกและอัปโหลดใหม่"}
                  </button>
                  <button
                    type="button"
                    className="premium-action-btn secondary"
                    onClick={() => {
                      setEditSlip(false);
                      setDepositSlip(null);
                      setImgPreviewDeposit("");
                      setQrCode(null);
                    }}
                    disabled={startProcessLoad}
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            )}
            {!hasDepositSlip && needsDeposit && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                {isBooker ? (
                  <>
                    <h4
                      className="payment-subtitle-premium"
                      style={{
                        margin: 0,
                        fontSize: "1.05rem",
                        fontWeight: "600",
                        color: "#475569",
                      }}
                    >
                      ชำระเงินมัดจำสนาม
                    </h4>
                    {renderBankAccountInfo()}
                    {renderQRSection(booking.price_deposit)}
                    {renderUploadZone(handleDepositSlip, "อัปโหลดสลิปมัดจำ")}

                    {imgPreviewDeposit && (
                      <div
                        className="slip-item-card"
                        style={{ maxWidth: "280px", margin: "0 auto" }}
                      >
                        <div className="slip-card-header">
                          ตัวอย่างสลิปมัดจำ
                        </div>
                        <div
                          className="slip-image-wrapper"
                          onClick={() => setLightboxImage(imgPreviewDeposit)}
                        >
                          <img
                            src={imgPreviewDeposit}
                            alt="preview deposit"
                            className="slip-img-display"
                          />
                        </div>
                      </div>
                    )}

                    {canUploadslip && (
                      <button
                        type="button"
                        className="premium-action-btn"
                        onClick={uploadSlip}
                        disabled={startProcessLoad}
                      >
                        {startProcessLoad ? "กำลังอัปโหลด..." : "อัปโหลด"}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="empty-state-slip">
                    ยังไม่ได้อัปโหลดสลิปมัดจำ
                  </div>
                )}
              </div>
            )}

            {!hasDepositSlip && !needsDeposit && booking.total_price > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                {isBooker ? (
                  <>
                    <h4
                      className="payment-subtitle-premium"
                      style={{
                        margin: 0,
                        fontSize: "1.05rem",
                        fontWeight: "600",
                        color: "#475569",
                      }}
                    >
                      ชำระเงินค่าเช่าสนาม
                    </h4>
                    {renderBankAccountInfo()}
                    {renderQRSection(booking.total_remaining)}
                    {renderUploadZone(handleTotalSlip, "อัปโหลดสลิปยอดคงเหลือ")}

                    {imgPreviewTotal && (
                      <div
                        className="slip-item-card"
                        style={{ maxWidth: "280px", margin: "0 auto" }}
                      >
                        <div className="slip-card-header">
                          ตัวอย่างสลิปโอนเงิน
                        </div>
                        <div
                          className="slip-image-wrapper"
                          onClick={() => setLightboxImage(imgPreviewTotal)}
                        >
                          <img
                            src={imgPreviewTotal}
                            alt="preview total"
                            className="slip-img-display"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      className="premium-action-btn"
                      onClick={uploadTotalSlip}
                      disabled={startProcessLoad}
                    >
                      {startProcessLoad ? "กำลังอัปโหลด..." : "อัปโหลด"}
                    </button>
                  </>
                ) : (
                  <div className="empty-state-slip">ยังไม่ได้อัปโหลดสลิป</div>
                )}
              </div>
            )}

            {!hasDepositSlip && !needsDeposit && booking.total_price <= 0 && (
              <div className="empty-state-slip">ไม่มีสลิปการชำระเงิน</div>
            )}
          </>
        )}
      </div>

      {lightboxImage && (
        <div
          className="premium-lightbox-overlay"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="premium-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={lightboxImage} alt="หลักฐานการชำระเงิน" />
          </div>
        </div>
      )}
    </div>
  );
}
