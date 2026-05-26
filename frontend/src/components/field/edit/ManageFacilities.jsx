"use client";
import React from "react";
import FieldFacilitiesList from "@/components/field/shared/FieldFacilitiesList";
import FieldModal from "@/components/field/shared/FieldModal";

const ManageFacilities = ({
  fieldId,
  isEditMode = false,
  facilities = [],
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
  newFac = [],
  handleChange,
  onSaveNewFac,
  startProcessLoad,
  formatPrice,
}) => {
  return (
    <div className="manage-facilities-wrapper">
      <div className="field-facilities-check-field">
        <h1>
          <span>สิ่งอำนวยความสะดวก:</span>
          {isEditMode && (
            <button
              className="edit-btn-inline"
              onClick={handleToggleNewFacility}
              style={{ background: 'var(--text-color)', color: 'white' }}
            >
              + เพิ่ม
            </button>
          )}
        </h1>
        <div className="facilities-list-container check-field-scroll-section">
          <FieldFacilitiesList 
            facilities={facilities}
            isEditMode={isEditMode}
            onEdit={handleEditFacility}
            onDelete={handleConfirmDelete}
            startProcessLoad={startProcessLoad}
            formatPrice={formatPrice}
          />
        </div>
      </div>

      {/* Modal สำหรับแก้ไขรายการเดิม */}
      {isEditMode && editingFacility && (
        <FieldModal
          isOpen={true}
          onClose={handleCancelEdit}
          title="แก้ไขสิ่งอำนวยความสะดวก"
          onSave={handleSaveEditFacility}
          startProcessLoad={startProcessLoad}
          maxWidth="500px"
        >
          <div className="facility-edit-form">
            <div className="facility-image-preview-center" style={{ textAlign: 'center', marginBottom: '20px' }}>
              {editFacilityData?.facility_image ? (
                <img
                  src={URL.createObjectURL(editFacilityData.facility_image)}
                  alt="Preview"
                  style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '10px', border: '2px solid #f1f5f9' }}
                />
              ) : (
                facilities?.find(f => f.field_fac_id === editingFacility)?.image_path && (
                  <img
                    src={facilities.find(f => f.field_fac_id === editingFacility)?.image_path}
                    alt="Current"
                    style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '10px', border: '2px solid #f1f5f9' }}
                  />
                )
              )}
            </div>

            <div className="form-grid">
              <div className="form-group form-group-full">
                <label>ชื่อสิ่งอำนวยความสะดวก</label>
                <input
                  type="text"
                  value={editFacilityData?.facility_name || ""}
                  onChange={(e) => handleEditInputChange("facility_name", e.target.value)}
                  maxLength={50}
                  placeholder="ระบุชื่อรายการ"
                />
              </div>
              <div className="form-group">
                <label>ราคา (บาท)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editFacilityData?.facility_price || ""}
                  onChange={(e) => handleEditInputChange("facility_price", e.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label>จำนวน</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editFacilityData?.facility_count || ""}
                  onChange={(e) => handleEditInputChange("facility_count", e.target.value.replace(/\D/g, ""))}
                  placeholder="1"
                />
              </div>
              <div className="form-group form-group-full">
                <label>รายละเอียด</label>
                <textarea
                  value={editFacilityData?.facility_description || ""}
                  onChange={(e) => handleEditInputChange("facility_description", e.target.value)}
                  rows="3"
                  maxLength={200}
                  placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)"
                />
              </div>
              <div className="form-group form-group-full">
                <label className="facility-image-label" style={{ display: 'block', padding: '10px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', textAlign: 'center', cursor: 'pointer' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageChange}
                    style={{ display: "none" }}
                  />
                  เปลี่ยนรูปภาพประกอบ
                </label>
              </div>
            </div>
          </div>
        </FieldModal>
      )}

      {/* Modal สำหรับเพิ่มรายการใหม่ */}
      {isEditMode && showNewFacilityInput && (
        <FieldModal
          isOpen={true}
          onClose={handleToggleNewFacility}
          title="เพิ่มสิ่งอำนวยความสะดวกใหม่"
          onSave={() => onSaveNewFac(0)}
          saveText="บันทึกรายการ"
          startProcessLoad={startProcessLoad}
          maxWidth="500px"
        >
          {newFac && newFac[0] && (
            <div className="facility-edit-form">
              <div className="form-grid">
                <div className="form-group form-group-full">
                  <label>ชื่อสิ่งอำนวยความสะดวก</label>
                  <input
                    placeholder="ชื่อสิ่งอำนวยความสะดวก"
                    type="text"
                    maxLength={50}
                    value={newFac[0].fac_name || ""}
                    onChange={(e) => handleChange(0, "fac_name", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>ราคา</label>
                  <input
                    placeholder="0"
                    type="text"
                    inputMode="numeric"
                    value={newFac[0].fac_price || ""}
                    onChange={(e) => handleChange(0, "fac_price", e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                <div className="form-group">
                  <label>จำนวน</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="1"
                    value={newFac[0].quantity_total || ""}
                    onChange={(e) => handleChange(0, "quantity_total", e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                <div className="form-group form-group-full">
                  <label>รายละเอียด</label>
                  <textarea
                    maxLength={100}
                    placeholder="รายละเอียด (ถ้ามี)"
                    value={newFac[0].description || ""}
                    onChange={(e) => handleChange(0, "description", e.target.value)}
                  />
                </div>
                <div className="form-group form-group-full">
                  <label className="file-label-fac" style={{ display: 'block', padding: '10px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', textAlign: 'center', cursor: 'pointer' }}>
                    <input
                      type="file"
                      onChange={(e) => handleChange(0, "image_path", e.target.files[0])}
                      accept="image/*"
                      style={{ display: "none" }}
                    />
                    {newFac[0].image_preview ? "เปลี่ยนรูปภาพ" : "เลือกรูปภาพ (ถ้ามี)"}
                  </label>
                  {newFac[0].image_preview && (
                    <div style={{ textAlign: 'center', marginTop: '12px' }}>
                      <img
                        src={newFac[0].image_preview}
                        alt="preview"
                        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </FieldModal>
      )}
    </div>
  );
};

export default ManageFacilities;
