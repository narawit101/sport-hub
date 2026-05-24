import React from "react";
import { ACCOUNT_TYPE } from "@/constants/status";

export default function AccountInfo({
  fieldData,
  banks,
  handleAccountTypeChange,
  handleFieldChange,
  setFieldData,
  handleCheckboxChange,
  handlePriceChange,
  loadingBanks,
  notify,
}) {
  return (
    <>
      <div className="input-group-register-field">
        <div className="acc-type">
          <div className="icon-label-container">
            <label htmlFor="account-type">เลือกประเภทบัญชี:</label>
            <img
              width={20}
              height={20}
              style={{ verticalAlign: "middle" }}
              src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757260760/streamline--bank-remix_jjilhx.png"
              alt=""
            />
          </div>
          <select
            name="account_type"
            value={fieldData.account_type}
            onChange={handleAccountTypeChange}
          >
            <option value="">กรุณาเลือกบัญชี</option>
            <option value={ACCOUNT_TYPE.BANK}>ธนาคาร</option>
            <option value={ACCOUNT_TYPE.PROMPTPAY}>พร้อมเพย์</option>
          </select>
        </div>
      </div>

      {fieldData.account_type === ACCOUNT_TYPE.BANK && (
        <div className="input-group-register-field">
          <div className="icon-label-container">
            <label htmlFor="bank">ชื่อธนาคาร</label>
            <img
              width={20}
              height={20}
              style={{ verticalAlign: "middle" }}
              src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757261308/icon-park-solid--bank-card_cbiyno.png"
              alt=""
            />
          </div>
          {loadingBanks ? (
            <div>กำลังโหลดรายชื่อธนาคารจาก Omise</div>
          ) : (
            <select
              name="name_bank"
              value={fieldData.name_bank}
              onChange={handleFieldChange}
            >
              <option value="">เลือกธนาคาร ({banks.length} รายการ)</option>
              {banks.map((bank, index) => (
                <option key={bank.code || index} value={bank.name}>
                  {bank.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {fieldData.account_type === ACCOUNT_TYPE.PROMPTPAY && (
        <div className="input-group-register-field">
          <div className="icon-label-container">
            <label htmlFor="bank">ชื่อธนาคาร</label>
            <img
              width={20}
              height={20}
              style={{ verticalAlign: "middle" }}
              src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757260760/streamline--bank-remix_jjilhx.png"
              alt=""
            />
          </div>
          <input
            type="text"
            maxLength={50}
            name="name_bank"
            value={ACCOUNT_TYPE.PROMPTPAY}
            disabled
          />
        </div>
      )}
      <div className="input-group-register-field">
        <div className="icon-label-container">
          <label htmlFor="number_bank">เลขบัญชีธนาคาร / พร้อมเพย์</label>
          <img
            width={20}
            height={20}
            style={{ verticalAlign: "middle" }}
            src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757261101/f7--number_owq9iu.png"
            alt=""
          />
        </div>

        <input
          type="text"
          maxLength={13}
          inputMode="numeric"
          pattern="[0-9]*"
          name="number_bank"
          placeholder="เลขบัญชีและพร้อมเพย์ 10 หลัก หรือ 13 หลัก หลักเท่านั้น"
          value={fieldData.number_bank || ""}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "");
            const isPromptPay = fieldData.account_type === ACCOUNT_TYPE.PROMPTPAY;

            if (/^\d*$/.test(value)) {
              if (
                (isPromptPay && value.length <= 13) ||
                (!isPromptPay && value.length <= 12)
              ) {
                setFieldData({ ...fieldData, number_bank: value });
              }
            }
          }}
          onBlur={() => {
            const isPromptPay = fieldData.account_type === ACCOUNT_TYPE.PROMPTPAY;
            const length = fieldData.number_bank.length;

            if (
              (!isPromptPay && length !== 10 && length !== 12) ||
              (isPromptPay && length !== 10 && length !== 13)
            ) {
              notify(
                "เลขที่กรอกไม่ถูกต้อง เลขบัญชีและพร้อมเพย์ 10 หลัก หรือ 13 หลัก หลักเท่านั้น",
                "error"
              );
              setFieldData({ ...fieldData, number_bank: "" });
            }
          }}
        />
      </div>
      <div className="input-group-register-field">
        <div className="icon-label-container">
          <label htmlFor="bank">ชื่อเจ้าของบัญชีธนาคาร</label>
          <img
            width={20}
            height={20}
            style={{ verticalAlign: "middle" }}
            src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755157542/qlementine-icons--user-24_zre8k9.png"
            alt=""
          />
        </div>
        <input
          type="text"
          maxLength={50}
          name="account_holder"
          placeholder="ชื่อเจ้าของบัญชี"
          value={fieldData.account_holder}
          onChange={handleFieldChange}
        />
      </div>
      <div>
        <div className="input-group-register-field">
          <div className="icon-label-container">
            <label>ค่ามัดจำ</label>
            <img
              height={20}
              width={20}
              style={{ verticalAlign: "middle" }}
              src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757261552/vaadin--money-deposit_h34fs8.png"
              alt=""
            />
          </div>
        </div>
        <div className="depositcon-regisfield">
          <div className="input-group-checkbox-register-field">
            <input
              type="checkbox"
              checked={fieldData.depositChecked}
              onChange={handleCheckboxChange}
            />
            <div className="input-group-deposit-regisfield">
              <label>เก็บค่ามัดจำ</label>
            </div>
          </div>
          {fieldData.depositChecked && (
            <div className="input-group-register-field">
              <input
                type="text"
                name="price_deposit"
                placeholder="กำหนดค่ามัดจำ"
                value={fieldData.price_deposit || ""}
                onChange={handlePriceChange}
                maxLength={7}
                inputMode="numeric"
                pattern="[0-9]*"
                onKeyDown={(e) => {
                  if (e.key === "-") {
                    e.preventDefault();
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
