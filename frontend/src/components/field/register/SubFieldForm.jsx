import React from "react";

export default function SubFieldForm({
  subFields,
  sports,
  updateSubField,
  addSubField,
  removeSubField,
  addAddOn,
  updateAddOn,
  removeAddOn,
  notify,
}) {
  return (
    <>
      <div className="input-group-register-field">
        <div className="icon-label-container">
          <label>สนามย่อย: </label>
          <img
            width={25}
            height={25}
            style={{ verticalAlign: "middle" }}
            src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757259877/mingcute--playground-fill_v8ekao.png"
            alt=""
          />
        </div>
      </div>
      <div className="subfieldcon">
        {subFields.map((sub, subIndex) => (
          <div key={subIndex}>
            <div className="input-group-register-field">
              <div className="icon-label-container">
                <label htmlFor="">ชื่อสนามย่อย:</label>
                <img
                  src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757254986/fluent--form-24-filled_bngilf.png"
                  width={20}
                  height={20}
                  style={{ verticalAlign: "middle" }}
                  alt=""
                />
              </div>
              <input
                type="text"
                maxLength={20}
                placeholder="สนาม 1,2"
                value={sub.name}
                onChange={(e) =>
                  updateSubField(subIndex, "name", e.target.value)
                }
              />
            </div>
            <div className="input-group-register-field">
              <div className="icon-label-container">
                <label>ราคา/ชั่วโมง: </label>
                <img
                  width={20}
                  height={20}
                  style={{ verticalAlign: "middle" }}
                  src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757254913/icomoon-free--price-tag_khbaj4.png"
                  alt=""
                />
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={7}
                placeholder="500 , 1000"
                value={sub.price ?? ""}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, "");
                  if (value.length > 6) {
                    notify("ราคาต้องไม่เกิน 6 หลัก ", "error");
                    return;
                  }
                  updateSubField(subIndex, "price", value);
                }}
              />
            </div>

            <div className="input-group-register-field">
              <div className="icon-label-container">
                <label htmlFor="">ประเภทกีฬา:</label>
                <img
                  width={20}
                  height={20}
                  style={{ verticalAlign: "middle" }}
                  src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757259220/fluent--sport-16-filled_gmsj8t.png"
                  alt=""
                />
              </div>

              <div className="select-sport-register-field">
                <select
                  value={sub.sport_id}
                  onChange={(e) => {
                    const sportId = e.target.value;
                    updateSubField(subIndex, "sport_id", sportId);
                    updateSubField(subIndex, "players_per_team", "");
                  }}
                >
                  <option value="">เลือกประเภทกีฬา</option>
                  {sports.map((sport) => (
                    <option key={sport.sport_id} value={sport.sport_id}>
                      {sport.sport_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="input-group-register-field">
              <div className="icon-label-container">
                <label htmlFor="">จำนวนผู้เล่นต่อฝั่ง:</label>
                <img
                  width={20}
                  height={20}
                  style={{ verticalAlign: "middle" }}
                  src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757259443/rivet-icons--user-group-solid_ijtvb3.png"
                  alt=""
                />
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={3}
                placeholder="(คน)"
                value={sub.players_per_team ?? ""}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, "");
                  const selectedSport = sports.find(
                    (sport) => sport.sport_id == sub.sport_id
                  );
                  const sportName = selectedSport
                    ? selectedSport.sport_name
                    : "";
                  if (sportName === "ฟุตบอล" && value > 11) {
                    notify("ฟุตบอลใส่ได้ไม่เกิน 11 คน", "error");
                    return;
                  }
                  if (sportName === "ฟุตซอล" && value > 5) {
                    notify("ฟุตซอลใส่ได้ไม่เกิน 5 คน", "error");
                    return;
                  }
                  if (sportName === "บาสเก็ตบอล" && value > 5) {
                    notify("บาสเก็ตบอลใส่ได้ไม่เกิน 5 คน", "error");
                    return;
                  }

                  updateSubField(subIndex, "players_per_team", value);
                }}
              />{" "}
            </div>
            <div className="input-group-register-field">
              <div className="icon-label-container">
                <label>ความกว้างของสนาม:</label>
                <img
                  width={20}
                  height={20}
                  style={{ verticalAlign: "middle" }}
                  src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757259593/streamline-plump--fit-to-width-square-solid_xro2je.png"
                  alt=""
                />
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="(เมตร)"
                value={sub.wid_field || ""}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, "");
                  if (value > 1000) {
                    notify("ใส่ได้ไม่เกิน 1000 เมตร", "error");
                    return;
                  }
                  updateSubField(subIndex, "wid_field", value);
                }}
              />
            </div>
            <div className="input-group-register-field">
              <div className="icon-label-container">
                <label>ความยาวของสนาม:</label>
                <img
                  width={20}
                  height={20}
                  style={{ verticalAlign: "middle" }}
                  src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757259596/streamline-plump--fit-height-solid_hy5hmo.png"
                  alt=""
                />
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="(เมตร)"
                value={sub.length_field || ""}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, "");
                  if (value > 1000) {
                    notify("ใส่ได้ไม่เกิน 1000 เมตร", "error");
                    return;
                  }
                  updateSubField(subIndex, "length_field", value);
                }}
              />
            </div>
            <div className="input-group-register-field">
              <div className="icon-label-container">
                <div className="icon-label-container">
                  <label>พื้นสนาม</label>
                  <img
                    width={20}
                    height={20}
                    style={{ verticalAlign: "middle" }}
                    src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757260059/hugeicons--background_qpzudp.png"
                    alt=""
                  />
                </div>
              </div>
              <input
                maxLength={20}
                type="text"
                placeholder="เช่น หญ้าเทียม,หญ้าจริง "
                value={sub.field_surface}
                onChange={(e) =>
                  updateSubField(subIndex, "field_surface", e.target.value)
                }
              />
            </div>

            <button
              className="addbtn-regisfield"
              type="button"
              onClick={() => addAddOn(subIndex)}
            >
              เพิ่มกิจกรรมเพิ่มเติม
            </button>

            <button
              className="delbtn-regisfield"
              type="button"
              onClick={() => removeSubField(subIndex)}
            >
              ลบสนามย่อย
            </button>

            <div className="addoncon">
              {sub.addOns.map((addon, addOnIndex) => (
                <div key={addOnIndex}>
                  <div className="icon-label-container">
                    <label
                      htmlFor=""
                      style={{
                        fontWeight: "bold",
                        color: "#03045e",
                      }}
                    >
                      กิจกรรมพิเศษ:
                    </label>
                    <img
                      width={20}
                      height={20}
                      style={{ verticalAlign: "middle" }}
                      src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757260382/zondicons--add-solid_hmeqxs.png"
                      alt=""
                    />
                  </div>
                  <div className="input-group-register-field">
                    <input
                      type="text"
                      maxLength={100}
                      placeholder="ชื่อกิจกรรม เช่น (เช่าสนามเพื่อทำคอนเท้น)"
                      value={addon.content}
                      onChange={(e) =>
                        updateAddOn(
                          subIndex,
                          addOnIndex,
                          "content",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="input-group-register-field">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={7}
                      placeholder="ราคา/ชั่วโมง"
                      value={addon.price || ""}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, "");
                        if (value > 999999) {
                          notify("ใส่ได้ไม่เกิน 6 หลัก ", "error");
                          return;
                        }
                        updateAddOn(subIndex, addOnIndex, "price", value);
                      }}
                    />
                  </div>

                  <button
                    className="delevn"
                    type="button"
                    onClick={() => removeAddOn(subIndex, addOnIndex)}
                  >
                    ลบกิจกรรมเพิ่มเติม
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          className="addsubfield-regisfield"
          type="button"
          onClick={addSubField}
        >
          + เพิ่มสนามย่อย
        </button>
      </div>
    </>
  );
}
