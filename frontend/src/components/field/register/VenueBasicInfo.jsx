import React from "react";
import LongdoMapPicker from "@/components/shared/LongdoMapPicker";

export default function VenueBasicInfo({ fieldData, handleFieldChange, setFieldData, notify }) {
  return (
    <>
      <div className="input-group-register-field">
        <div className="icon-label-container">
          <label>ชื่อสนามกีฬา:</label>
          <img
            width={20}
            height={20}
            src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757239976/material-symbols--stadium-rounded_qz7gby.png"
            alt=""
            style={{ verticalAlign: "middle" }}
          />
        </div>
        <input
          type="text"
          maxLength={100}
          name="field_name"
          placeholder="ชื่อสนามของคุณ"
          value={fieldData.field_name}
          onChange={handleFieldChange}
        />
      </div>
      <div className="input-group-register-field">
        <div className="icon-label-container">
          <label>ที่ตั้งสนาม:</label>
          <img
            width={20}
            height={20}
            src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757240000/mynaui--pin-solid_q6964o.png"
            alt=""
            style={{ verticalAlign: "middle" }}
          />
        </div>
        <input
          type="text"
          maxLength={100}
          name="address"
          placeholder="ที่อยู่สนามของคุณ"
          value={fieldData.address}
          onChange={handleFieldChange}
        />
      </div>
      <div className="map-gps-container-register-field">
        <div className="input-group-register-field">
          <div className="icon-label-container">
            <label>พิกัด GPS:</label>{" "}
            <img
              width={20}
              height={20}
              src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1756972382/bxs--map_c0lmby.png"
              alt=""
              style={{ verticalAlign: "middle" }}
            />
          </div>
          <input
            type="text"
            maxLength={100}
            name="gps_location"
            placeholder="พิกัด"
            value={fieldData.gps_location}
            onChange={handleFieldChange}
          />
          <div style={{ marginTop: 20 }}>
            <LongdoMapPicker
              onLocationSelect={(location) => {
                setFieldData({ ...fieldData, gps_location: location });
              }}
              initialLocation={fieldData.gps_location}
            />
          </div>
          {fieldData.gps_location && (
            <div className="gps-selected-chip">
              <img
                width={16}
                height={16}
                src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1756972382/bxs--map_c0lmby.png"
                alt=""
              />
              พิกัดที่เลือก: {fieldData.gps_location}
            </div>
          )}
        </div>
      </div>
      <div className="datetimecon">
        <div className="openn-duration">
          <div className="time">
            <div className="input-group-register-field">
              <label>เวลาเปิด:</label>
              <input
                type="time"
                name="open_hours"
                value={fieldData.open_hours}
                onChange={handleFieldChange}
              />
            </div>
            <div className="input-group-register-field">
              <label>เวลาปิด:</label>
              <input
                type="time"
                name="close_hours"
                value={fieldData.close_hours}
                onChange={handleFieldChange}
              />
            </div>
          </div>
          <div className="duration-time-container" style={{ marginTop: "16px" }}>
            <div className="input-group-register-field">
              <div className="icon-label-days-container" style={{ marginBottom: "8px" }}>
                <label>แบ่งช่วงเวลาในการจอง:</label>
                <img
                  width={20}
                  height={20}
                  src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAQAElEQVR4AeydC5rkxBGE276IzUlYTgKcBDgJ5iTYJ8E+CdY/TPWqn5JKFVmv4JtcVUv1yIzMjMpSzy5/v/g/I2AEpkXABDCt6224EbhcTACOAiMwMQImgImdb9PnRgDrTQCgYDECkyJgApjU8TbbCICACQAULEZgUgRMAJM63mbPjUCy3gSQkPDVCEyIgAlgQqfbZCOQEDABJCR8NQITImACmNDpNnluBNbWmwDWaLhtBCZDwAQwmcNtrhFYI2ACWKPhthGYDAETwGQOt7lzI3BvvQngHhF/NgITIWACmMjZNtUI3CNgArhHxJ+NwEQImAAmcrZNnRuBZ9abAJ6h4ntGYBIETABjOvqfi1nIl+WK/LBckZ+Xa5Jfl/a98Ix+SRibhPmWIf4ZCQETQL/eJCFJTpIW+X0x5Y9F/lyEK8I9JCX6T8uzJCnJ11eepb5cGZuE+dLc3OM5Y9EBXZap/dMbAiaAPjxGgpHkJB3Jt05EkhaJSkR0YS2SP+kDOSThHs/o0we6E2j5ykQTwCtk6t4nyUj4dbKT5C0nFjoj6AgJoDukwBVbTAh1Y+rp6iaAp7CE3yRxSBKSJe3uJHzvSYNd2IAt2AYhQA6QBPfDgfaCtwiYAG7xiPxEcpD0IyX8Fn7YTPJDAmtCMBlsISd6bgIQAftiWhKApGcnRNgZX3Sd4jZ4QAiJDMCGe1MYH2Xku3VMAO/QKfOMgCawU5CT9NwrM/s4s4AJ2IATAjGMY12jlpgAdI4hoEn8tNO7zN2HNbiBFccEsOPK532j3esQAiaAQ3Dt6kywErgIO9quQe70FAHIgEqAigA8aT/t6Jt5CJgA8nB7NiolPsFK4D7r43v5CIAp1YCJ4ACGW11NAFsIbT9PZb4TfxurEj3WRAD2Jeacdg4TQL7rCT52I8p8gjJ/Jo/MQQDMwR4f4IucOaYfYwI4HgKU+nx3T/ARhMdn8IiSCOADfGEiyEDVBLAfNAKNMh/ZP8o9oxDAP4kIaEet2+w6exQzAexB6XKhxGSH+XLxf60jQPJD0visdV2r62cCeO8CEp7EZ2d539NPW0IAEsBn+M5E8MYzJoDn4BBA7CII7ee9fLd1BPAdRGA/vvCUCeARGHYMdg52/8envtMjAvgSEsC3Pep/WOe9A0wAX5FityBI2DG+3nVrFATwL76F3GmPYtcpO0wAf8HHDkFgcP3rjv8cFQGSH6L3rxUvHjYBXC6UhQTEZfD//rvYl+TfS/uZpOfL46F/IAGqAXw/tKFbHA=="
                  alt=""
                  style={{ verticalAlign: "middle" }}
                />
              </div>
              <select
                name="slot_duration"
                className="select-slot-duration"
                value={fieldData.slot_duration}
                onChange={handleFieldChange}
              >
                <option value="">กรุณาเลือกช่วงเวลา</option>
                <option value="30">30 นาที</option>
                <option value="60">1 ชั่วโมง</option>
              </select>
            </div>
          </div>
        </div>

        <div className="open-days-container" >
          <div className="input-group-register-field">
            <div className="icon-label-days-container" style={{ marginBottom: "8px" }}>
              <label style={{ textAlign: "center" }}>
                เลือกวันเปิดบริการ:
              </label>
              <img
                style={{ verticalAlign: "middle" }}
                src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757240847/solar--calendar-bold_eiv9sp.png"
                width={20}
                height={20}
                alt=""
              />
            </div>
          </div>
          <div className="time-selection">
            <div className="input-group-checkbox-register-field">
              {[
                { key: "Mon", label: "จันทร์" },
                { key: "Tue", label: "อังคาร" },
                { key: "Wed", label: "พุธ" },
                { key: "Thu", label: "พฤหัสบดี" },
                { key: "Fri", label: "ศุกร์" },
                { key: "Sat", label: "เสาร์" },
                { key: "Sun", label: "อาทิตย์" },
              ].map((day, index) => (
                <label key={index} className="checkbox-label">
                  <input
                    type="checkbox"
                    name="open_days"
                    value={day.key}
                    checked={fieldData.open_days.includes(day.key)}
                    onChange={(e) => {
                      const { value, checked } = e.target;
                      setFieldData((prevData) => {
                        const openDays = new Set(prevData.open_days);
                        if (checked) {
                          openDays.add(value);
                        } else {
                          openDays.delete(value);
                        }
                        return {
                          ...prevData,
                          open_days: Array.from(openDays),
                        };
                      });
                    }}
                  />
                  {day.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="input-group-register-field" style={{ marginTop: "24px" }}>
        <div className="icon-label-container" style={{ marginBottom: "8px" }}>
          <label>ยกเลิกการจองได้ภายใน (ชั่วโมง): </label>
          <img
            style={{ verticalAlign: "middle" }}
            src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757241407/pajamas--time-out_j4mrua.png"
            width={20}
            height={20}
            alt=""
          />
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={3}
          name="cancel_hours"
          placeholder="กรอกจำนวนชั่วโมง เช่น 2 = ยกเลิกได้ก่อน 2 ชม. หรือ 0 = สามารถยกเลิกได้ตลอดเวลา"
          value={fieldData.cancel_hours}
          onChange={(e) => {
            let value = e.target.value.replace(/\D/g, "");
            if (value > 99) {
              notify("ใส่ไม่เกินไม่เกิน 99 ชั่วโมง ", "error");
              return;
            }
            setFieldData({
              ...fieldData,
              cancel_hours: isNaN(value) ? "" : value,
            });
          }}
        />
      </div>
    </>
  );
}
