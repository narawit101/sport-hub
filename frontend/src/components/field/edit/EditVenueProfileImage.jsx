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
  if (editingField !== "img_field") return null;

  return (
    <div className="input-group-editfield-profile">
      <div className="edit-image-form-header">
        <h3>อัปโหลดรูปภาพสนามใหม่</h3>
        <p>รูปภาพจะแสดงในส่วน Banner ของหน้าสนาม</p>
      </div>
      
      <label className="field-image-label-editfield">
        <input
          style={{ display: "none" }}
          type="file"
          onChange={handleImgChange}
          accept="image/*"
        />
        {previewUrl ? "เปลี่ยนรูปภาพที่เลือก" : "เลือกรูปภาพจากเครื่อง"}
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
            "บันทึกรูปภาพ"
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
  );
};

export default EditVenueProfileImage;
