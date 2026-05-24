import React from "react";

export default function FacilitiesForm({
  facilities,
  selectedFacilities,
  handleFacilityChange,
  handleFacilityPriceChange,
  handleFacilityQuantityChange,
  handleFacilityDescription,
  handleFacilityImageChange,
  handleRemoveFacilityImage,
  otherChecked,
  setOtherChecked,
  otherFacility,
  setOtherFacility,
  handleOtherFacilityConfirm,
  startProcessLoad,
  notify,
}) {
  return (
    <>
      <div className="input-group-register-field">
        <div className="icon-label-container">
          <label>สิ่งอำนวยความสะดวก</label>
          <img
            width={20}
            height={20}
            style={{ verticalAlign: "middle" }}
            src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757260382/zondicons--add-solid_hmeqxs.png"
            alt=""
          />
        </div>
        <small
          style={{
            color: "#666",
            fontSize: "14px",
            marginTop: "5px",
            display: "block",
          }}
        >
          ✓ เลือกเฉพาะสิ่งอำนวยความสะดวกที่สนามของคุณมีจริง
          หากต้องการเพิ่มสิ่งอำนวยอื่นๆ ให้กดเพิ่มเองด้านล่าง
        </small>
      </div>
      <div className="factcon-register-field">
        {facilities.map((fac) => {
          const key = fac.fac_name;
          const isSelected = selectedFacilities[key] !== undefined;
          return (
            <div
              key={key}
              className={`facility-item-register-field ${
                isSelected ? "selected" : ""
              }`}
            >
              <div className="input-group-checkbox-register-field">
                <input
                  type="checkbox"
                  id={`facility-${key}`}
                  checked={isSelected}
                  onChange={() => handleFacilityChange(key)}
                />
                <label htmlFor={`facility-${key}`}>{fac.fac_name}</label>
              </div>
              {isSelected && (
                <div className="facility-inputs-container">
                  <div className="facility-inputs-grid">
                    <input
                      type="text"
                      className="facility-price-input"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={7}
                      placeholder="กำหนดราคา"
                      value={selectedFacilities[key]?.price ?? ""}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "").slice(0, 6);
                        handleFacilityPriceChange(key, v);
                      }}
                    />
                    <input
                      type="text"
                      className="facility-quantity-input"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={3}
                      min={1}
                      placeholder="จำนวน"
                      value={selectedFacilities[key]?.quantity ?? ""}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "").slice(0, 3);
                        if (v === "0") {
                          notify("จำนวนต้องไม่น้อยกว่า 1", "error");
                          v = "";
                          return;
                        }
                        handleFacilityQuantityChange(key, v);
                      }}
                    />
                    <textarea
                      type="text"
                      className="facility-description-input"
                      maxLength={50}
                      placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                      value={selectedFacilities[key]?.description ?? ""}
                      onChange={(e) => {
                        handleFacilityDescription(key, e.target.value);
                      }}
                    ></textarea>
                    <div className="faccility-image-section">
                      <label className="file-label-register-field">
                        เลือกรูปภาพ (ถ้ามี)
                        <input
                          style={{ display: "none" }}
                          type="file"
                          className="facility-file-input"
                          accept="image/*"
                          onChange={(e) =>
                            handleFacilityImageChange(key, e.target.files?.[0])
                          }
                        />
                      </label>
                    </div>
                  </div>
                  {selectedFacilities[key]?.preview && (
                    <div className="facility-image-preview">
                      <img
                        src={selectedFacilities[key].preview}
                        alt={`รูป${fac.fac_name}`}
                        className="facility-preview-img"
                      />
                      <button
                        type="button"
                        className="facility-remove-img-btn"
                        onClick={() => handleRemoveFacilityImage(key)}
                      >
                        ลบรูป
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div className="other-facility-section">
          <div className="input-group-checkbox-register-field">
            <input
              type="checkbox"
              id="other-facility"
              checked={otherChecked}
              onChange={(e) => {
                setOtherChecked(e.target.checked);
              }}
            />
            <label htmlFor="other-facility">
              เพิ่มสิ่งอำนวยความสะดวกอื่น ๆ ที่ไม่มีในรายการข้างต้น
            </label>
          </div>
          <small
            style={{
              color: "#666",
              fontSize: "14px",
              marginLeft: "20px",
              display: "block",
              fontStyle: "italic",
            }}
          >
            กรณีที่สนามมีสิ่งอำนวยความสะดวกพิเศษที่ไม่มีในรายการ ให้เพิ่มเองที่นี่
          </small>
          {otherChecked && (
            <div
              className="other-facility-inputs"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginTop: "10px",
                padding: "15px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                backgroundColor: "#f9f9f9",
              }}
            >
              <input
                type="text"
                maxLength={100}
                placeholder="ชื่อสิ่งอำนวยความสะดวก"
                value={otherFacility.name}
                onChange={(e) =>
                  setOtherFacility((f) => ({ ...f, name: e.target.value }))
                }
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  padding: "16px",
                  backgroundColor: "white",
                  border: "1px solid #e5e7ebc",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={7}
                placeholder="ราคา (ใส่ 0 ถ้าฟรี)"
                value={otherFacility.price}
                onChange={(e) =>
                  setOtherFacility((f) => ({
                    ...f,
                    price: e.target.value.replace(/\D/g, "").slice(0, 6),
                  }))
                }
                style={{
                  padding: "8px 12px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={3}
                placeholder="จำนวน"
                value={otherFacility.quantity}
                onChange={(e) =>
                  setOtherFacility((f) => ({
                    ...f,
                    quantity: e.target.value.replace(/\D/g, "").slice(0, 3),
                  }))
                }
                style={{
                  padding: "8px 12px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
              <button
                type="button"
                className="other-facility-confirm-btn"
                disabled={startProcessLoad}
                onClick={handleOtherFacilityConfirm}
                style={{
                  cursor: startProcessLoad ? "not-allowed" : "pointer",
                }}
              >
                ยืนยัน
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
