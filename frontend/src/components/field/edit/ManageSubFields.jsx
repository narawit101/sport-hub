"use client";
import React from "react";

const ManageSubFields = ({
  field,
  subFields,
  sportsCategories,
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
  newSubField,
  setNewSubField,
  newSportId,
  setNewSportId,
  addSubField,
  userId,
  showAddOnForm,
  setShowAddOnForm,
  addOnInputs,
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
}) => {
  return (
    <div className="sub-fields-container-editfield">
      <div className="add-sub-field-container">
        <div className="input-group-editfield-addsubfield">
          {!showAddSubFieldForm ? (
            <button
              className="editbtn-editfield"
              onClick={() => setShowAddSubFieldForm(true)}
            >
              เพิ่มสนามย่อย
            </button>
          ) : (
            <div className="add-subfield-form-editfield">
              <div className="subfield-form-editfield">
                <input
                  type="text"
                  maxLength={20}
                  placeholder="ชื่อสนามย่อย"
                  value={newSubField.sub_field_name}
                  onChange={(e) =>
                    setNewSubField({
                      ...newSubField,
                      sub_field_name: e.target.value,
                    })
                  }
                />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={7}
                  placeholder="ราคา"
                  value={newSubField.price ?? ""}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, "");

                    if (value > 999999) {
                      notify("ใส่ได้ไม่เกิน 6 หลัก", "error");
                      return;
                    }

                    setNewSubField({
                      ...newSubField,
                      price: Math.abs(Number(value)),
                    });
                  }}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={2}
                  placeholder="ผู้เล่น"
                  value={newSubField.players_per_team || ""}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, "");

                    if (value > 11) {
                      notify("ใส่ได้ไม่เกิน 11 คน", "error");
                      return;
                    }
                    setNewSubField({
                      ...newSubField,
                      players_per_team: Math.abs(e.target.value),
                    });
                  }}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="กว้าง"
                  value={newSubField.wid_field || ""}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, "");

                    if (value > 1000) {
                      notify("ใส่ได้ไม่เกิน 1000 เมตร", "error");
                      return;
                    }
                    setNewSubField({
                      ...newSubField,
                      wid_field: Math.abs(e.target.value),
                    });
                  }}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="ยาว"
                  value={newSubField.length_field || ""}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, "");

                    if (value > 1000) {
                      notify("ใส่ได้ไม่เกิน 1000 เมตร", "error");
                      return;
                    }
                    setNewSubField({
                      ...newSubField,
                      length_field: Math.abs(e.target.value),
                    });
                  }}
                />
                <input
                  type="text"
                  maxLength={20}
                  placeholder="ประเภทของพื้นสนาม"
                  value={newSubField.field_surface}
                  onChange={(e) =>
                    setNewSubField({
                      ...newSubField,
                      field_surface: e.target.value,
                    })
                  }
                />
                <select
                  value={newSportId}
                  onChange={(e) => setNewSportId(e.target.value)}
                  className="sport-select-editfield"
                >
                  <option value="">เลือกประเภทกีฬา</option>
                  {sportsCategories.map((category) => (
                    <option
                      key={category.sport_id}
                      value={String(category.sport_id)}
                    >
                      {category.sport_name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                style={{
                  cursor: startProcessLoad ? "not-allowed" : "pointer",
                }}
                disabled={startProcessLoad}
                className="savebtn-editfield"
                onClick={async () => {
                  if (!userId) {
                    notify("ยังไม่ได้โหลด user_id ", "error");
                    return;
                  }
                  await addSubField(userId);
                  setNewSubField({
                    sub_field_name: "",
                    price: "",
                    sport_id: "",
                    players_per_team: "",
                    wid_field: "",
                    length_field: "",
                    field_surface: "",
                  });
                  setShowAddSubFieldForm(false);
                }}
              >
                {startProcessLoad ? (
                  <span className="dot-loading">
                    <span className="dot one">●</span>
                    <span className="dot two">●</span>
                    <span className="dot three">●</span>
                  </span>
                ) : (
                  "บันทึกสนามย่อย"
                )}
              </button>

              <button
                className="canbtn-editfield"
                style={{
                  cursor: startProcessLoad ? "not-allowed" : "pointer",
                }}
                disabled={startProcessLoad}
                onClick={() => setShowAddSubFieldForm(false)}
              >
                ยกเลิก
              </button>
            </div>
          )}
        </div>
      </div>
      {subFields.map((sub, index) => (
        <div key={sub.sub_field_id} className="sub-field-card-editfield">
          <div className="sub-field-header">
            <h3>สนามย่อย {sub.sub_field_name}</h3>
            <span className="sub-field-sport">{sub.sport_name}</span>
          </div>

          {editingField === sub.sub_field_id ? (
            <div className="sub-field-edit-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>ชื่อสนามย่อย</label>
                  <input
                    maxLength={20}
                    type="text"
                    value={updatedSubFieldName}
                    onChange={(e) => setUpdatedSubFieldName(e.target.value)}
                    placeholder="ชื่อสนามย่อย"
                  />
                </div>

                <div className="form-group">
                  <label>ราคา (บาท)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={7}
                    value={updatedPrice || ""}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, "");
                      if (value.length > 6) {
                        notify("ใส่ได้ไม่เกิน 6 หลัก", "error");
                        return;
                      }
                      setUpdatedPrice(Math.abs(e.target.value));
                    }}
                    placeholder="ราคา"
                  />
                </div>

                <div className="form-group">
                  <label>ผู้เล่นต่อทีม</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    value={updatedSubFieldPlayer || ""}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, "");
                      if (value >= 100) {
                        notify("ใส่ได้ไม่เกิน 99 คน", "error");
                        return;
                      }
                      setUpdatedSubFieldPlayer(Math.abs(e.target.value));
                    }}
                    placeholder="จำนวนผู้เล่น"
                  />
                </div>

                <div className="form-group">
                  <label>ความกว้าง (เมตร)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={updatedSubFieldWid || ""}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, "");
                      if (value > 1000) {
                        notify("ใส่ได้ไม่เกิน 1000 เมตร", "error");
                        return;
                      }
                      setUpdatedSubFieldWid(Math.abs(e.target.value));
                    }}
                    placeholder="ความกว้าง"
                  />
                </div>

                <div className="form-group">
                  <label>ความยาว (เมตร)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={updatedSubFieldLength || ""}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, "");
                      if (value > 1000) {
                        notify("ใส่ได้ไม่เกิน 1000 เมตร", "error");
                        return;
                      }
                      setUpdatedSubFieldLength(Math.abs(e.target.value));
                    }}
                    placeholder="ความยาว"
                  />
                </div>

                <div className="form-group">
                  <label>ประเภทพื้นสนาม</label>
                  <input
                    maxLength={20}
                    type="text"
                    value={updatedSubFieldFieldSurface}
                    onChange={(e) =>
                      setUpdatedSubFieldFieldSurface(e.target.value)
                    }
                    placeholder="เช่น หญ้าเทียม, คอนกรีต"
                  />
                </div>

                <div className="form-group form-group-full">
                  <label>ประเภทกีฬา</label>
                  <select
                    value={updatedSportId}
                    onChange={(e) => setUpdatedSportId(e.target.value)}
                    className="sport-select-editfield"
                  >
                    <option value="">เลือกประเภทกีฬา</option>
                    {sportsCategories.map((category) => (
                      <option
                        key={category.sport_id}
                        value={String(category.sport_id)}
                      >
                        {category.sport_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-actions-editfield">
                <button
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  className="save-btn"
                  onClick={() => saveSubField(sub.sub_field_id)}
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
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  className="cancel-btn"
                  onClick={() => cancelEditing()}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          ) : (
            <div className="sub-field-display">
              <div className="field-info-grid">
                <div className="info-item">
                  <span className="info-label">ราคา:</span>
                  <span className="info-value">
                    {formatPrice(sub.price)} บาท
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">ผู้เล่นต่อทีม:</span>
                  <span className="info-value">
                    {sub?.players_per_team} คน
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">ขนาดสนาม:</span>
                  <span className="info-value">
                    {formatPrice(sub?.wid_field)} ×{" "}
                    {formatPrice(sub?.length_field)} เมตร
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">ประเภทพื้น:</span>
                  <span className="info-value">{sub?.field_surface}</span>
                </div>
              </div>

              <div className="sub-field-actions">
                <button
                  className="edit-btn-inline"
                  onClick={() => startEditingSubField(sub)}
                >
                  แก้ไข
                </button>
                <button
                  className="delete-facility-btn-simple"
                  onClick={() => handleDeleteClick(sub)}
                >
                  ลบสนามย่อย
                </button>
              </div>
            </div>
          )}

          <div className="addons-section">
            <div className="addons-header">
              <h4>กิจกรรมพิเศษ</h4>
              <button
                style={{
                  cursor: startProcessLoad ? "not-allowed" : "pointer",
                }}
                disabled={startProcessLoad}
                className="toggle-addon-btn"
                onClick={() =>
                  setShowAddOnForm((prev) => ({
                    ...prev,
                    [sub.sub_field_id]: !prev[sub.sub_field_id],
                  }))
                }
              >
                {showAddOnForm[sub.sub_field_id]
                  ? "ยกเลิก"
                  : "เพิ่มกิจกรรม"}
              </button>
            </div>

            {sub.add_ons && sub.add_ons.length > 0 ? (
              <div className="addons-list">
                {sub.add_ons.map((addon) => (
                  <div
                    key={`${sub.sub_field_id}-${addon.add_on_id}`}
                    className="addon-item"
                  >
                    {editingAddon.addOnId === addon.add_on_id ? (
                      <div className="addon-edit-form">
                        <input
                          maxLength={50}
                          type="text"
                          value={editingAddon.content}
                          onChange={(e) =>
                            setEditingAddon({
                              ...editingAddon,
                              content: e.target.value,
                            })
                          }
                          placeholder="ชื่อกิจกรรม"
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={7}
                          value={editingAddon.price}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, "");
                            if (value.length > 6) {
                              notify("ใส่ได้ไม่เกิน 6 หลัก", "error");
                              return;
                            }
                            setEditingAddon({
                              ...editingAddon,
                              price: Math.abs(e.target.value),
                            });
                          }}
                          placeholder="ราคา"
                        />
                        <div className="addon-actions">
                          <button
                            style={{
                              cursor: startProcessLoad
                                ? "not-allowed"
                                : "pointer",
                            }}
                            disabled={startProcessLoad}
                            className="save-btn"
                            onClick={saveAddon}
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
                            style={{
                              cursor: startProcessLoad
                                ? "not-allowed"
                                : "pointer",
                            }}
                            disabled={startProcessLoad}
                            className="cancel-btn"
                            onClick={() =>
                              setEditingAddon({
                                addOnId: null,
                                content: "",
                                price: "",
                              })
                            }
                          >
                            ยกเลิก
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="addon-display">
                        <div className="addon-info">
                          <span className="addon-name">
                            {addon.content}
                          </span>
                          <span className="addon-price">
                            {formatPrice(addon.price)} บาท
                          </span>
                        </div>
                        <div className="addon-actions">
                          <button
                            className="edit-btn-inline"
                            onClick={() => startEditingAddon(addon)}
                          >
                            แก้ไข
                          </button>
                          <button
                            style={{
                              cursor: startProcessLoad
                                ? "not-allowed"
                                : "pointer",
                            }}
                            disabled={startProcessLoad}
                            className="delete-facility-btn-simple"
                            onClick={() => {
                              setSelectedAddOn(addon);
                              setShowDeleteAddOnModal(true);
                            }}
                          >
                            ลบ
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-addons">
                <span>ไม่มีกิจกรรมพิเศษ</span>
              </div>
            )}

            {showAddOnForm[sub.sub_field_id] && (
              <div className="add-addon-form">
                <input
                  type="text"
                  maxLength={50}
                  placeholder="ชื่อกิจกรรมพิเศษ"
                  value={addOnInputs[sub.sub_field_id]?.content || ""}
                  onChange={(e) =>
                    handleAddOnInputChange(
                      sub.sub_field_id,
                      "content",
                      e.target.value
                    )
                  }
                />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={7}
                  placeholder="ราคา"
                  value={addOnInputs[sub.sub_field_id]?.price || ""}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, "");
                    if (value.length >= 6) {
                      notify("ใส่ได้ไม่เกิน 6 หลัก", "error");
                      return;
                    }
                    handleAddOnInputChange(
                      sub.sub_field_id,
                      "price",
                      Math.abs(e.target.value)
                    );
                  }}
                />
                <button
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  className="save-btn"
                  onClick={async () => {
                    const content = addOnInputs[sub.sub_field_id]?.content;
                    const price = addOnInputs[sub.sub_field_id]?.price;
                    if (!content || !price) {
                      notify("กรุณากรอกชื่อและราคาของกิจกรรมพิเศษ", "error");
                      return;
                    }
                    await addAddOn(sub.sub_field_id, content, price);
                    setAddOnInputs((prev) => ({
                      ...prev,
                      [sub.sub_field_id]: { content: "", price: "" },
                    }));
                    setShowAddOnForm((prev) => ({
                      ...prev,
                      [sub.sub_field_id]: false,
                    }));
                  }}
                >
                  {startProcessLoad ? (
                    <span className="dot-loading">
                      <span className="dot one">●</span>
                      <span className="dot two">●</span>
                      <span className="dot three">●</span>
                    </span>
                  ) : (
                    "บันทึกกิจกรรม"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ManageSubFields;
