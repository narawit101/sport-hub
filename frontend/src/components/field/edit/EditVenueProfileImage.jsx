"use client";
import React from "react";

const EditVenueProfileImage = ({
  field,
  startProcessLoad,
  saveImageField,
  handleImgChange,
  cancelEditing,
  editingField,
  startEditing,
  previewUrl,
}) => {
  return (
    <div className="input-group-editfield-profile">
      {editingField === "img_field" ? (
        <>
          <div className="preview-container-editfield">
            {previewUrl && <img src={previewUrl} alt="preview" />}
          </div>
          <div>
            <label className="field-image-label-editfield">
              <input
                style={{ display: "none" }}
                type="file"
                onChange={handleImgChange}
                accept="image/*"
              />
              เลือกรูปภาพใหม่
            </label>

            <div className="btn-group-editfield">
              <button
                className="savebtn-editfield"
                style={{
                  cursor: startProcessLoad ? "not-allowed" : "pointer",
                }}
                disabled={startProcessLoad}
                onClick={saveImageField}
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
                className="canbtn-editfield"
                style={{
                  cursor: startProcessLoad ? "not-allowed" : "pointer",
                }}
                disabled={startProcessLoad}
                onClick={cancelEditing}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="preview-container-editfield">
            <img
              src={`${field?.img_field}`}
              alt="รูปสนามกีฬา"
            />
          </div>
          <div className="btn-group-editfield">
            <button
              style={{
                cursor: startProcessLoad ? "not-allowed" : "pointer",
              }}
              disabled={startProcessLoad}
              className="editbtn-editfield-center"
              onClick={() => startEditing("img_field", field?.img_field)}
            >
              แก้ไขรูปโปรไฟล์
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default EditVenueProfileImage;
