"use client";
import React from "react";
import { FIELD_STATUS } from "@/constants/status";

const EditVenueBasicInfo = ({
  field,
  editingField,
  updatedValue,
  setUpdatedValue,
  saveField,
  cancelEditing,
  startEditing,
  startProcessLoad,
  selectedDays,
  handleDayToggle,
  daysInThai,
  dayCodes,
  router,
  getGoogleMapsLink,
  notify,
  formatPrice,
}) => {
  return (
    <div className="check-field-info-grid">
      {/* Card 1: ข้อมูลทั่วไป */}
      <div className="check-field-section-card">
        <h2>ข้อมูลทั่วไป</h2>
        <div className="info-detail-list">
          {/* สถานะการลงทะเบียน (Read-only in edit) */}
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
            <div className="info-detail-val">
              {editingField === "field_name" ? (
                <div className="edit-field-inline">
                  <input
                    maxLength={50}
                    type="text"
                    value={updatedValue}
                    onChange={(e) => setUpdatedValue(e.target.value)}
                    className="inline-input"
                  />
                  <div className="inline-buttons">
                    <button disabled={startProcessLoad} className="savebtn-inline" onClick={() => saveField("field_name")}>
                      {startProcessLoad ? "..." : "บันทึก"}
                    </button>
                    <button disabled={startProcessLoad} className="canbtn-inline" onClick={cancelEditing}>ยกเลิก</button>
                  </div>
                </div>
              ) : (
                <div className="view-field-inline">
                  <span>{field?.field_name || "ไม่มีข้อมูล"}</span>
                  <button disabled={startProcessLoad} className="edit-btn-inline" onClick={() => startEditing("field_name", field?.field_name)}>แก้ไข</button>
                </div>
              )}
            </div>
          </div>

          {/* เจ้าของสนาม (Read-only) */}
          <div className="info-detail-row">
            <span className="info-detail-label">เจ้าของสนาม:</span>
            <span className="info-detail-val">
              {field?.first_name && field?.last_name ? `${field.first_name} ${field.last_name}` : "ไม่มีข้อมูล"}
            </span>
          </div>

          {/* ที่อยู่ */}
          <div className="info-detail-row">
            <span className="info-detail-label">ที่อยู่:</span>
            <div className="info-detail-val">
              {editingField === "address" ? (
                <div className="edit-field-inline">
                  <input
                    maxLength={100}
                    type="text"
                    value={updatedValue}
                    onChange={(e) => setUpdatedValue(e.target.value)}
                    className="inline-input"
                  />
                  <div className="inline-buttons">
                    <button disabled={startProcessLoad} className="savebtn-inline" onClick={() => saveField("address")}>
                      {startProcessLoad ? "..." : "บันทึก"}
                    </button>
                    <button disabled={startProcessLoad} className="canbtn-inline" onClick={cancelEditing}>ยกเลิก</button>
                  </div>
                </div>
              ) : (
                <div className="view-field-inline">
                  <span>{field?.address || "ไม่มีข้อมูล"}</span>
                  <button disabled={startProcessLoad} className="edit-btn-inline" onClick={() => startEditing("address", field?.address)}>แก้ไข</button>
                </div>
              )}
            </div>
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
                <button disabled={startProcessLoad} className="edit-btn-inline" onClick={() => router.push(`/map/${field.field_id}`)}>แก้ไขแผนที่</button>
              </div>
            </div>
          </div>

          {/* วันที่เปิดทำการ */}
          <div className="info-detail-row">
            <span className="info-detail-label">วันที่เปิดทำการ:</span>
            <div className="info-detail-val">
              {editingField === "open_days" ? (
                <div className="edit-field-inline">
                  <div className="days-checkbox-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                    {dayCodes.map((code) => (
                      <label key={code} className="day-checkbox" style={{ fontSize: '11px' }}>
                        <input
                          type="checkbox"
                          checked={selectedDays.includes(code)}
                          disabled={startProcessLoad}
                          onChange={() => handleDayToggle(code)}
                        />
                        {daysInThai[code]}
                      </label>
                    ))}
                  </div>
                  <div className="inline-buttons">
                    <button disabled={startProcessLoad} className="savebtn-inline" onClick={() => saveField("open_days")}>
                      {startProcessLoad ? "..." : "บันทึก"}
                    </button>
                    <button disabled={startProcessLoad} className="canbtn-inline" onClick={cancelEditing}>ยกเลิก</button>
                  </div>
                </div>
              ) : (
                <div className="view-field-inline">
                  <span>
                    {field?.open_days && field.open_days.length > 0
                      ? field.open_days.length === 7 ? "เปิดทุกวัน" : field.open_days.map(d => daysInThai[d]).join(", ")
                      : "ไม่มีข้อมูล"}
                  </span>
                  <button disabled={startProcessLoad} className="edit-btn-inline" onClick={() => startEditing("open_days", "")}>แก้ไข</button>
                </div>
              )}
            </div>
          </div>

          {/* เวลาเปิด */}
          <div className="info-detail-row">
            <span className="info-detail-label">เวลาเปิดทำการ:</span>
            <div className="info-detail-val">
              {editingField === "open_hours" ? (
                <div className="edit-field-inline">
                  <input
                    type="time"
                    value={updatedValue}
                    onChange={(e) => setUpdatedValue(e.target.value)}
                    className="inline-input-time"
                  />
                  <div className="inline-buttons">
                    <button disabled={startProcessLoad} className="savebtn-inline" onClick={() => saveField("open_hours")}>
                      {startProcessLoad ? "..." : "บันทึก"}
                    </button>
                    <button disabled={startProcessLoad} className="canbtn-inline" onClick={cancelEditing}>ยกเลิก</button>
                  </div>
                </div>
              ) : (
                <div className="view-field-inline">
                  <span>{field?.open_hours || "ไม่มีข้อมูล"} น.</span>
                  <button disabled={startProcessLoad} className="edit-btn-inline" onClick={() => startEditing("open_hours", field?.open_hours)}>แก้ไข</button>
                </div>
              )}
            </div>
          </div>

          {/* เวลาปิด */}
          <div className="info-detail-row">
            <span className="info-detail-label">เวลาปิดทำการ:</span>
            <div className="info-detail-val">
              {editingField === "close_hours" ? (
                <div className="edit-field-inline">
                  <input
                    type="time"
                    value={updatedValue}
                    onChange={(e) => setUpdatedValue(e.target.value)}
                    className="inline-input-time"
                  />
                  <div className="inline-buttons">
                    <button disabled={startProcessLoad} className="savebtn-inline" onClick={() => saveField("close_hours")}>
                      {startProcessLoad ? "..." : "บันทึก"}
                    </button>
                    <button disabled={startProcessLoad} className="canbtn-inline" onClick={cancelEditing}>ยกเลิก</button>
                  </div>
                </div>
              ) : (
                <div className="view-field-inline">
                  <span>{field?.close_hours || "ไม่มีข้อมูล"} น.</span>
                  <button disabled={startProcessLoad} className="edit-btn-inline" onClick={() => startEditing("close_hours", field?.close_hours)}>แก้ไข</button>
                </div>
              )}
            </div>
          </div>

          {/* ช่วงเวลาการจอง (สล็อต) */}
          <div className="info-detail-row">
            <span className="info-detail-label">สล็อตการจอง:</span>
            <div className="info-detail-val">
              {editingField === "slot_duration" ? (
                <div className="edit-field-inline">
                  <select value={updatedValue} onChange={(e) => setUpdatedValue(e.target.value)} className="inline-select">
                    <option value="30">30 นาที</option>
                    <option value="60">1 ชั่วโมง</option>
                  </select>
                  <div className="inline-buttons">
                    <button disabled={startProcessLoad} className="savebtn-inline" onClick={() => saveField("slot_duration")}>
                      {startProcessLoad ? "..." : "บันทึก"}
                    </button>
                    <button disabled={startProcessLoad} className="canbtn-inline" onClick={cancelEditing}>ยกเลิก</button>
                  </div>
                </div>
              ) : (
                <div className="view-field-inline">
                  <span>{Number(field?.slot_duration) === 30 ? "30 นาที" : Number(field?.slot_duration) === 60 ? "1 ชั่วโมง" : "ไม่มีข้อมูล"}</span>
                  <button disabled={startProcessLoad} className="edit-btn-inline" onClick={() => startEditing("slot_duration", field?.slot_duration)}>แก้ไข</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: ข้อมูลการเงิน & บัญชีธนาคาร */}
      <div className="check-field-section-card">
        <h2>ข้อมูลการเงิน & บัญชีธนาคาร</h2>
        <div className="info-detail-list">
          {/* ค่ามัดจำการจอง */}
          <div className="info-detail-row">
            <span className="info-detail-label">ค่ามัดจำการจอง:</span>
            <div className="info-detail-val">
              {editingField === "price_deposit" ? (
                <div className="edit-field-inline">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={updatedValue}
                    onChange={(e) => setUpdatedValue(e.target.value.replace(/\D/g, ""))}
                    className="inline-input"
                    style={{ width: '80px' }}
                  />
                  <div className="inline-buttons">
                    <button disabled={startProcessLoad} className="savebtn-inline" onClick={() => saveField("price_deposit")}>
                      {startProcessLoad ? "..." : "บันทึก"}
                    </button>
                    <button disabled={startProcessLoad} className="canbtn-inline" onClick={cancelEditing}>ยกเลิก</button>
                  </div>
                </div>
              ) : (
                <div className="view-field-inline">
                  <span className="price-highlight">{field?.price_deposit ? `${formatPrice(field.price_deposit)} บาท` : "ไม่มีค่ามัดจำ"}</span>
                  <button disabled={startProcessLoad} className="edit-btn-inline" onClick={() => startEditing("price_deposit", field?.price_deposit)}>แก้ไข</button>
                </div>
              )}
            </div>
          </div>

          {/* ธนาคาร */}
          <div className="info-detail-row">
            <span className="info-detail-label">ธนาคาร:</span>
            <div className="info-detail-val">
              {editingField === "name_bank" ? (
                <div className="edit-field-inline">
                  <input
                    maxLength={50}
                    type="text"
                    value={updatedValue}
                    onChange={(e) => setUpdatedValue(e.target.value)}
                    className="inline-input"
                  />
                  <div className="inline-buttons">
                    <button disabled={startProcessLoad} className="savebtn-inline" onClick={() => saveField("name_bank")}>
                      {startProcessLoad ? "..." : "บันทึก"}
                    </button>
                    <button disabled={startProcessLoad} className="canbtn-inline" onClick={cancelEditing}>ยกเลิก</button>
                  </div>
                </div>
              ) : (
                <div className="view-field-inline">
                  <span>{field?.name_bank || "ไม่มีข้อมูล"}</span>
                  <button disabled={startProcessLoad} className="edit-btn-inline" onClick={() => startEditing("name_bank", field?.name_bank)}>แก้ไข</button>
                </div>
              )}
            </div>
          </div>

          {/* ชื่อเจ้าของบัญชี */}
          <div className="info-detail-row">
            <span className="info-detail-label">ชื่อเจ้าของบัญชี:</span>
            <div className="info-detail-val">
              {editingField === "account_holder" ? (
                <div className="edit-field-inline">
                  <input
                    maxLength={50}
                    type="text"
                    value={updatedValue}
                    onChange={(e) => setUpdatedValue(e.target.value)}
                    className="inline-input"
                  />
                  <div className="inline-buttons">
                    <button disabled={startProcessLoad} className="savebtn-inline" onClick={() => saveField("account_holder")}>
                      {startProcessLoad ? "..." : "บันทึก"}
                    </button>
                    <button disabled={startProcessLoad} className="canbtn-inline" onClick={cancelEditing}>ยกเลิก</button>
                  </div>
                </div>
              ) : (
                <div className="view-field-inline">
                  <span>{field?.account_holder || "ไม่มีข้อมูล"}</span>
                  <button disabled={startProcessLoad} className="edit-btn-inline" onClick={() => startEditing("account_holder", field?.account_holder)}>แก้ไข</button>
                </div>
              )}
            </div>
          </div>

          {/* เลขที่บัญชี */}
          <div className="info-detail-row">
            <span className="info-detail-label">เลขที่บัญชี:</span>
            <div className="info-detail-val">
              {editingField === "number_bank" ? (
                <div className="edit-field-inline">
                  <input
                    maxLength={13}
                    type="text"
                    inputMode="numeric"
                    value={updatedValue}
                    onChange={(e) => setUpdatedValue(e.target.value.replace(/\D/g, ""))}
                    className="inline-input"
                  />
                  <div className="inline-buttons">
                    <button disabled={startProcessLoad} className="savebtn-inline" onClick={() => saveField("number_bank")}>
                      {startProcessLoad ? "..." : "บันทึก"}
                    </button>
                    <button disabled={startProcessLoad} className="canbtn-inline" onClick={cancelEditing}>ยกเลิก</button>
                  </div>
                </div>
              ) : (
                <div className="view-field-inline">
                  <span className="account-number-val">{field?.number_bank || "ไม่มีข้อมูล"}</span>
                  <button disabled={startProcessLoad} className="edit-btn-inline" onClick={() => startEditing("number_bank", field?.number_bank)}>แก้ไข</button>
                </div>
              )}
            </div>
          </div>

          {/* ยกเลิกก่อนถึงเวลา (Optional addition to match edit-field needs) */}
          <div className="info-detail-row">
            <span className="info-detail-label">ยกเลิกก่อน (ชม.):</span>
            <div className="info-detail-val">
              {editingField === "cancel_hours" ? (
                <div className="edit-field-inline">
                  <input
                    maxLength={2}
                    type="text"
                    inputMode="numeric"
                    value={updatedValue}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (Number(val) <= 24) setUpdatedValue(val);
                      else notify("ใส่ไม่เกิน 24 ชั่วโมง", "error");
                    }}
                    className="inline-input"
                    style={{ width: '50px' }}
                  />
                  <div className="inline-buttons">
                    <button disabled={startProcessLoad} className="savebtn-inline" onClick={() => saveField("cancel_hours")}>
                      {startProcessLoad ? "..." : "บันทึก"}
                    </button>
                    <button disabled={startProcessLoad} className="canbtn-inline" onClick={cancelEditing}>ยกเลิก</button>
                  </div>
                </div>
              ) : (
                <div className="view-field-inline">
                  <span>{field?.cancel_hours || "0"} ชม.</span>
                  <button disabled={startProcessLoad} className="edit-btn-inline" onClick={() => startEditing("cancel_hours", field?.cancel_hours)}>แก้ไข</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditVenueBasicInfo;
