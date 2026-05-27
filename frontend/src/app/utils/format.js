export const formatPrice = (value) => {
  if (value === undefined || value === null || isNaN(Number(value))) {
    return "0";
  }
  return new Intl.NumberFormat("th-TH").format(Number(value));
};

export const formatDateToThai = (date, fallback = "") => {
  if (!date) return fallback;
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return "ไม่สามารถแปลงวันที่ได้";
  const options = { day: "numeric", month: "long", year: "numeric" };
  return new Intl.DateTimeFormat("th-TH", options).format(parsedDate);
};

export const getCancelDeadlineTime = (start_date, start_time, cancel_hours) => {
  if (
    !start_date ||
    !start_time ||
    cancel_hours === undefined ||
    cancel_hours === null
  ) {
    return "-";
  }

  const cleanDate = start_date.includes("T")
    ? start_date.split("T")[0]
    : start_date;

  const bookingDateTime = new Date(`${cleanDate}T${start_time}+07:00`);

  if (isNaN(bookingDateTime.getTime())) {
    console.log(" Invalid Date from:", cleanDate, start_time);
    return "-";
  }

  bookingDateTime.setHours(bookingDateTime.getHours() - cancel_hours);

  return bookingDateTime.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const convertToThaiDays = (days) => {
  if (!days) return "";

  const dayMapping = {
    Mon: "จันทร์",
    Tue: "อังคาร",
    Wed: "พุธ",
    Thu: "พฤหัสบดี",
    Fri: "ศุกร์",
    Sat: "เสาร์",
    Sun: "อาทิตย์",
  };

  const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  let dayArray;
  if (Array.isArray(days)) {
    dayArray = days;
  } else {
    dayArray = days.split(/[\s,]+/);
  }

  // Filter valid days and get unique ones
  const uniqueDays = Array.from(new Set(dayArray.filter(d => dayOrder.includes(d))));
  
  if (uniqueDays.length === 0) return "";

  // Sort unique days by dayOrder index
  const sortedDays = uniqueDays.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));

  // If all 7 days are selected
  if (sortedDays.length === 7) {
    return "ทุกวัน";
  }

  // Check if consecutive
  const indices = sortedDays.map(d => dayOrder.indexOf(d));
  let isConsecutive = true;
  for (let i = 1; i < indices.length; i++) {
    if (indices[i] !== indices[i - 1] + 1) {
      isConsecutive = false;
      break;
    }
  }

  if (isConsecutive && sortedDays.length >= 2) {
    const firstDay = dayMapping[sortedDays[0]];
    const lastDay = dayMapping[sortedDays[sortedDays.length - 1]];
    return `${firstDay} - ${lastDay}`;
  }

  return sortedDays.map((day) => dayMapping[day] || day).join(" ");
};

export const daysInThai = {
  Mon: "จันทร์",
  Tue: "อังคาร",
  Wed: "พุธ",
  Thu: "พฤหัสบดี",
  Fri: "ศุกร์",
  Sat: "เสาร์",
  Sun: "อาทิตย์",
};

export const getBookingStatusDisplay = (booking) => {
  if (!booking) return { text: "ไม่ทราบสถานะ", className: "unknown" };
  const status = booking.status?.toLowerCase();
  const payMethod = booking.pay_method;
  const priceDeposit = Number(booking.price_deposit || 0);

  if (status === "pending" && payMethod === "โอนจ่าย") {
    if (priceDeposit > 0) {
      if (booking.deposit_slip) {
        return { text: "รอตรวจสอบมัดจำ", className: "pending" };
      }
      return { text: "รอชำระมัดจำ", className: "unpaid" };
    } else {
      if (booking.total_slip) {
        return { text: "รอตรวจสอบการโอน", className: "pending" };
      }
      return { text: "รอชำระเงิน", className: "unpaid" };
    }
  }

  switch (status) {
    case "pending":
      return { text: "รอตรวจสอบ", className: "pending" };
    case "approved":
      return { text: "อนุมัติแล้ว", className: "approved" };
    case "rejected":
      return { text: "ไม่อนุมัติ", className: "rejected" };
    case "complete":
      return { text: "การจองสำเร็จ", className: "complete" };
    case "verified":
      return { text: "อนุมัติแล้ว (ยืนยันสลิปแล้ว)", className: "verified" };
    case "cancelled":
      return { text: "ยกเลิกแล้ว", className: "cancelled" };
    default:
      return { text: "ไม่ทราบสถานะ", className: "unknown" };
  }
};




