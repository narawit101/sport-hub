"use client";
import React from "react";

export default function FieldFacilitiesList({
  facilities,
  isEditMode = false,
  onEdit,
  onDelete,
  startProcessLoad = false,
  formatPrice,
}) {
  if ((!facilities || facilities.length === 0) && !isEditMode) {
    return (
      <div className="no-facilities-message">
        <p>ไม่มีสิ่งอำนวยความสะดวก</p>
      </div>
    );
  }

  return (
    <div className="facilities-grid-simple-checkfield">
      {facilities.map((facility) => (
        <div key={facility.field_fac_id} className="facility-card-simple-checkfield">
          <div className="facility-image-simple-checkfield">
            {facility.image_path ? (
              <img src={facility.image_path} alt={facility.fac_name} />
            ) : (
              <div className="facility-no-image">ไม่มีรูป</div>
            )}
          </div>
          <div className="facility-details-simple-checkfield">
            <h3 className="facility-name-simple-checkfield">{facility.fac_name}</h3>
            <div className="detail-row">
              <span>ราคา:</span>
              <span>{formatPrice(facility.fac_price)} บาท</span>
            </div>
            <div className="detail-row">
              <span>จำนวน:</span>
              <span>{facility.quantity_total} {facility.unit || "ชิ้น"}</span>
            </div>
            {facility.description && (
              <div className="detail-row description">
                <span>รายละเอียด:</span>
                <span>{facility.description}</span>
              </div>
            )}
            {isEditMode && (
              <div className="facility-actions">
                <button
                  className="edit-btn-inline"
                  onClick={() => onEdit && onEdit(facility)}
                  disabled={startProcessLoad}
                >
                  แก้ไข
                </button>
                <button
                  className="delete-facility-btn-simple"
                  onClick={() => onDelete && onDelete(facility.field_id, facility.field_fac_id)}
                  disabled={startProcessLoad}
                >
                  ลบ
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
