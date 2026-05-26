"use client";
import React from "react";

export default function FieldModal({
  isOpen,
  onClose,
  title,
  children,
  onSave,
  saveText = "บันทึก",
  cancelText = "ยกเลิก",
  startProcessLoad = false,
  maxWidth = "600px",
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay-editfield" onClick={onClose}>
      <div 
        className="modal-editfield" 
        style={{ maxWidth }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-editfield">
          <h3>{title}</h3>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body-editfield">
          {children}
        </div>
        <div className="modal-actions-editfield">
          <button
            className="savebtn-editfield"
            onClick={onSave}
            disabled={startProcessLoad}
          >
            {startProcessLoad ? (
              <span className="dot-loading">
                <span className="dot one">●</span>
                <span className="dot two">●</span>
                <span className="dot three">●</span>
              </span>
            ) : (
              saveText
            )}
          </button>
          <button
            className="canbtn-editfield"
            onClick={onClose}
            disabled={startProcessLoad}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
