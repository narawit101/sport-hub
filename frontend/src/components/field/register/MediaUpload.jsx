import React from "react";

export default function MediaUpload({ fieldData, handleimgChange, handleFileChange }) {
  return (
    <>
      <div className="input-group-register-field">
        <div className="icon-label-container">
          <label htmlFor="img_field">รูปโปรไฟล์สนาม:</label>
          <img
            width={20}
            height={20}
            style={{ verticalAlign: "middle" }}
            src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757260568/streamline--user-profile-focus-solid_bkna8e.png"
            alt=""
          />
        </div>
        <label
          style={{ textAlign: "center" }}
          className="file-label-register-field"
        >
          <input
            type="file"
            style={{ display: "none" }}
            onChange={handleimgChange}
            accept="image/*"
          />
          เลือกรูปภาพสนาม
        </label>
      </div>

      {fieldData.imgPreview && (
        <div className="preview-container-regis-field">
          <img src={fieldData.imgPreview} alt="Preview" />
        </div>
      )}

      <div className="input-group-register-field">
        <div className="icon-label-container">
          <label htmlFor="documents">
            เอกสาร หรือรูป (เพิ่มได้สูงสุด 10 ไฟล์):
          </label>
          <img
            width={20}
            height={20}
            style={{ verticalAlign: "middle" }}
            src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757260641/material-symbols--lab-profile-sharp_rlwd0x.png"
            alt=""
          />
        </div>
        <label
          style={{ textAlign: "center" }}
          className="file-label-register-field"
        >
          <input
            style={{ display: "none" }}
            type="file"
            onChange={handleFileChange}
            accept="image/*,.pdf"
            multiple
          />
          เลือกเอกสาร
        </label>
      </div>
      {fieldData.documents && fieldData.documents.length > 0 && (
        <div className="selected-documents">
          <p className="selected-documents-title">
            ไฟล์ที่เลือก ({fieldData.documents.length}):
          </p>
          <ul className="selected-documents-list">
            {Array.from(fieldData.documents).map((file, idx) => (
              <li key={idx}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
