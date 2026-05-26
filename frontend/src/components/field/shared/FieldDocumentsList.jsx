"use client";
import React from "react";

export default function FieldDocumentsList({
  documents,
  isEditMode = false,
  onDelete,
  onEdit,
  startProcessLoad = false,
}) {
  const docList = Array.isArray(documents)
    ? documents
    : typeof documents === "string"
      ? documents.split(",").filter((d) => d.trim() !== "")
      : [];

  if (docList.length === 0 && !isEditMode) {
    return (
      <div className="no-documents">
        <div className="no-documents-icon">ไม่มีเอกสาร</div>
        <p>ไม่มีเอกสารแนบ</p>
      </div>
    );
  }

  return (
    <div className="documents-grid">
      {docList.map((doc, i) => {
        const docUrl = doc.trim();
        const fileName = docUrl.split("/").pop() || `เอกสาร ${i + 1}`;
        const fileExt = fileName.split(".").pop()?.toLowerCase();

        return (
          <div className="document-card" key={i}>
            <div className="document-icon">
              {fileExt === "pdf" ? (
                <div className="pdf-icon-display">
                  <div className="pdf-icon-large">PDF</div>
                </div>
              ) : ["jpg", "jpeg", "png", "gif"].includes(fileExt) ? (
                <div className="image-preview">
                  <img
                    src={docUrl}
                    alt={`เอกสาร ${i + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  <div className="file-fallback" style={{ display: "none" }}>
                    IMG
                  </div>
                </div>
              ) : (
                <span className={`file-icon ${["doc", "docx"].includes(fileExt) ? "doc-icon" : "file-icon"}`}>
                  {["doc", "docx"].includes(fileExt) ? "DOC" : "FILE"}
                </span>
              )}
            </div>
            <div className="document-info">
              <h4 className="document-name">
                เอกสาร {i + 1}
                <span className={`file-type-inline ${
                  fileExt === "pdf" ? "pdf-type" : 
                  ["jpg", "jpeg", "png", "gif"].includes(fileExt) ? "image-type" : 
                  ["doc", "docx"].includes(fileExt) ? "doc-type" : "file-type"
                }`}>
                  {fileExt === "pdf" ? "PDF" : 
                   ["jpg", "jpeg", "png", "gif"].includes(fileExt) ? "รูป" : 
                   ["doc", "docx"].includes(fileExt) ? "DOC" : "FILE"}
                </span>
              </h4>
              <p className="document-filename">{fileName}</p>
              <div className="document-actions">
                <button
                  className="btn-preview"
                  onClick={() => window.open(docUrl, "_blank")}
                >
                  เปิด
                </button>
                {isEditMode && onEdit && (
                  <button
                    className="edit-btn-inline"
                    onClick={() => onEdit(i, docUrl)}
                    disabled={startProcessLoad}
                  >
                    แก้ไข
                  </button>
                )}
              </div>
            </div>
            {isEditMode && onDelete && (
              <button
                className="btn-delete-doc"
                onClick={() => onDelete(docUrl, i)}
                disabled={startProcessLoad}
                title="ลบเอกสาร"
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
