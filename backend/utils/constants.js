/**
 * Status and Role Constants for Sport Hub (Backend)
 */

const USER_STATUS = {
  VERIFIED: "ตรวจสอบแล้ว",
  PENDING: "รอยืนยัน",
  REJECTED: "ไม่ผ่านการตรวจสอบ",
};

const FIELD_STATUS = {
  VERIFIED: "ผ่านการอนุมัติ",
  PENDING: "รอตรวจสอบ",
  REJECTED: "ไม่ผ่านการอนุมัติ",
};

const BOOKING_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  COMPLETE: "complete",
  VERIFIED: "verified",
  CANCELLED: "cancelled",
};

const USER_ROLE = {
  ADMIN: "admin",
  FIELD_OWNER: "field_owner",
  CUSTOMER: "customer",
};

const PAYMENT_METHOD = {
  CASH: "เงินสด",
  TRANSFER: "โอนจ่าย",
};

const ACCOUNT_TYPE = {
  BANK: "ธนาคาร",
  PROMPTPAY: "พร้อมเพย์",
};

module.exports = {
  USER_STATUS,
  FIELD_STATUS,
  BOOKING_STATUS,
  USER_ROLE,
  PAYMENT_METHOD,
  ACCOUNT_TYPE,
};
