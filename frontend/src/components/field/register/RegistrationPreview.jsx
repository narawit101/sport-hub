import React from "react";
import { formatPrice, daysInThai } from "@/app/utils/format";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapLocationDot,
  faFutbol,
  faImages,
  faWallet,
  faConciergeBell,
  faFileLines
} from "@fortawesome/free-solid-svg-icons";

// Mini badge for section headers
function SectionBadge({ icon, title }) {
  return (
    <h3>
      <span style={{ fontSize: "1.1em", marginRight: "8px", verticalAlign: "middle" }}>{icon}</span>
      {title}
    </h3>
  );
}

// Row-style preview item
function PreviewRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="preview-item">
      <strong>{label}</strong>
      <span>{value}</span>
    </div>
  );
}

export default function RegistrationPreview({
  showPreview,
  setShowPreview,
  fieldData,
  subFields,
  selectedFacilities,
  sports,
  handleSubmit,
  startProcessLoad,
}) {
  if (!showPreview) return null;

  const facilitiesCount = Object.keys(selectedFacilities).length;

  return (
    <div
      className="preview-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !startProcessLoad)
          setShowPreview(false);
      }}
    >
      <div
        className="preview-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-modal-title"
      >
        {/* ── Header ── */}
        <div className="preview-modal-header">
          <h2 id="preview-modal-title">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="white"
              viewBox="0 0 24 24"
            >
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
            </svg>
            ตรวจสอบข้อมูลก่อนลงทะเบียน
          </h2>
          <button
            disabled={startProcessLoad}
            style={{ cursor: startProcessLoad ? "not-allowed" : "pointer" }}
            className="close-modal-btn"
            onClick={() => setShowPreview(false)}
            aria-label="ปิด"
          >
            ✕
          </button>
        </div>

        {/* ── Content ── */}
        <div className="preview-modal-content">
          {/* 1. Media */}
          <div className="preview-section">
            <SectionBadge icon={<FontAwesomeIcon icon={faImages} />} title="รูปโปรไฟล์และเอกสาร" />
            {fieldData.imgPreview ? (
              <div
                className="preview-container-regis-field"
                style={{ maxWidth: 260, margin: "0 0 12px 0" }}
              >
                <img src={fieldData.imgPreview} alt="Preview" />
              </div>
            ) : (
              <div
                className="preview-item"
                style={{ color: "#94a3b8", fontStyle: "italic" }}
              >
                ยังไม่ได้เลือกรูปโปรไฟล์
              </div>
            )}
            <div className="preview-item">
              <strong>เอกสาร:</strong>
              <span>
                {fieldData.documents
                  ? `${fieldData.documents.length} ไฟล์`
                  : "ไม่ได้เลือก"}
              </span>
            </div>
            {fieldData.documents && (
              <div className="preview-subfield" style={{ marginTop: 4 }}>
                {Array.from(fieldData.documents).map((file, idx) => (
                  <div className="sub-detail" key={idx}>
                    📄 {file.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Basic Info */}
          <div className="preview-section">
            <SectionBadge icon={<FontAwesomeIcon icon={faMapLocationDot} />} title="ข้อมูลสนามกีฬา" />
            <PreviewRow label="ชื่อสนาม:" value={fieldData.field_name} />
            <PreviewRow label="ที่อยู่:" value={fieldData.address} />
            <PreviewRow label="พิกัด GPS:" value={fieldData.gps_location} />
            <PreviewRow
              label="เวลาเปิด-ปิด:"
              value={
                fieldData.open_hours && fieldData.close_hours
                  ? `${fieldData.open_hours} – ${fieldData.close_hours}`
                  : null
              }
            />
            <PreviewRow
              label="ช่วงเวลาจอง:"
              value={
                fieldData.slot_duration
                  ? `${fieldData.slot_duration} นาที`
                  : null
              }
            />
            <PreviewRow
              label="ยกเลิกการจองก่อน:"
              value={
                fieldData.cancel_hours !== ""
                  ? `${fieldData.cancel_hours} ชั่วโมง`
                  : null
              }
            />
            <PreviewRow
              label="วันเปิดบริการ:"
              value={
                fieldData.open_days?.length
                  ? fieldData.open_days
                    .map((d) => daysInThai[d] || d)
                    .join(", ")
                  : null
              }
            />
          </div>

          {/* 3. Sub-fields */}
          <div className="preview-section">
            <SectionBadge
              icon={<FontAwesomeIcon icon={faFutbol} />}
              title={`สนามย่อย (${subFields.length} สนาม)`}
            />
            {subFields.length === 0 ? (
              <div
                style={{
                  color: "#94a3b8",
                  fontStyle: "italic",
                  fontSize: "0.9rem",
                }}
              >
                ยังไม่ได้เพิ่มสนามย่อย
              </div>
            ) : (
              subFields.map((sub, index) => (
                <div key={index} className="preview-subfield">
                  <strong>
                    สนาม {index + 1}: {sub.name}
                  </strong>
                  <span className="sub-detail">
                    ประเภทกีฬา:{" "}
                    {sports.find((s) => s.sport_id === parseInt(sub.sport_id))
                      ?.sport_name || "ไม่ระบุ"}
                    {sub.price && ` | ราคา: ${sub.price} บาท/ชม.`}
                    {sub.field_surface && ` | พื้นสนาม: ${sub.field_surface}`}
                    {sub.wid_field && ` | กว้าง: ${sub.wid_field} ม.`}
                    {sub.length_field && ` | ยาว: ${sub.length_field} ม.`}
                    {sub.players_per_team &&
                      ` | ${sub.players_per_team} คน/ทีม`}
                  </span>
                  <div className="addon-section-preview">
                    <strong className="addon-title-preview">
                      กิจกรรมพิเศษ:
                    </strong>
                    {sub.addOns && sub.addOns.length > 0 ? (
                      <div className="addons-list-preview">
                        {sub.addOns.map((addon, addonIndex) => (
                          <div key={addonIndex} className="addon-item-preview">
                            <span className="sub-detail">
                              • {addon.content} –{" "}
                              <strong className="addon-price-preview">
                                {addon.price && parseInt(addon.price) > 0
                                  ? `${formatPrice(addon.price)} บาท`
                                  : "ฟรี"}
                              </strong>
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-addons-preview">
                        <span className="no-addons-text-preview">
                          ไม่มีกิจกรรมพิเศษ
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 4. Facilities */}
          {facilitiesCount > 0 && (
            <div className="preview-section">
              <SectionBadge
                icon={<FontAwesomeIcon icon={faConciergeBell} />}
                title={`สิ่งอำนวยความสะดวก (${facilitiesCount} รายการ)`}
              />
              {Object.entries(selectedFacilities).map(([facName, facData]) => (
                <div key={facName} className="preview-facility">
                  <div className="facility-info">
                    <strong>{facName}:</strong>
                    {facData.price && ` ${facData.price} บาท`}
                    {facData.quantity && ` | จำนวน: ${facData.quantity}`}
                    {facData.description && ` | ${facData.description}`}
                  </div>
                  {facData.preview && (
                    <div className="facility-image-preview">
                      <img
                        src={facData.preview}
                        alt={`รูป${facName}`}
                        className="facility-preview-img"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 5. Financial */}
          <div className="preview-section">
            <SectionBadge icon={<FontAwesomeIcon icon={faWallet} />} title="ข้อมูลการเงิน" />
            <PreviewRow label="ประเภทบัญชี:" value={fieldData.account_type} />
            <PreviewRow label="ธนาคาร:" value={fieldData.name_bank} />
            <PreviewRow label="เลขบัญชี:" value={fieldData.number_bank} />
            <PreviewRow
              label="ชื่อเจ้าของบัญชี:"
              value={fieldData.account_holder}
            />
            {fieldData.depositChecked && (
              <PreviewRow
                label="ค่ามัดจำ:"
                value={`${fieldData.price_deposit} บาท`}
              />
            )}
          </div>

          {/* 6. Description */}
          {fieldData.field_description && (
            <div className="preview-section">
              <SectionBadge icon={<FontAwesomeIcon icon={faFileLines} />} title="รายละเอียดและคำแนะนำ" />
              <div
                className="preview-description"
                dangerouslySetInnerHTML={{
                  __html: fieldData.field_description,
                }}
              />
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="preview-modal-footer">
          <button
            className="confirm-submit-btn"
            onClick={(e) => {
              handleSubmit(e);
            }}
            disabled={startProcessLoad}
          >
            {startProcessLoad ? (
              <span className="dot-loading">
                <span className="dot one">●</span>
                <span className="dot two">●</span>
                <span className="dot three">● </span>
              </span>
            ) : (
              <>ยืนยันลงทะเบียนสนาม</>
            )}
          </button>
          <button
            className="cancel-preview-btn"
            onClick={() => setShowPreview(false)}
            disabled={startProcessLoad}
          >
            แก้ไขข้อมูล
          </button>
        </div>
      </div>
    </div>
  );
}
