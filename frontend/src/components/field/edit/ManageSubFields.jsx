"use client";
import React from "react";
import FieldSubFieldsList from "@/components/field/shared/FieldSubFieldsList";
import FieldModal from "@/components/field/shared/FieldModal";

const ManageSubFields = ({
  field,
  isEditMode = false,
  subFields = [],
  sportsCategories = [],
  editingField,
  updatedSubFieldName,
  setUpdatedSubFieldName,
  updatedPrice,
  setUpdatedPrice,
  updatedSubFieldPlayer,
  setUpdatedSubFieldPlayer,
  updatedSubFieldWid,
  setUpdatedSubFieldWid,
  updatedSubFieldLength,
  setUpdatedSubFieldLength,
  updatedSubFieldFieldSurface,
  setUpdatedSubFieldFieldSurface,
  updatedSportId,
  setUpdatedSportId,
  saveSubField,
  startEditingSubField,
  cancelEditing,
  handleDeleteClick,
  showAddSubFieldForm,
  setShowAddSubFieldForm,
  newSubField = {},
  setNewSubField,
  newSportId,
  setNewSportId,
  addSubField,
  userId,
  showAddOnForm = {},
  setShowAddOnForm,
  addOnInputs = {},
  setAddOnInputs,
  handleAddOnInputChange,
  addAddOn,
  editingAddon,
  setEditingAddon,
  saveAddon,
  setSelectedAddOn,
  setShowDeleteAddOnModal,
  startProcessLoad,
  formatPrice,
  notify,
  startEditingAddon,
  onDeleteAddon,
}) => {
  const showAddOnFormSafe = showAddOnForm || {};

  return (
    <div className="manage-sub-fields-wrapper">
      <div className="field-facilities-check-field" style={{ margin: 0 }}>
        <h1>
          <span>รายการสนามย่อย:</span>
          {isEditMode && (
            <button
              className="edit-btn-inline"
              onClick={() => setShowAddSubFieldForm(true)}
              style={{ background: 'var(--text-color)', color: 'white' }}
            >
              + เพิ่ม
            </button>
          )}
        </h1>
        <div className="sub-fields-list-container check-field-scroll-section">
          <FieldSubFieldsList 
            subFields={subFields}
            isEditMode={isEditMode}
            onEdit={startEditingSubField}
            onDelete={handleDeleteClick}
            onAddAddon={(id) => setShowAddOnForm(prev => ({ ...prev, [id]: !prev[id] }))}
            onEditAddon={startEditingAddon}
            onDeleteAddon={onDeleteAddon}
            editingField={editingField}
            editingAddon={editingAddon}
            startProcessLoad={startProcessLoad}
            formatPrice={formatPrice}
            showAddOnForm={showAddOnFormSafe}
          />
        </div>
      </div>

      <FieldModal
        isOpen={isEditMode && showAddSubFieldForm}
        onClose={() => setShowAddSubFieldForm(false)}
        title="เพิ่มสนามย่อยใหม่"
        onSave={() => addSubField(userId)}
        saveText="บันทึกสนามย่อย"
        startProcessLoad={startProcessLoad}
      >
        <div className="add-subfield-form-editfield">
          <div className="form-grid">
            <div className="form-group form-group-full">
              <label>ชื่อสนามย่อย</label>
              <input type="text" maxLength={20} placeholder="ระบุชื่อสนาม" value={newSubField.sub_field_name || ""} onChange={(e) => setNewSubField({ ...newSubField, sub_field_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>ราคา (บาท)</label>
              <input type="text" inputMode="numeric" placeholder="0" value={newSubField.price ?? ""} onChange={(e) => setNewSubField({ ...newSubField, price: e.target.value.replace(/\D/g, "") })} />
            </div>
            <div className="form-group">
              <label>ผู้เล่นต่อทีม</label>
              <input type="text" inputMode="numeric" placeholder="7" value={newSubField.players_per_team || ""} onChange={(e) => setNewSubField({ ...newSubField, players_per_team: e.target.value.replace(/\D/g, "") })} />
            </div>
            <div className="form-group">
              <label>ประเภทพื้น</label>
              <input type="text" maxLength={20} placeholder="เช่น หญ้าเทียม" value={newSubField.field_surface || ""} onChange={(e) => setNewSubField({ ...newSubField, field_surface: e.target.value })} />
            </div>
            <div className="form-group">
              <label>ความกว้าง (ม.)</label>
              <input type="text" inputMode="numeric" placeholder="กว้าง" value={newSubField.wid_field || ""} onChange={(e) => setNewSubField({ ...newSubField, wid_field: e.target.value.replace(/\D/g, "") })} />
            </div>
            <div className="form-group">
              <label>ความยาว (ม.)</label>
              <input type="text" inputMode="numeric" placeholder="ยาว" value={newSubField.length_field || ""} onChange={(e) => setNewSubField({ ...newSubField, length_field: e.target.value.replace(/\D/g, "") })} />
            </div>
            <div className="form-group form-group-full">
              <label>ประเภทกีฬา</label>
              <select value={newSportId || ""} onChange={(e) => setNewSportId(e.target.value)} className="sport-select-editfield">
                <option value="">เลือกประเภทกีฬา</option>
                {sportsCategories.map((category) => (
                  <option key={category.sport_id} value={String(category.sport_id)}>{category.sport_name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </FieldModal>

      <FieldModal
        isOpen={isEditMode && editingField && typeof editingField === 'number'}
        onClose={cancelEditing}
        title="แก้ไขข้อมูลสนามย่อย"
        onSave={() => saveSubField(editingField)}
        startProcessLoad={startProcessLoad}
      >
        <div className="sub-field-edit-form">
          <div className="form-grid">
            <div className="form-group form-group-full">
              <label>ชื่อสนามย่อย</label>
              <input type="text" value={updatedSubFieldName || ""} onChange={(e) => setUpdatedSubFieldName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>ราคา</label>
              <input type="text" value={updatedPrice || ""} onChange={(e) => setUpdatedPrice(e.target.value.replace(/\D/g, ""))} />
            </div>
            <div className="form-group">
              <label>ผู้เล่น</label>
              <input type="text" value={updatedSubFieldPlayer || ""} onChange={(e) => setUpdatedSubFieldPlayer(e.target.value.replace(/\D/g, ""))} />
            </div>
            <div className="form-group">
              <label>พื้นสนาม</label>
              <input type="text" value={updatedSubFieldFieldSurface || ""} onChange={(e) => setUpdatedSubFieldFieldSurface(e.target.value)} />
            </div>
            <div className="form-group">
              <label>กว้าง</label>
              <input type="text" value={updatedSubFieldWid || ""} onChange={(e) => setUpdatedSubFieldWid(e.target.value.replace(/\D/g, ""))} />
            </div>
            <div className="form-group">
              <label>ยาว</label>
              <input type="text" value={updatedSubFieldLength || ""} onChange={(e) => setUpdatedSubFieldLength(e.target.value.replace(/\D/g, ""))} />
            </div>
            <div className="form-group form-group-full">
              <label>ประเภทกีฬา</label>
              <select value={updatedSportId || ""} onChange={(e) => setUpdatedSportId(e.target.value)}>
                {sportsCategories.map((category) => (
                  <option key={category.sport_id} value={String(category.sport_id)}>{category.sport_name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </FieldModal>

      {isEditMode && editingAddon?.addOnId && (
        <FieldModal isOpen={true} onClose={() => setEditingAddon({ addOnId: null, content: "", price: "" })} title="แก้ไขกิจกรรมพิเศษ" onSave={saveAddon} startProcessLoad={startProcessLoad} maxWidth="400px">
          <div className="addon-edit-form">
            <div className="form-group form-group-full">
              <label>ชื่อกิจกรรม</label>
              <input type="text" placeholder="ชื่อกิจกรรม" value={editingAddon.content || ""} onChange={(e) => setEditingAddon({ ...editingAddon, content: e.target.value })} />
            </div>
            <div className="form-group form-group-full" style={{ marginTop: '12px' }}>
              <label>ราคา (บาท)</label>
              <input type="text" placeholder="ราคา" value={editingAddon.price || ""} onChange={(e) => setEditingAddon({ ...editingAddon, price: e.target.value.replace(/\D/g, "") })} />
            </div>
          </div>
        </FieldModal>
      )}

      {isEditMode && Object.keys(showAddOnFormSafe).some(key => showAddOnFormSafe[key]) && (
        <>
          {Object.keys(showAddOnFormSafe).filter(key => showAddOnFormSafe[key]).map(subFieldId => (
            <FieldModal key={subFieldId} isOpen={true} onClose={() => setShowAddOnForm(prev => ({ ...prev, [subFieldId]: false }))} title="เพิ่มกิจกรรมพิเศษ" onSave={async () => {
              const content = addOnInputs[subFieldId]?.content;
              const price = addOnInputs[subFieldId]?.price;
              if (!content || !price) { notify("กรุณากรอกชื่อและราคาของกิจกรรมพิเศษ", "error"); return; }
              await addAddOn(subFieldId, content, price);
              setAddOnInputs(prev => ({ ...prev, [subFieldId]: { content: "", price: "" } }));
              setShowAddOnForm(prev => ({ ...prev, [subFieldId]: false }));
            }} startProcessLoad={startProcessLoad} maxWidth="400px">
              <div className="add-addon-form">
                <div className="form-group form-group-full">
                  <label>ชื่อกิจกรรมพิเศษ</label>
                  <input type="text" placeholder="ระบุชื่อกิจกรรม" value={addOnInputs[subFieldId]?.content || ""} onChange={(e) => handleAddOnInputChange(subFieldId, "content", e.target.value)} />
                </div>
                <div className="form-group form-group-full" style={{ marginTop: '12px' }}>
                  <label>ราคา (บาท)</label>
                  <input type="text" placeholder="0" value={addOnInputs[subFieldId]?.price || ""} onChange={(e) => handleAddOnInputChange(subFieldId, "price", e.target.value.replace(/\D/g, "")) } />
                </div>
              </div>
            </FieldModal>
          ))}
        </>
      )}
    </div>
  );
};

export default ManageSubFields;
