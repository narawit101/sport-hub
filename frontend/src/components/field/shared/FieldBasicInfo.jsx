"use client";
import React from "react";
import { FIELD_STATUS } from "@/constants/status";
import FieldModal from "./FieldModal";

const FieldBasicInfo = ({
  field,
  isEditMode = false,
  startProcessLoad,
  daysInThai,
  dayCodes,
  router,
  getGoogleMapsLink,
  notify,
  formatPrice,
  // Modals props
  showEditGeneralModal,
  setShowEditGeneralModal,
  editGeneralData,
  setEditGeneralData,
  saveGeneralInfo,
  handleOpenEditGeneral,
  showEditFinancialModal,
  setShowEditFinancialModal,
  editFinancialData,
  setEditFinancialData,
  saveFinancialInfo,
  handleOpenEditFinancial,
}) => {
  const canEdit = isEditMode && handleOpenEditGeneral && handleOpenEditFinancial;

  return (
    <div className="check-field-info-grid">
      {/* Card 1: ข้อมูลทั่วไป */}
      <div className="check-field-section-card">
        <h2 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>ข้อมูลทั่วไป</span>
          {canEdit && (
            <button
              disabled={startProcessLoad}
              className="edit-btn-inline"
              onClick={handleOpenEditGeneral}
              style={{ background: "var(--text-color)", color: "white" }}
            >
              แก้ไขข้อมูลทั่วไป
            </button>
          )}
        </h2>
        <div className="info-detail-list">
          {/* เจ้าของสนาม */}
          <div className="info-detail-row">
            <span className="info-detail-label">เจ้าของสนาม:</span>
            <span className="info-detail-val">
              {field?.first_name && field?.last_name ? `${field.first_name} ${field.last_name}` : "ไม่มีข้อมูล"}
            </span>
          </div>

          {/* สถานะการลงทะเบียน */}
          <div className="info-detail-row">
            <span className="info-detail-label">สถานะการลงทะเบียน:</span>
            <span className="info-detail-val">
              <span
                className={
                  field?.status === FIELD_STATUS.VERIFIED
                    ? "status-text-approved"
                    : field?.status === FIELD_STATUS.REJECTED
                      ? "status-text-rejected"
                      : field?.status === FIELD_STATUS.PENDING
                        ? "status-text-pending"
                        : ""
                }
              >
                {field?.status || "ไม่มีข้อมูล"}
              </span>
            </span>
          </div>

          {/* ชื่อสนาม */}
          <div className="info-detail-row">
            <span className="info-detail-label">ชื่อสนาม:</span>
            <span className="info-detail-val">{field?.field_name || "ไม่มีข้อมูล"}</span>
          </div>

          {/* ที่อยู่ */}
          <div className="info-detail-row">
            <span className="info-detail-label">ที่อยู่:</span>
            <span className="info-detail-val">{field?.address || "ไม่มีข้อมูล"}</span>
          </div>

          {/* พิกัด GPS */}
          <div className="info-detail-row">
            <span className="info-detail-label">พิกัด GPS:</span>
            <div className="info-detail-val">
              <div className="view-field-inline">
                <span>
                  {field?.gps_location ? (
                    <a href={getGoogleMapsLink(field.gps_location)} target="_blank" rel="noopener noreferrer">
                      {field.gps_location}
                    </a>
                  ) : "ไม่มีข้อมูล"}
                </span>
                {canEdit && <button disabled={startProcessLoad} className="edit-btn-inline" onClick={() => router.push(`/map/${field.field_id}`)}>แก้ไขแผนที่</button>}
              </div>
            </div>
          </div>

          {/* วันที่เปิดทำการ */}
          <div className="info-detail-row">
            <span className="info-detail-label">วันที่เปิดทำการ:</span>
            <span className="info-detail-val">
              {field?.open_days && field.open_days.length > 0
                ? field.open_days.length === 7 ? "เปิดทุกวัน" : field.open_days.map(d => daysInThai[d]).join(", ")
                : "ไม่มีข้อมูล"}
            </span>
          </div>

          {/* เวลาเปิดทำการ */}
          <div className="info-detail-row">
            <span className="info-detail-label">เวลาเปิดทำการ:</span>
            <span className="info-detail-val">{field?.open_hours || "ไม่มีข้อมูล"} น.</span>
          </div>

          {/* เวลาปิดทำการ */}
          <div className="info-detail-row">
            <span className="info-detail-label">เวลาปิดทำการ:</span>
            <span className="info-detail-val">{field?.close_hours || "ไม่มีข้อมูล"} น.</span>
          </div>

          {/* สล็อตการจอง */}
          <div className="info-detail-row">
            <span className="info-detail-label">สล็อตการจอง:</span>
            <span className="info-detail-val">
              {Number(field?.slot_duration) === 30 ? "30 นาที" : Number(field?.slot_duration) === 60 ? "1 ชั่วโมง" : "ไม่มีข้อมูล"}
            </span>
          </div>
        </div>
      </div>

      {/* Card 2: ข้อมูลการเงิน & บัญชีธนาคาร */}
      <div className="check-field-section-card">
        <h2 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>ข้อมูลการเงิน & บัญชีธนาคาร</span>
          {canEdit && (
            <button
              disabled={startProcessLoad}
              className="edit-btn-inline"
              onClick={handleOpenEditFinancial}
              style={{ background: "var(--text-color)", color: "white" }}
            >
              แก้ไขข้อมูลการเงิน
            </button>
          )}
        </h2>
        <div className="info-detail-list">
          {/* ค่ามัดจำการจอง */}
          <div className="info-detail-row">
            <span className="info-detail-label">ค่ามัดจำการจอง:</span>
            <span className="info-detail-val price-highlight">
              {field?.price_deposit ? `${formatPrice(field.price_deposit)} บาท` : "ไม่มีค่ามัดจำ"}
            </span>
          </div>

          {/* ธนาคาร */}
          <div className="info-detail-row">
            <span className="info-detail-label">ธนาคาร:</span>
            <span className="info-detail-val">{field?.name_bank || "ไม่มีข้อมูล"}</span>
          </div>

          {/* ชื่อเจ้าของบัญชี */}
          <div className="info-detail-row">
            <span className="info-detail-label">ชื่อเจ้าของบัญชี:</span>
            <span className="info-detail-val">{field?.account_holder || "ไม่มีข้อมูล"}</span>
          </div>

          {/* เลขที่บัญชี */}
          <div className="info-detail-row">
            <span className="info-detail-label">เลขที่บัญชี:</span>
            <span className="info-detail-val account-number-val">{field?.number_bank || "ไม่มีข้อมูล"}</span>
          </div>

          {/* ยกเลิกก่อนถึงเวลา */}
          <div className="info-detail-row">
            <span className="info-detail-label">ยกเลิกก่อน (ชม.):</span>
            <span className="info-detail-val">{field?.cancel_hours || "0"} ชม.</span>
          </div>
        </div>
      </div>

      {/* Modal แก้ไขข้อมูลทั่วไป */}
      {showEditGeneralModal && (
        <FieldModal
          isOpen={showEditGeneralModal}
          onClose={() => setShowEditGeneralModal(false)}
          title="แก้ไขข้อมูลทั่วไป"
          onSave={saveGeneralInfo}
          startProcessLoad={startProcessLoad}
          maxWidth="600px"
        >
          <div className="edit-venue-modal-form" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontWeight: "700", color: "#475569" }}>ชื่อสนาม</label>
              <input
                maxLength={50}
                type="text"
                value={editGeneralData.field_name}
                onChange={(e) => setEditGeneralData({ ...editGeneralData, field_name: e.target.value })}
                className="inline-input"
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontWeight: "700", color: "#475569" }}>ที่อยู่</label>
              <input
                maxLength={100}
                type="text"
                value={editGeneralData.address}
                onChange={(e) => setEditGeneralData({ ...editGeneralData, address: e.target.value })}
                className="inline-input"
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontWeight: "700", color: "#475569" }}>วันที่เปิดทำการ</label>
              <div className="days-checkbox-container" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                {dayCodes.map((code) => {
                  const checked = editGeneralData.open_days.includes(code);
                  return (
                    <label key={code} className="day-checkbox" style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const newDays = checked
                            ? editGeneralData.open_days.filter((d) => d !== code)
                            : [...editGeneralData.open_days, code];
                          setEditGeneralData({ ...editGeneralData, open_days: newDays });
                        }}
                      />
                      {daysInThai[code]}
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontWeight: "700", color: "#475569" }}>เวลาเปิดทำการ</label>
                <input
                  type="time"
                  value={editGeneralData.open_hours}
                  onChange={(e) => setEditGeneralData({ ...editGeneralData, open_hours: e.target.value })}
                  className="inline-input-time"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>
              <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontWeight: "700", color: "#475569" }}>เวลาปิดทำการ</label>
                <input
                  type="time"
                  value={editGeneralData.close_hours}
                  onChange={(e) => setEditGeneralData({ ...editGeneralData, close_hours: e.target.value })}
                  className="inline-input-time"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>
            </div>

            <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontWeight: "700", color: "#475569" }}>สล็อตการจอง</label>
              <select
                value={editGeneralData.slot_duration}
                onChange={(e) => setEditGeneralData({ ...editGeneralData, slot_duration: e.target.value })}
                className="inline-select"
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white" }}
              >
                <option value="30">30 นาที</option>
                <option value="60">1 ชั่วโมง</option>
              </select>
            </div>
          </div>
        </FieldModal>
      )}

      {/* Modal แก้ไขข้อมูลการเงิน */}
      {showEditFinancialModal && (
        <FieldModal
          isOpen={showEditFinancialModal}
          onClose={() => setShowEditFinancialModal(false)}
          title="แก้ไขข้อมูลการเงิน & บัญชีธนาคาร"
          onSave={saveFinancialInfo}
          startProcessLoad={startProcessLoad}
          maxWidth="500px"
        >
          <div className="edit-venue-modal-form" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontWeight: "700", color: "#475569" }}>ค่ามัดจำการจอง (บาท)</label>
              <input
                type="text"
                inputMode="numeric"
                value={editFinancialData.price_deposit}
                onChange={(e) => setEditFinancialData({ ...editFinancialData, price_deposit: e.target.value.replace(/\D/g, "") })}
                className="inline-input"
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontWeight: "700", color: "#475569" }}>ธนาคาร</label>
              <input
                maxLength={50}
                type="text"
                value={editFinancialData.name_bank}
                onChange={(e) => setEditFinancialData({ ...editFinancialData, name_bank: e.target.value })}
                className="inline-input"
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontWeight: "700", color: "#475569" }}>ชื่อเจ้าของบัญชี</label>
              <input
                maxLength={50}
                type="text"
                value={editFinancialData.account_holder}
                onChange={(e) => setEditFinancialData({ ...editFinancialData, account_holder: e.target.value })}
                className="inline-input"
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontWeight: "700", color: "#475569" }}>เลขที่บัญชี</label>
              <input
                maxLength={13}
                type="text"
                inputMode="numeric"
                value={editFinancialData.number_bank}
                onChange={(e) => setEditFinancialData({ ...editFinancialData, number_bank: e.target.value.replace(/\D/g, "") })}
                className="inline-input"
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontWeight: "700", color: "#475569" }}>อนุญาตให้ยกเลิกก่อนเวลาเริ่มจอง (ชั่วโมง)</label>
              <input
                maxLength={2}
                type="text"
                inputMode="numeric"
                value={editFinancialData.cancel_hours}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (Number(val) <= 24) {
                    setEditFinancialData({ ...editFinancialData, cancel_hours: val });
                  } else {
                    notify("ใส่ไม่เกิน 24 ชั่วโมง", "error");
                  }
                }}
                className="inline-input"
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>
          </div>
        </FieldModal>
      )}
    </div>
  );
};

export default FieldBasicInfo;
