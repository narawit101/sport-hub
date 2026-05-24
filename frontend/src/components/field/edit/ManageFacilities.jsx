"use client";
import React from "react";

const ManageFacilities = ({
  fieldId,
  facilities,
  editingFacility,
  editFacilityData,
  handleEditFacility,
  handleCancelEdit,
  handleSaveEditFacility,
  handleEditInputChange,
  handleEditImageChange,
  handleConfirmDelete,
  showNewFacilityInput,
  handleToggleNewFacility,
  newFac,
  setNewFac,
  handleChange,
  onSaveNewFac,
  startProcessLoad,
  formatPrice,
  notify,
}) => {
  return (
    <>
      <div className="field-row-checkfield">
        <div className="field-details-checkfield-fac">
          <strong>สิ่งอำนวยความสะดวกในสนาม:</strong>
          <div className="field-value-checkfield">
            <div className="facilities-display">
              {Array.isArray(facilities) && facilities.length === 0 ? (
                <div className="no-facilities-message">
                  <span>ยังไม่มีสิ่งอำนวยความสะดวกสำหรับสนามนี้</span>
                </div>
              ) : Array.isArray(facilities) && facilities.length > 0 ? (
                <div className="facilities-grid-simple">
                  {facilities.map((facility) => (
                    <div
                      className="facility-card-simple"
                      key={facility.field_fac_id}
                    >
                      {editingFacility === facility.field_fac_id ? (
                        <div className="facility-edit-form">
                          <div className="facility-image-simple">
                            {facility.image_path &&
                            !editFacilityData.facility_image ? (
                              <img
                                src={facility.image_path}
                                alt={facility.fac_name}
                                onError={(e) => {
                                  e.target.src =
                                    "/images/placeholder-image.png";
                                }}
                              />
                            ) : editFacilityData.facility_image ? (
                              <img
                                src={URL.createObjectURL(
                                  editFacilityData.facility_image
                                )}
                                alt="Preview"
                              />
                            ) : (
                              <div className="facility-no-image">
                                ยังไม่มีรูป
                              </div>
                            )}
                          </div>

                          <div className="facility-edit-inputs">
                            <div className="input-group-edit">
                              <label htmlFor="facility-name">
                                ชื่อสิ่งอำนวยความสะดวก
                              </label>
                              <input
                                id="facility-name"
                                type="text"
                                placeholder="กรุณาใส่ชื่อสิ่งอำนวยความสะดวก"
                                value={editFacilityData.facility_name}
                                onChange={(e) =>
                                  handleEditInputChange(
                                    "facility_name",
                                    e.target.value
                                  )
                                }
                                maxLength={50}
                              />
                            </div>

                            <div className="input-group-edit">
                              <label htmlFor="facility-price">
                                ราคา (บาท)
                              </label>
                              <input
                                id="facility-price"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={7}
                                placeholder="กรุณาใส่ราคา"
                                value={editFacilityData.facility_price}
                                onChange={(e) => {
                                  let value = e.target.value.replace(
                                    /\D/g,
                                    ""
                                  );
                                  if (value >= 999999) {
                                    notify("ใส่ได้ไม่เกิน 5 หลัก", "error");
                                    return;
                                  }
                                  handleEditInputChange(
                                    "facility_price",
                                    value
                                  );
                                }}
                              />
                            </div>

                            <div className="input-group-edit">
                              <label htmlFor="facility-count">จำนวน</label>
                              <input
                                id="facility-count"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={7}
                                placeholder="กรุณาใส่จำนวน"
                                value={editFacilityData.facility_count}
                                onChange={(e) => {
                                  let value = e.target.value.replace(
                                    /\D/g,
                                    ""
                                  );
                                  if (value >= 999999) {
                                    notify("ใส่ได้ไม่เกิน 5 หลัก", "error");
                                    return;
                                  }
                                  handleEditInputChange(
                                    "facility_count",
                                    value
                                  );
                                }}
                                min="1"
                              />
                            </div>

                            <div className="input-group-edit">
                              <label htmlFor="facility-description">
                                รายละเอียด
                              </label>
                              <textarea
                                id="facility-description"
                                placeholder="ใส่รายละเอียดสิ่งอำนวยความสะดวก (ถ้ามี)"
                                value={editFacilityData.facility_description}
                                onChange={(e) =>
                                  handleEditInputChange(
                                    "facility_description",
                                    e.target.value
                                  )
                                }
                                rows="3"
                                maxLength={200}
                              />
                            </div>

                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleEditImageChange}
                              style={{ display: "none" }}
                              className="file-label-fac"
                              id={`facility-image-${facility.field_fac_id}`}
                            />
                            <label
                              htmlFor={`facility-image-${facility.field_fac_id}`}
                              className="facility-image-label"
                            >
                              {editFacilityData.facility_image
                                ? "เปลี่ยนรูปภาพ"
                                : "เปลี่ยนรูปภาพ"}
                            </label>

                            <div className="facility-edit-actions">
                              <button
                                className="save-edit-btn"
                                onClick={handleSaveEditFacility}
                                disabled={startProcessLoad}
                              >
                                {startProcessLoad ? (
                                  <span className="dot-loading">
                                    <span className="dot one">●</span>
                                    <span className="dot two">●</span>
                                    <span className="dot three">●</span>
                                  </span>
                                ) : (
                                  "บันทึก"
                                )}
                              </button>
                              <button
                                className="cancel-edit-btn"
                                onClick={handleCancelEdit}
                                disabled={startProcessLoad}
                              >
                                ยกเลิก
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="facility-image-simple">
                            {facility.image_path ? (
                              <img
                                src={facility.image_path}
                                alt={facility.fac_name}
                                onError={(e) => {
                                  e.target.src =
                                    "/images/placeholder-image.png";
                                }}
                              />
                            ) : (
                              <div className="facility-no-image">
                                ยังไม่มีรูป
                              </div>
                            )}
                          </div>
                          <div className="facility-info-simple">
                            <h4 className="facility-name-simple">
                              {facility.fac_name}
                            </h4>

                            <div className="facility-details-simple">
                              <div className="detail-row">
                                <span>ราคา: </span>
                                <span>
                                  {formatPrice(facility.fac_price)} บาท
                                </span>
                              </div>
                              <div className="detail-row">
                                <span>จำนวน: </span>
                                <span>{facility.quantity_total} ชิ้น</span>
                              </div>
                              <div className="detail-row">
                                <span>รายละเอียด: </span>
                                <span>
                                  {facility.description &&
                                  facility.description.trim() !== ""
                                    ? facility.description
                                    : "ยังไม่มีรายละเอียด"}
                                </span>
                              </div>
                            </div>

                            <div className="facility-actions">
                              <button
                                style={{
                                  cursor: startProcessLoad
                                    ? "not-allowed"
                                    : "pointer",
                                }}
                                disabled={startProcessLoad}
                                className="edit-btn-inline"
                                onClick={() => handleEditFacility(facility)}
                                title="แก้ไขสิ่งอำนวยความสะดวก"
                              >
                                แก้ไข
                              </button>
                              <button
                                style={{
                                  cursor: startProcessLoad
                                    ? "not-allowed"
                                    : "pointer",
                                }}
                                disabled={startProcessLoad}
                                className="delete-facility-btn-simple"
                                onClick={() =>
                                  handleConfirmDelete(
                                    fieldId,
                                    facility.field_fac_id
                                  )
                                }
                                title="ลบสิ่งอำนวยความสะดวก"
                              >
                                ลบ
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="error-message">
                  <span>ข้อมูลผิดพลาด</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="field-row-checkfield">
        <div className="field-details-checkfield">
          <strong>เพิ่มสิ่งอำนวยความสะดวกใหม่:</strong>
          <div className="field-value-checkfield">
            <div className="btn-center-add-fac">
              <button
                type="button"
                className="toggle-addon-btn"
                onClick={handleToggleNewFacility}
                disabled={startProcessLoad}
              >
                {showNewFacilityInput
                  ? "ยกเลิก"
                  : "เพิ่มสิ่งอำนวยความสะดวกใหม่"}
              </button>
            </div>
            {newFac.map((fac, index) => (
              <div key={index} className="facility-form">
                <input
                  placeholder="ชื่อสิ่งอำนวยความสะดวก"
                  type="text"
                  maxLength={50}
                  value={fac.fac_name}
                  onChange={(e) =>
                    handleChange(index, "fac_name", e.target.value)
                  }
                />
                <input
                  placeholder="ราคา"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={7}
                  value={fac.fac_price || ""}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, "");
                    if (value >= 999999) {
                      notify("ใส่ได้ไม่เกิน 5 หลัก", "error");
                      return;
                    }
                    handleChange(index, "fac_price", value);
                  }}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={7}
                  placeholder="จำนวนทั้งหมด"
                  value={fac.quantity_total}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, "");
                    if (value >= 999999) {
                      return;
                    }
                    handleChange(index, "quantity_total", value);
                  }}
                />
                <textarea
                  maxLength={50}
                  placeholder="รายละเอียด (ถ้ามี)"
                  value={fac.description}
                  onChange={(e) =>
                    handleChange(index, "description", e.target.value)
                  }
                />

                <div className="facility-image-input-row">
                  <label className="file-label-fac">
                    <input
                      type="file"
                      onChange={(e) =>
                        handleChange(index, "image_path", e.target.files[0])
                      }
                      accept="image/*"
                      className="file-input-hidden-fac"
                      style={{ display: "none" }}
                    />
                    เลือกรูปภาพ (ถ้ามี)
                  </label>
                  {fac?.image_preview ? (
                    <div className="fac-preview-wrap">
                      <img
                        src={fac.image_preview}
                        alt={`preview-${index}`}
                        className="fac-preview-img"
                      />
                      <button
                        type="button"
                        className="remove-fac-image-btn"
                        onClick={() => {
                          if (fac.image_preview) {
                            try {
                              URL.revokeObjectURL(fac.image_preview);
                            } catch (e) {}
                          }
                          setNewFac((prev) => {
                            const updated = [...prev];
                            updated[index] = {
                              ...updated[index],
                              image_path: null,
                              image_preview: null,
                            };
                            return updated;
                          });
                        }}
                        title="ลบรูป"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  ) : null}
                </div>
                <div className="save-add-fac-edit-field">
                  <button
                    type="button"
                    disabled={startProcessLoad}
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    className="save-btn-add-fac"
                    onClick={() => onSaveNewFac(index)}
                  >
                    {startProcessLoad ? (
                      <span className="dot-loading">
                        <span className="dot one">●</span>
                        <span className="dot two">●</span>
                        <span className="dot three">●</span>
                      </span>
                    ) : (
                      "บันทึกสิ่งอำนวยความสะดวก"
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ManageFacilities;
