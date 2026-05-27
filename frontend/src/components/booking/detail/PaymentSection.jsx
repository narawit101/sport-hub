import React, { useState, useEffect } from "react";
import { formatPrice } from "@/app/utils/format";
import { BOOKING_STATUS, PAYMENT_METHOD } from "@/constants/status";
import UploadSlipModal from "./UploadSlipModal";

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
  const [copied, setCopied] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [modalType, setModalType] = useState("deposit"); // "deposit" or "total"

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (editSlip) {
      setModalType("deposit");
      setIsUploadModalOpen(true);
    } else {
      setIsUploadModalOpen(false);
    }
  }, [editSlip]);

  const handleModalCancel = () => {
    setIsUploadModalOpen(false);
    setEditSlip(false);
    setDepositSlip(null);
    setTotalSlip(null);
    setImgPreviewDeposit("");
    setImgPreviewTotal("");
    setQrCode(null);
  };

  const isCash = booking.pay_method === PAYMENT_METHOD.CASH;
  const hasDepositSlip = !!booking.deposit_slip;
  const hasTotalSlip = !!booking.total_slip;
  const isBooker = booking?.user_id === user?.user_id;
  const needsDeposit = Number(booking.price_deposit) > 0;
  const isVerified = booking?.status === BOOKING_STATUS.VERIFIED;
  const isApproved = booking?.status === BOOKING_STATUS.APPROVED;
  const isApprovedNoDeposit = isApproved && Number(booking.price_deposit) === 0;
  const canUploadTotalSlip = isBooker && (isVerified || isApprovedNoDeposit);

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
            {/* 1. Uploaded Slips Gallery */}
            {(hasDepositSlip || hasTotalSlip) && (
              <div className="uploaded-slips-gallery-premium" style={{ marginBottom: "20px" }}>
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

            {/* 2. Action Buttons to open Modal */}
            {isBooker && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", marginTop: "10px" }}>
                {!hasDepositSlip && needsDeposit && (
                  <button
                    type="button"
                    className="premium-action-btn"
                    onClick={() => {
                      setModalType("deposit");
                      setIsUploadModalOpen(true);
                    }}
                  >
                    ชำระเงินและอัปโหลดสลิปมัดจำ
                  </button>
                )}

                {!hasDepositSlip && !needsDeposit && booking.total_price > 0 && (
                  <button
                    type="button"
                    className="premium-action-btn"
                    onClick={() => {
                      setModalType("total");
                      setIsUploadModalOpen(true);
                    }}
                  >
                    ชำระเงินและอัปโหลดสลิปเช่าสนาม
                  </button>
                )}

                {hasDepositSlip && !hasTotalSlip && canUploadTotalSlip && (
                  <button
                    type="button"
                    className="premium-action-btn"
                    onClick={() => {
                      setModalType("total");
                      setIsUploadModalOpen(true);
                    }}
                  >
                    ชำระเงินและอัปโหลดสลิปยอดคงเหลือ
                  </button>
                )}
              </div>
            )}

            {/* 3. Empty States for Non-Booker */}
            {!isBooker && !hasDepositSlip && needsDeposit && (
              <div className="empty-state-slip">ยังไม่ได้อัปโหลดสลิปมัดจำ</div>
            )}
            {!isBooker && !hasDepositSlip && !needsDeposit && booking.total_price > 0 && (
              <div className="empty-state-slip">ยังไม่ได้อัปโหลดสลิป</div>
            )}
            {!hasDepositSlip && !needsDeposit && booking.total_price <= 0 && (
              <div className="empty-state-slip">ไม่มีสลิปการชำระเงิน</div>
            )}
          </>
        )}
      </div>

      {/* Upload/Edit Modal */}
      <UploadSlipModal
        isOpen={isUploadModalOpen}
        onClose={handleModalCancel}
        title={
          editSlip
            ? "แก้ไขสลิปมัดจำ"
            : modalType === "deposit"
              ? "ชำระเงินมัดจำสนาม"
              : needsDeposit
                ? "ชำระเงินยอดคงเหลือ"
                : "ชำระเงินค่าเช่าสนาม"
        }
        booking={booking}
        qrCode={qrCode}
        handleGenQR={handleGenQR}
        amount={modalType === "deposit" ? booking.price_deposit : booking.total_remaining}
        startProcessLoad={startProcessLoad}
        fileInputHandler={modalType === "deposit" ? handleDepositSlip : handleTotalSlip}
        imgPreview={modalType === "deposit" ? imgPreviewDeposit : imgPreviewTotal}
        selectedFile={modalType === "deposit" ? depositSlip : totalSlip}
        onCancel={handleModalCancel}
        onUpload={async () => {
          let success = false;
          if (modalType === "deposit") {
            success = await uploadSlip();
          } else {
            success = await uploadTotalSlip();
          }
          if (success) {
            setIsUploadModalOpen(false);
          }
        }}
        copied={copied}
        handleCopy={handleCopy}
      />

      {/* Lightbox Image Overlay */}
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
