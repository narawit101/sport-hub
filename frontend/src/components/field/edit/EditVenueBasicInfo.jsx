"use client";
import React from "react";

const EditVenueBasicInfo = ({
  field,
  editingField,
  updatedValue,
  setUpdatedValue,
  saveField,
  cancelEditing,
  startEditing,
  startProcessLoad,
  selectedDays,
  handleDayToggle,
  daysInThai,
  dayCodes,
  router,
  getGoogleMapsLink,
  notify,
}) => {
  return (
    <div className="check-field-info">
      <div className="field-row-checkfield">
        <div className="field-details-checkfield">
          <strong>วันที่เปิดสนาม:</strong>
          <div className="field-value-checkfield">
            {editingField === "open_days" ? (
              <div className="edit-field-inline">
                <div className="days-checkbox-container">
                  {dayCodes.map((code) => (
                    <label key={code} className="day-checkbox">
                      <input
                        type="checkbox"
                        value={code}
                        checked={selectedDays.includes(code)}
                        disabled={startProcessLoad}
                        onChange={() => handleDayToggle(code)}
                      />
                      {daysInThai[code]}
                    </label>
                  ))}
                </div>
                <div className="inline-buttons">
                  <button
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    className="savebtn-inline"
                    onClick={() => saveField("open_days")}
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
                    className="canbtn-inline"
                    onClick={cancelEditing}
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            ) : (
              <div className="view-field-inline">
                <div
                  className="field-value-checkfield"
                  style={{ marginBottom: "4px" }}
                >
                  {field?.open_days && field.open_days.length > 0
                    ? field.open_days.length === 7
                      ? "เปิดทุกวัน"
                      : field.open_days
                          .slice()
                          .sort(
                            (a, b) =>
                              [
                                "Mon",
                                "Tue",
                                "Wed",
                                "Thu",
                                "Fri",
                                "Sat",
                                "Sun",
                              ].indexOf(a) -
                              [
                                "Mon",
                                "Tue",
                                "Wed",
                                "Thu",
                                "Fri",
                                "Sat",
                                "Sun",
                              ].indexOf(b)
                          )
                          .map((d) => daysInThai[d])
                          .join(", ")
                    : "ไม่มีข้อมูล"}
                </div>
                <button
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  className="edit-btn-inline"
                  onClick={() => startEditing("open_days", "")}
                >
                  แก้ไข
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="field-row-checkfield">
        <div className="field-details-checkfield">
          <strong>
            แบ่งช่วงเวลาในการจอง ช่วงละ " 30 นาที " หรือ "ช่วงละ 1 ชั่วโมง :
          </strong>
          <div className="field-value-checkfield">
            {editingField === "slot_duration" ? (
              <div className="edit-field-inline">
                <select
                  value={updatedValue}
                  onChange={(e) => setUpdatedValue(e.target.value)}
                  className="inline-select"
                >
                  <option value="30">30 นาที</option>
                  <option value="60">1 ชั่วโมง</option>
                </select>
                <div className="inline-buttons">
                  <button
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    className="savebtn-inline"
                    onClick={() => saveField("slot_duration")}
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
                    className="canbtn-inline"
                    onClick={cancelEditing}
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            ) : (
              <div className="view-field-inline">
                <span>
                  {Number(field?.slot_duration) === 30
                    ? "30 นาที"
                    : Number(field?.slot_duration) === 60
                    ? "1 ชั่วโมง"
                    : "ไม่มีข้อมูล"}
                </span>
                <button
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  className="edit-btn-inline"
                  onClick={() =>
                    startEditing("slot_duration", field?.slot_duration)
                  }
                >
                  แก้ไข
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="field-row-checkfield">
        <div className="field-details-checkfield">
          <strong>ชื่อสนาม:</strong>
          <div className="field-value-checkfield">
            {editingField === "field_name" ? (
              <div className="edit-field-inline">
                <input
                  maxLength={50}
                  type="text"
                  value={updatedValue}
                  onChange={(e) => setUpdatedValue(e.target.value)}
                  className="inline-input"
                />
                <div className="inline-buttons">
                  <button
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    className="savebtn-inline"
                    onClick={() => saveField("field_name")}
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
                    className="canbtn-inline"
                    onClick={cancelEditing}
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            ) : (
              <div className="view-field-inline">
                <span>{field?.field_name || "ไม่มีข้อมูล"}</span>
                <button
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  className="edit-btn-inline"
                  onClick={() => startEditing("field_name", field?.field_name)}
                >
                  แก้ไข
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="field-row-checkfield">
        <div className="field-details-checkfield">
          <strong>เวลาเปิด:</strong>
          <div className="field-value-checkfield">
            {editingField === "open_hours" ? (
              <div className="edit-field-inline">
                <input
                  type="time"
                  value={updatedValue}
                  onChange={(e) => setUpdatedValue(e.target.value)}
                  className="inline-input"
                />
                <div className="inline-buttons">
                  <button
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    className="savebtn-inline"
                    onClick={() => saveField("open_hours")}
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
                    className="canbtn-inline"
                    onClick={cancelEditing}
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            ) : (
              <div className="view-field-inline">
                <span>{field?.open_hours || "ไม่มีข้อมูล"}</span>
                <button
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  className="edit-btn-inline"
                  onClick={() => startEditing("open_hours", field?.open_hours)}
                >
                  แก้ไข
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="field-row-checkfield">
        <div className="field-details-checkfield">
          <strong>เวลาปิด:</strong>
          <div className="field-value-checkfield">
            {editingField === "close_hours" ? (
              <div className="edit-field-inline">
                <input
                  type="time"
                  value={updatedValue}
                  onChange={(e) => setUpdatedValue(e.target.value)}
                  className="inline-input"
                />
                <div className="inline-buttons">
                  <button
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    className="savebtn-inline"
                    onClick={() => saveField("close_hours")}
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
                    className="canbtn-inline"
                    onClick={cancelEditing}
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            ) : (
              <div className="view-field-inline">
                <span>{field?.close_hours || "ไม่มีข้อมูล"}</span>
                <button
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  className="edit-btn-inline"
                  onClick={() =>
                    startEditing("close_hours", field?.close_hours)
                  }
                >
                  แก้ไข
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="field-row-checkfield">
        <div className="field-details-checkfield">
          <strong>พิกัด GPS:</strong>
          <div className="field-value-checkfield">
            {editingField === "gps_location" ? (
              <div className="edit-field-inline">
                <input
                  maxLength={200}
                  type="text"
                  value={updatedValue}
                  onChange={(e) => setUpdatedValue(e.target.value)}
                  className="inline-input"
                />
                <div className="inline-buttons">
                  <button
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    className="savebtn-inline"
                    onClick={() => saveField("gps_location")}
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
                    className="canbtn-inline"
                    onClick={cancelEditing}
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            ) : (
              <div className="view-field-inline">
                <span>
                  {field?.gps_location ? (
                    <a
                      href={getGoogleMapsLink(field.gps_location)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {field.gps_location}
                    </a>
                  ) : (
                    "ไม่มีข้อมูล"
                  )}
                </span>
                <button
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  className="edit-btn-inline"
                  onClick={() => router.push(`/map/${field.field_id}`)}
                >
                  แก้ไข
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="field-row-checkfield">
        <div className="field-details-checkfield">
          <strong>ที่อยู่:</strong>
          <div className="field-value-checkfield">
            {editingField === "address" ? (
              <div className="edit-field-inline">
                <input
                  maxLength={100}
                  type="text"
                  value={updatedValue}
                  onChange={(e) => setUpdatedValue(e.target.value)}
                  className="inline-input"
                />
                <div className="inline-buttons">
                  <button
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    className="savebtn-inline"
                    onClick={() => saveField("address")}
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
                    className="canbtn-inline"
                    onClick={cancelEditing}
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            ) : (
              <div className="view-field-inline">
                <span>{field?.address || "ไม่มีข้อมูล"}</span>
                <button
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  className="edit-btn-inline"
                  onClick={() => startEditing("address", field?.address)}
                >
                  แก้ไข
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="field-row-checkfield">
        <div className="field-details-checkfield">
          <strong>ยกเลิกก่อนถึงเวลา:</strong>
          <div className="field-value-checkfield">
            {editingField === "cancel_hours" ? (
              <div className="edit-field-inline">
                <input
                  type="text"
                  value={updatedValue}
                  pattern="[0-9]*"
                  maxLength={2}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val > 24) {
                      notify("ใส่ไม่เกินไม่เกิน 24 ชั่วโมง ", "error");
                      return;
                    }
                    if (/^\d{0,2}$/.test(val)) {
                      setUpdatedValue(val);
                    }
                  }}
                  placeholder="ใส่ได้ไม่เกิน 24 ชม."
                  className="inline-input"
                />
                <div className="inline-buttons">
                  <button
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    className="savebtn-inline"
                    onClick={() => saveField("cancel_hours")}
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
                    className="canbtn-inline"
                    onClick={cancelEditing}
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            ) : (
              <div className="view-field-inline">
                <span>{field?.cancel_hours || "0"} ชั่วโมง</span>
                <button
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  className="edit-btn-inline"
                  onClick={() =>
                    startEditing("cancel_hours", field?.cancel_hours)
                  }
                >
                  แก้ไข
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="field-row-checkfield">
        <div className="field-details-checkfield">
          <strong>ค่ามัดจำ:</strong>
          <div className="field-value-checkfield">
            {editingField === "price_deposit" ? (
              <div className="edit-field-inline">
                <input
                  min="0"
                  type="text"
                  maxLength={7}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={updatedValue}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, "");
                    if (value.length > 6) {
                      notify("ใส่ได้ไม่เกิน 6 หลัก", "error");
                      return;
                    }
                    setUpdatedValue(Math.abs(Number(value)));
                  }}
                  className="inline-input"
                />
                <div className="inline-buttons">
                  <button
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    className="savebtn-inline"
                    onClick={() => saveField("price_deposit")}
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
                    className="canbtn-inline"
                    onClick={cancelEditing}
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            ) : (
              <div className="view-field-inline">
                <span>
                  {field?.price_deposit === 0
                    ? "ไม่มีค่ามัดจำ"
                    : `${field?.price_deposit || "ไม่มีข้อมูล"} บาท`}
                </span>
                <button
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  className="edit-btn-inline"
                  onClick={() =>
                    startEditing("price_deposit", field?.price_deposit)
                  }
                >
                  แก้ไข
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="field-row-checkfield">
        <div className="field-details-checkfield">
          <strong>ธนาคาร:</strong>
          <div className="field-value-checkfield">
            {editingField === "name_bank" ? (
              <div className="edit-field-inline">
                <input
                  maxLength={50}
                  type="text"
                  value={updatedValue}
                  onChange={(e) => setUpdatedValue(e.target.value)}
                  className="inline-input"
                />
                <div className="inline-buttons">
                  <button
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    className="savebtn-inline"
                    onClick={() => saveField("name_bank")}
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
                    className="canbtn-inline"
                    onClick={cancelEditing}
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            ) : (
              <div className="view-field-inline">
                <span>{field?.name_bank || "ไม่มีข้อมูล"}</span>
                <button
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  className="edit-btn-inline"
                  onClick={() => startEditing("name_bank", field?.name_bank)}
                >
                  แก้ไข
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="field-row-checkfield">
        <div className="field-details-checkfield">
          <strong>ชื่อเจ้าของบัญชี:</strong>
          <div className="field-value-checkfield">
            {editingField === "account_holder" ? (
              <div className="edit-field-inline">
                <input
                  maxLength={50}
                  type="text"
                  value={updatedValue}
                  onChange={(e) => setUpdatedValue(e.target.value)}
                  className="inline-input"
                />
                <div className="inline-buttons">
                  <button
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    className="savebtn-inline"
                    onClick={() => saveField("account_holder")}
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
                    className="canbtn-inline"
                    onClick={cancelEditing}
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            ) : (
              <div className="view-field-inline">
                <span>{field?.account_holder || "ไม่มีข้อมูล"}</span>
                <button
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  className="edit-btn-inline"
                  onClick={() =>
                    startEditing("account_holder", field?.account_holder)
                  }
                >
                  แก้ไข
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="field-row-checkfield">
        <div className="field-details-checkfield">
          <strong>เลขบัญชี:</strong>
          <div className="field-value-checkfield">
            {editingField === "number_bank" ? (
              <div className="edit-field-inline">
                <input
                  type="text"
                  maxLength={13}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={updatedValue || ""}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, "");
                    setUpdatedValue(val);
                  }}
                  onBlur={() => {
                    const len = updatedValue?.length ?? 0;
                    if (len !== 10 && len !== 13) {
                      notify("ใส่เลขบัญชีต้อง 10 หรือ 13 หลัก", "error");
                      setUpdatedValue("");
                    }
                  }}
                  placeholder="เลขบัญชีต้อง 10 หรือ 13 หลัก"
                  className="inline-input"
                />
                <div className="inline-buttons">
                  <button
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    className="savebtn-inline"
                    onClick={() => saveField("number_bank")}
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
                    className="canbtn-inline"
                    onClick={cancelEditing}
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            ) : (
              <div className="view-field-inline">
                <span>{field?.number_bank || "ไม่มีข้อมูล"}</span>
                <button
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  className="edit-btn-inline"
                  onClick={() =>
                    startEditing("number_bank", field?.number_bank)
                  }
                >
                  แก้ไข
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditVenueBasicInfo;
