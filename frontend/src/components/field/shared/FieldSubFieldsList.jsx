"use client";
import React from "react";

export default function FieldSubFieldsList({
  subFields,
  isEditMode = false,
  onEdit,
  onDelete,
  onAddAddon,
  onEditAddon,
  onDeleteAddon,
  editingField,
  editingAddon,
  startProcessLoad = false,
  formatPrice,
  showAddOnForm = {},
}) {
  if ((!subFields || subFields.length === 0) && !isEditMode) {
    return (
      <div className="custom-no-fields-message">
        <p>ยังไม่มีข้อมูลสนามย่อย</p>
      </div>
    );
  }

  return (
    <div className="sub-fields-container-editfield">
      {subFields.map((sub) => (
        <div key={sub.sub_field_id} className="sub-field-card-editfield">
          <div className="sub-field-header">
            <h3>สนามย่อย {sub.sub_field_name}</h3>
            <span className="sub-field-sport">{sub.sport_name}</span>
          </div>

          <div className="sub-field-display">
            <div className="field-info-grid">
              <div className="info-item">
                <span className="info-label">ราคา:</span>
                <span className="info-value">{formatPrice(sub.price)} บาท</span>
              </div>
              <div className="info-item">
                <span className="info-label">ผู้เล่น:</span>
                <span className="info-value">{sub?.players_per_team} คน</span>
              </div>
              <div className="info-item">
                <span className="info-label">ขนาดสนาม:</span>
                <span className="info-value">
                  {formatPrice(sub?.wid_field)} ×{" "}
                  {formatPrice(sub?.length_field)} ม.
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">พื้นสนาม:</span>
                <span className="info-value">{sub?.field_surface || "-"}</span>
              </div>
            </div>

            {isEditMode && editingField !== sub.sub_field_id && (
              <div className="sub-field-actions">
                <button
                  className="edit-btn-inline"
                  onClick={() => onEdit && onEdit(sub)}
                  disabled={startProcessLoad}
                >
                  แก้ไข
                </button>
                <button
                  className="delete-facility-btn-simple"
                  onClick={() => onDelete && onDelete(sub)}
                  disabled={startProcessLoad}
                >
                  ลบ
                </button>
              </div>
            )}
          </div>

          <div className="addons-section">
            <div className="addons-header">
              <h4>กิจกรรมพิเศษ</h4>
              {isEditMode && (
                <button
                  className="edit-btn-inline"
                  onClick={() => onAddAddon && onAddAddon(sub.sub_field_id)}
                  disabled={startProcessLoad}
                >
                  {showAddOnForm[sub.sub_field_id] ? "ยกเลิก" : "+ เพิ่ม"}
                </button>
              )}
            </div>

            {sub.add_ons && sub.add_ons.length > 0 ? (
              <div className="addon-list">
                {sub.add_ons.map((addon) => (
                  <div key={addon.add_on_id} className="addon-item">
                    <div className="addon-info">
                      <span className="addon-name">{addon.content}</span>
                      <span className="addon-price">
                        {formatPrice(addon.price)} บาท
                      </span>
                    </div>
                    {isEditMode &&
                      editingAddon?.addOnId !== addon.add_on_id && (
                        <div className="addon-actions">
                          <button
                            className="edit-btn-inline"
                            onClick={() => onEditAddon && onEditAddon(addon)}
                            disabled={startProcessLoad}
                          >
                            แก้ไข
                          </button>
                          <button
                            className="delete-facility-btn-simple"
                            onClick={() =>
                              onDeleteAddon && onDeleteAddon(addon)
                            }
                            disabled={startProcessLoad}
                          >
                            ลบ
                          </button>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-addons">ไม่มีกิจกรรมพิเศษ</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
