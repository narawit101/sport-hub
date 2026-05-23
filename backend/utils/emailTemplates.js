/**
 * Email Templates – ศูนย์กลางเทมเพลตอีเมลทั้งหมดของ Sport Hub
 *
 * ใช้ baseLayout() เป็น wrapper กลางสำหรับ header/footer/styling
 * แต่ละ function สร้าง content แล้วส่งเข้า baseLayout()
 */
require("dotenv").config();

const LOGO_URL =
  "https://res.cloudinary.com/dlwfuul9o/image/upload/v1750926689/logo2small_lzsrwa.png";

const FRONTEND_URL = () => process.env.FONT_END_URL || "";

// ──────────────────────────────────────────────
//  Base Layout
// ──────────────────────────────────────────────

function baseLayout(content) {
  return `
<div style="font-family: 'Kanit', sans-serif; max-width: 600px; margin: 10px auto; padding: 20px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; margin-top:80px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2); text-align:center;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <img src="${LOGO_URL}" alt="Sport-Hub Online Logo" style="display: block; max-width: 300px; margin-bottom: 10px;" />
      </td>
    </tr>
  </table>
  ${content}
  <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />
  <p style="font-size: 12px; color: #9ca3af; text-align: center;">
    หากคุณไม่ได้เป็นผู้ดำเนินการ กรุณาเพิกเฉยต่ออีเมลฉบับนี้
  </p>
</div>`;
}

/**
 * ปุ่ม CTA กลาง
 */
function ctaButton(label, url) {
  return `
  <div style="margin: 20px 0;">
    <a href="${url}" style="display: inline-block; background-color: #03045e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; width: 160px;" target="_blank">
      ${label}
    </a>
  </div>`;
}

// ──────────────────────────────────────────────
//  Register / OTP
// ──────────────────────────────────────────────

function otpVerification(otp) {
  return baseLayout(`
  <h1 style="color: #347433; margin-bottom: 16px; text-align: center">ยืนยันการลงทะเบียนบัญชี</h1>
  <h2 style="color: #347433; margin-bottom: 16px; text-align: center">OTP ของคุณคือ: <strong style="font-weight: bold; font-size: 35px; color: #5459AC;"> ${otp} </strong></h2>
  <p style="font-size: 12px; color: #9ca3af; text-align: center;">
    ใช้ OTP เพื่อยืนยันบัญีของคุณ มีเวลา 5 นาที ในการยืนยัน OTP ถ้าหมดอายุต้องกดขอใหม่
  </p>`);
}

// ──────────────────────────────────────────────
//  Reset Password
// ──────────────────────────────────────────────

function resetPasswordOtp(otp) {
  return baseLayout(`
  <h1 style="color: #03045e; margin-bottom: 16px; text-align: center">รีเซ็ตรหัสผ่าน</h1>
  <h2 style="color: #03045e; margin-bottom: 16px; text-align: center"> OTP ของคุณคือ  <strong style="display: inline-block; font-weight: bold; font-size: 35px; color: #80D8C3;">
    ${otp}
  </strong> </h2>
  <p style="font-size: 16px; text-align: center; color: #9ca3af;">
    <strong> กรุณาใช้รหัสนี้เพื่อรีเซ็ตรหัสผ่านของคุณ</strong>
  </p>`);
}

// ──────────────────────────────────────────────
//  Contact Admin
// ──────────────────────────────────────────────

function contactAdmin({ email, subJect, conTent }) {
  return baseLayout(`
  <h1 style="color: #03045e; margin-bottom: 16px; text-align: center">
    <p><strong>เรื่อง:</strong> ${subJect}</p>
  </h1>
  <h2 style="color: #03045e; margin-bottom: 16px; text-align: center">
    <p><strong>จาก:</strong> ${email}</p>
    <strong style="font-weight: bold; font-size: 24px; color: #333;">
      <p>${conTent}</p>
    </strong>
  </h2>`);
}

// ──────────────────────────────────────────────
//  Field Registration
// ──────────────────────────────────────────────

function fieldRegistered() {
  return baseLayout(`
  <h1 style="color: #03045e; margin-bottom: 16px; text-align: center">การลงทะเบียนสนาม</h1>
  <p style="font-size: 16px; text-align: center; color: #9ca3af;">
    <strong>คุณได้ลงทะเบียนสนามเรียบร้อยแล้ว<br>กรุณารอผู้ดูแลระบบตรวจสอบ ขอบคุณที่ใช้บริการ</strong>
  </p>`);
}

function fieldRegisteredNotifyAdmin({ userName, fieldId }) {
  return baseLayout(`
  <h1 style="color: #03045e; margin-bottom: 16px;">การลงทะเบียนสนาม</h1>
  <p style="font-size: 20px;">
    <h3>${userName}</h3>
    ได้ลงทะเบียนสนามกีฬา
  </p>
  ${ctaButton(`ตรวจสอบสนามกีฬา #${fieldId}`, `${FRONTEND_URL()}/login?redirect=/check-field/${fieldId}`)}
  <p style="font-size: 14px; color: #6b7280;">
    กรุณาตรวจสอบและอัปเดตสถานะให้เสร็จสิ้น
  </p>`);
}

function fieldAppealNotifyAdmin({ fieldName, fieldId }) {
  return baseLayout(`
  <h1 style="color: #03045e; margin-bottom: 16px;">คำขอลงทะเบียนสนามกีฬาอีกครั้ง</h1>
  <p style="font-size: 16px; color: #111827;">
    <strong style="color: #0f172a;">
      <h3>สนาม ${fieldName}</h3>
    </strong>
  <p style="font-size: 18px;">ได้ส่งคำขอลงทะเบียนสนามกีฬาอีกครั้ง</p>
  </p>
  ${ctaButton(`ตรวจสอบสนามกีฬา #${fieldId}`, `${FRONTEND_URL()}/login?redirect=/check-field/${fieldId}`)}
  <p style="font-size: 14px; color: #6b7280;">
    กรุณาตรวจสอบและอัปเดตสถานะให้เสร็จสิ้น
  </p>`);
}

function fieldEditNotifyAdmin({ fieldName, fieldId }) {
  return baseLayout(`
  <h1 style="color: #03045e; margin-bottom: 16px;">คำขอแก้ไขสนามกีฬา</h1>
  <p style="font-size: 16px; color: #111827;">
    <strong style="color: #0f172a;">
      <h3>${fieldName}</h3>
    </strong>
  <p style="font-size: 18px;">ได้ส่งคำขอแก้ไขสนามกีฬา</p>
  </p>
  ${ctaButton(`ตรวจสอบสนามกีฬา #${fieldId}`, `${FRONTEND_URL()}/login?redirect=/check-field/${fieldId}`)}
  <p style="font-size: 14px; color: #6b7280;">
    กรุณาตรวจสอบและอัปเดตสถานะให้เสร็จสิ้น
  </p>`);
}

function fieldApproved({ userName }) {
  return baseLayout(`
  <h1 style="color: #347433; margin-bottom: 16px; text-align: center">สนามกีฬาได้รับการอนุมัติ</h1>
  <p style="font-size: 16px; text-align: center; color: #333538ff;">
    <strong> สนามกีฬาของคุณ ${userName} ได้รับการอนุมัติเรียบร้อยแล้ว </br>ขอบคุณที่ใช้บริการ</strong>
  </p>`);
}

function fieldRejected({ userName, reasoning }) {
  return baseLayout(`
  <h1 style="color: #DC2525; margin-bottom: 16px; text-align: center">สนามกีฬาไม่ได้รับการอนุมัติ</h1>
  <p style="font-size: 16px; text-align: center; color: #333538ff;">
    <strong>สนามกีฬาของคุณ ${userName} ไม่ได้รับการอนุมัติ</strong><br/><br/>
  </p>
  <div style="margin: 16px 0; text-align:center; font-size: 18px;">
    <strong>เหตุผลที่ไม่ผ่านการอนุมัติ:</strong><br/>
    ${reasoning ? reasoning : "ไม่มีการระบุเหตุผล"}
  </div>
  <p style="font-size: 16px; text-align: center; color: #333538ff;">
    กรุณาตรวจสอบสนามกีฬาของคุณและส่งคำขอลงทะเบียนใหม่
  </p>`);
}

// ──────────────────────────────────────────────
//  Booking
// ──────────────────────────────────────────────

function bookingReminder({ fieldName, startTime, date }) {
  return baseLayout(`
  <h1 style="color: #03045e; margin-bottom: 16px; text-align: center">แจ้งเตือนล่วงหน้า</h1>
  <p style="font-size: 16px; text-align: center; color: #111827;">
    คุณมีการจองสนาม <strong>${fieldName}</strong>
  </p>
  <p style="font-size: 16px; text-align: center; color: #111827;">
    เวลาเริ่มต้น: <strong>${startTime}</strong> <br />
    วันที่: <strong>${date}</strong>
  </p>
  <p style="font-size: 14px; color: #6b7280; text-align: center">
    กรุณามาถึงสนามก่อนเวลาเพื่อเตรียมตัวล่วงหน้า
  </p>`);
}

function bookingStarted({ fieldName, startTime, startDate }) {
  return baseLayout(`
  <h1 style="color: #03045e; margin-bottom: 16px;">ถึงเวลาเริ่มการจองแล้ว</h1>
  <p style="font-size: 16px; color: #111827;">
    สนามที่จอง: <strong>${fieldName}</strong>
  </p>
  <p style="font-size: 16px; color: #111827;">
    เริ่มเวลา: <strong>${startTime}</strong> <br />
    วันที่: <strong>${startDate}</strong>
  </p>
  <p style="font-size: 14px; color: #6b7280;">
    ขอให้คุณมีความสุขกับการใช้งานสนาม และขอขอบคุณที่ใช้บริการของเรา
  </p>`);
}

function bookingAutoCancelled({ fieldName, startTime, startDate }) {
  return baseLayout(`
  <h1 style="color: #DC2525; margin-bottom: 16px;">การจองสนามของคุณถูกยกเลิกอัตโนมัติ</h1>
  <p style="font-size: 16px; color: #DC2525;">
   <strong> เนื่องจากไม่ได้แนบสลิปค่ามัดจำภายในเวลาที่กำหนดหลังจากได้รับการอนุมัติ</strong>
  </p>
  <p style="font-size: 16px; color: #111827;">
    สนามที่จอง: <strong>${fieldName}</strong>
  </p>
  <p style="font-size: 16px; color: #111827;">
    เริ่มเวลา: <strong style="color: #0f172a;">${startTime}</strong> <br />
    วันที่: <strong style="color: #0f172a;">${startDate}</strong>
  </p>
  <p style="font-size: 14px; color: #6b7280;">
   <strong> กรุณาแนบสลิปค่ามัดจำภายในเวลาที่กำหนด</strong>
  </p>`);
}

function bookingNewOrder({ fieldName, bookingId }) {
  return baseLayout(`
  <h1 style="color: #03045e; margin-bottom: 16px;">การจองสนาม</h1>
  <p style="font-size: 16px; color: #111827;">
    <strong style="color: #0f172a;"><h3>${fieldName}</h3></strong> มีรายการจองใหม่ 1 รายการ
  </p>
  ${ctaButton(`ตรวจสอบการจอง #${bookingId}`, `${FRONTEND_URL()}/login?redirect=/booking-detail/${bookingId}`)}
  <p style="font-size: 14px; color: #6b7280;">
    กรุณาตรวจสอบและอัปเดตสถานะการจองให้เสร็จสิ้น
  </p>`);
}

function bookingApproved({ fieldName, bookingId }) {
  return baseLayout(`
  <h1 style="color: #347433; margin-bottom: 16px; text-align: center;">การจองของคุณได้รับการอนุมัติแล้ว</h1>
  <p style="font-size: 16px; color: #111827; text-align: center;">
    การจองสนาม <strong>${fieldName}</strong> ของคุณได้รับการอนุมัติแล้ว
  </p>
  <div style="margin: 20px auto;">
    <a href="${FRONTEND_URL()}/login?redirect=/booking-detail/${bookingId}" style="background-color: #03045e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; text-align: center; justify-content: center; display: flex; width: 200px; margin: 10px auto; align-items: center;" target="_blank">
      ดูรายละเอียดการจอง #${bookingId}
    </a>
  </div>
  <p style="font-size: 14px; color: #6b7280; text-align: center">
    กรุณาแนบสลิปมัดจำ <strong>(ถ้ามี)</strong> ภายใน <strong>1 ชั่วโมง</strong> หลังจากได้รับการอนุมัติ มิฉะนั้นระบบจะยกเลิกการจองโดยอัตโนมัติ
  </p>`);
}

function bookingRejected({ fieldName, bookingId, reasoning }) {
  return baseLayout(`
  <h1 style="color: #DC2525; margin-bottom: 16px; text-align: center;">การจองของคุณไม่ได้รับการอนุมัติ</h1>
  <p style="font-size: 16px; color: #111827; text-align: center;">
    การจองสนาม <strong>${fieldName}</strong> ของคุณไม่ได้รับการอนุมัติ
  </p>
  <div style="margin: 16px 0; text-align:center; font-size: 18px;">
    <strong>เหตุผลที่ไม่ผ่านการอนุมัติ:</strong><br />
    <p style="font-size: 18px; color: #111827; text-align: center;">
    ${reasoning ? reasoning : "ไม่มีการระบุเหตุผล"}
  </p>
  </div>
  <a href="${FRONTEND_URL()}/login?redirect=/booking-detail/${bookingId}" target="_blank" style="
     background-color: #03045e;
     color: white;
     padding: 10px 20px;
     text-decoration: none;
     border-radius: 6px;
     font-weight: bold;
     width: 200px;
     margin: 10px auto;
     display: flex;
     justify-content: center;
     align-items: center;
     text-align: center;
   ">
    ดูรายละเอียดการจอง #${bookingId}
  </a>`);
}

function bookingComplete({ fieldName, bookingId }) {
  return baseLayout(`
  <h1 style="color: #347433; margin-bottom: 16px; text-align: center;">การจองเสร็จสิ้น</h1>
  <p style="font-size: 16px; color: #111827; text-align: center;">
    การจองสนาม <strong>${fieldName}</strong> ของคุณเสร็จสิ้นเรียบร้อยแล้ว ขอบคุณที่ใช้บริการ
  </p>
  <div style="margin: 20px auto;">
    <a href="${FRONTEND_URL()}/login?redirect=/booking-detail/${bookingId}" style="background-color: #03045e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; text-align: center; justify-content: center; display: flex; width: 200px; margin: 10px auto; align-items: center;" target="_blank">
      ดูรายละเอียด #${bookingId}
    </a>
  </div>`);
}

function bookingSlipUploaded({ fieldName, bookingId }) {
  return baseLayout(`
  <h1 style="color: #03045e; margin-bottom: 16px;">มีการอัปโหลดสลิปใหม่</h1>
  <p style="font-size: 16px; color: #111827;">
    <strong style="color: #0f172a;">${fieldName}</strong> ได้รับสลิปใหม่
  </p>
  ${ctaButton(`ตรวจสอบการจอง #${bookingId}`, `${FRONTEND_URL()}/login?redirect=/booking-detail/${bookingId}`)}
  <p style="font-size: 14px; color: #6b7280;">
    กรุณาตรวจสอบและอัปเดตสถานะการจองให้เสร็จสิ้น
  </p>`);
}

module.exports = {
  baseLayout,
  ctaButton,
  otpVerification,
  resetPasswordOtp,
  contactAdmin,
  fieldRegistered,
  fieldRegisteredNotifyAdmin,
  fieldAppealNotifyAdmin,
  fieldEditNotifyAdmin,
  fieldApproved,
  fieldRejected,
  bookingReminder,
  bookingStarted,
  bookingAutoCancelled,
  bookingNewOrder,
  bookingApproved,
  bookingRejected,
  bookingComplete,
  bookingSlipUploaded,
};
