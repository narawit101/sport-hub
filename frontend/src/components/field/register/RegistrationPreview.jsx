import React from "react";
import { formatPrice, daysInThai } from "@/app/utils/format";

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

  return (
    <div className="preview-modal-overlay">
      <div className="preview-modal">
        <div className="preview-modal-header">
          <h2>ตรวจสอบข้อมูลก่อนลงทะเบียน</h2>
          <button
            disabled={startProcessLoad}
            style={{ cursor: startProcessLoad ? "not-allowed" : "pointer" }}
            className="close-modal-btn"
            onClick={() => setShowPreview(false)}
          >
            ✕
          </button>
        </div>

        <div className="preview-modal-content">
          <div className="preview-section">
            <div className="preview-section">
              <div className="icon-label-container">
                <h3>รูปโปรไฟล์สนาม:</h3>
                <img
                  width={20}
                  height={20}
                  style={{ verticalAlign: "middle" }}
                  src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757260568/streamline--user-profile-focus-solid_bkna8e.png"
                  alt=""
                />
                {fieldData.img_field?.name || "ไม่ได้เลือก"}
              </div>
              {fieldData.imgPreview && (
                <div className="preview-container-regis-field">
                  <img src={fieldData.imgPreview} alt="Preview" />
                </div>
              )}
              <div className="preview-item">
                <div className="icon-label-container">
                  <h3>เอกสาร :</h3>
                  <img
                    width={20}
                    height={20}
                    style={{ verticalAlign: "middle", marginTop: "4px" }}
                    src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757260641/material-symbols--lab-profile-sharp_rlwd0x.png"
                    alt=""
                  />
                </div>
                {fieldData.documents
                  ? `${fieldData.documents.length} ไฟล์`
                  : "ไม่ได้เลือก"}
                <div className="preview-subfield">
                  {fieldData.documents && Array.from(fieldData.documents).map((file, idx) => (
                    <div className="sub-detail" key={idx}>
                      {file.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="icon-label-container">
              <h3>ข้อมูลสนามกีฬา</h3>
              <img
                width={20}
                height={20}
                src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757239976/material-symbols--stadium-rounded_qz7gby.png"
                alt=""
                style={{ verticalAlign: "middle" }}
              />
            </div>
            <div className="preview-item">
              <strong>ชื่อสนาม:</strong> {fieldData.field_name}
            </div>
            <div className="preview-item">
              <strong>ที่อยู่:</strong> {fieldData.address}
            </div>
            <div className="preview-item">
              <strong>พิกัด GPS:</strong> {fieldData.gps_location}
            </div>
            <div className="preview-item">
              <strong>เวลาเปิด-ปิด:</strong> {fieldData.open_hours} -{" "}
              {fieldData.close_hours}
            </div>
            <div className="preview-item">
              <strong>ช่วงเวลาจอง:</strong> {fieldData.slot_duration} นาที
            </div>
            <div className="preview-item">
              <strong>ยกเลิกการจองได้ก่อน:</strong> {fieldData.cancel_hours}{" "}
              ชั่วโมง
            </div>
            <div className="preview-item">
              <strong>วันเปิดบริการ:</strong>{" "}
              {fieldData.open_days
                .map((day) => daysInThai[day] || day)
                .join(", ")}
            </div>
            <div className="preview-section">
              <div className="icon-label-container">
                <h3 style={{ marginTop: "20px" }}>ข้อมูลสนามย่อย: </h3>
                <img
                  width={25}
                  height={25}
                  style={{ verticalAlign: "middle", marginTop: "20px" }}
                  src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757259877/mingcute--playground-fill_v8ekao.png"
                  alt=""
                />
              </div>
              {subFields.map((sub, index) => (
                <div key={index} className="preview-subfield">
                  <strong>ชื่อสนาม:</strong> {sub.name}
                  <br />
                  <span className="sub-detail">
                    ประเภทกีฬา:{" "}
                    {sports.find(
                      (s) => s.sport_id === parseInt(sub.sport_id)
                    )?.sport_name || "ไม่ระบุ"}
                    {sub.price && ` | ราคา: ${sub.price} บาท`}/ชั่วโมง
                    {sub.field_surface &&
                      ` | พื้นสนาม: ${sub.field_surface}`}
                    {sub.wid_field && ` | ความกว้าง: ${sub.wid_field}`}
                    {sub.length_field && ` | ความยาว: ${sub.length_field}`}
                    {sub.players_per_team &&
                      ` | ผู้เล่น: ${sub.players_per_team} คน/ทีม`}
                  </span>
                  <div className="addon-section-preview">
                    <strong className="addon-title-preview">
                      กิจกรรมพิเศษ:
                    </strong>
                    {sub.addOns && sub.addOns.length > 0 ? (
                      <div className="addons-list-preview">
                        {sub.addOns.map((addon, addonIndex) => (
                          <div
                            key={addonIndex}
                            className="addon-item-preview"
                          >
                            <span className="sub-detail">
                              • {addon.content} -{" "}
                              <strong className="addon-price-preview">
                                {addon.price && parseInt(addon.price) > 0
                                  ? `${formatPrice(
                                      addon.price
                                    )} บาท`
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
              ))}
            </div>
            <div className="preview-section">
              <div className="icon-label-container">
                <h3>สิ่งอำนวยความสะดวก</h3>
                <img
                  width={20}
                  height={20}
                  style={{ verticalAlign: "middle" }}
                  src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757260382/zondicons--add-solid_hmeqxs.png"
                  alt=""
                />
              </div>
              {Object.entries(selectedFacilities).map(
                ([facName, facData]) => (
                  <div key={facName} className="preview-facility">
                    <div className="facility-info">
                      <strong>{facName}:</strong>
                      {facData.price && ` ${facData.price} บาท`}
                      {facData.quantity && ` | จำนวน: ${facData.quantity}`}
                      {facData.description &&
                        ` | คำอธิบาย: ${facData.description}`}
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
                )
              )}
            </div>
            <div className="preview-section">
              <div className="icon-label-container">
                <h3>คำแนะนำของสนาม</h3>
                <img
                  width={20}
                  height={20}
                  style={{ verticalAlign: "middle" }}
                  src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757261993/streamline-plump--description-solid_ct73qk.png"
                  alt=""
                />
              </div>
              <div
                className="preview-description"
                dangerouslySetInnerHTML={{
                  __html: fieldData.field_description,
                }}
              />
            </div>
          </div>

          <div className="preview-section">
            <div className="icon-label-container">
              <h3>ข้อมูลการเงิน:</h3>
              <img
                width={20}
                height={20}
                style={{ verticalAlign: "middle" }}
                src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757260760/streamline--bank-remix_jjilhx.png"
                alt=""
              />
            </div>
            <div className="preview-item">
              <strong>ประเภทบัญชี:</strong> {fieldData.account_type}
            </div>
            <div className="preview-item">
              <strong>ธนาคาร:</strong> {fieldData.name_bank}
            </div>
            <div className="preview-item">
              <strong>เลขบัญชี:</strong> {fieldData.number_bank}
            </div>
            <div className="preview-item">
              <strong>ชื่อเจ้าของบัญชี:</strong> {fieldData.account_holder}
            </div>
            {fieldData.depositChecked && (
              <div className="preview-item">
                <strong>ค่ามัดจำ:</strong> {fieldData.price_deposit} บาท
              </div>
            )}
          </div>
        </div>

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
              "ลงทะเบียนสนาม"
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
