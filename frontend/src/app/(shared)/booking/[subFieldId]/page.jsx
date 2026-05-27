"use client";
import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import "@/app/css/booking-slot.css";
import { useAuth } from "@/app/contexts/AuthContext";
import { formatPrice, formatDateToThai } from "@/app/utils/format";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";
import { useNotification } from "@/app/contexts/NotificationContext";
import Calendar from "react-calendar";
import "@/app/css/calendar-styles.css";
import { useBookingFlow } from "@/app/hooks/useBookingFlow";
import { BOOKING_STATUS, PAYMENT_METHOD } from "@/constants/status";
import Link from "next/link";

export default function Booking() {
  const { subFieldId } = useParams();
  const router = useRouter();
  const { notify } = useNotification();
  const { user, isLoading: authLoading } = useAuth();

  const {
    openHours,
    closeHours,
    slots,
    selectedSlots,
    selectedSlotsArr,
    canBook,
    timeStart,
    timeEnd,
    startDate,
    endDate,
    totalHours,
    price,
    newPrice,
    addOns,
    activity,
    facilities,
    selectPrice,
    selectedFacilities,
    priceDeposit,
    sumFac,
    totalPrice,
    totalRemaining,
    payMethod,
    setPayMethod,
    bookingDate,
    setBookingDate,
    openDays,
    isBooked,
    subFieldData,
    fieldName,
    showSummary,
    setShowSummary,
    bookTimeArr,
    dataLoading,
    startProcessLoad,
    facilityAvailability,
    serverTime,
    handlePriceOnChange,
    handleFacilitySelect,
    handleFacilityQuantityChange,
    resetSelection,
    handleSubmit,
    toggleSelectSlot,
    bookingDateFormatted,
    summaryRef,
  } = useBookingFlow(subFieldId, user, notify);

  const [showCalendar, setShowCalendar] = useState(false);
  usePreventLeave(startProcessLoad);

  const formatTotalHours = (hours) => {
    if (hours === 0) return "0 นาที";
    if (hours === 0.5) return "30 นาที";
    const h = Math.floor(hours);
    const m = (hours % 1) * 60;
    if (m === 0) return `${h} ชั่วโมง`;
    return `${h} ชั่วโมง ${m} นาที`;
  };

  const isPastSlot = (slot) => {
    if (!serverTime || !bookingDateFormatted) return false;
    const [st] = slot.split(" - ");
    const [h, m] = st.split(":").map(Number);

    // bookingDateFormatted is formatted as "YYYY-MM-DD"
    // Construct absolute target time in Asia/Bangkok timezone (+07:00)
    const targetISO = `${bookingDateFormatted}T${st.padStart(5, "0")}:00+07:00`;
    const sTime = new Date(targetISO);

    if (openHours) {
      const [oh] = openHours.split(":").map(Number);
      if (h < oh) {
        sTime.setDate(sTime.getDate() + 1);
      }
    }

    return serverTime.getTime() > sTime.getTime();
  };

  const getSlotStatus = (slot) => {
    if (!bookTimeArr || bookTimeArr.length === 0) return "";
    const slotTrimmed = slot.trim();
    const booked = bookTimeArr.find((b) => b.time.trim() === slotTrimmed);
    if (booked) {
      if (booked.status === BOOKING_STATUS.PENDING) return "pending-slot";
      if (
        booked.status === BOOKING_STATUS.APPROVED ||
        booked.status === BOOKING_STATUS.COMPLETE ||
        booked.status === BOOKING_STATUS.VERIFIED
      ) {
        return "complete-slot";
      }
    }
    return "";
  };

  useEffect(() => {
    if (showSummary && summaryRef.current) {
      summaryRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showSummary, summaryRef]);

  const handleConfirm = () => {
    if (totalPrice > 0 && !payMethod) {
      notify("กรุณาเลือกช่องทางการชำระเงิน", "error");
      return;
    }
    handleSubmit();
  };

  if (dataLoading || authLoading)
    return (
      <div className="load">
        <span className="spinner"></span>
      </div>
    );

  const today = serverTime || new Date();
  const maxDate = new Date(today.getTime());
  maxDate.setDate(maxDate.getDate() + 365);

  // Safe timezone-independent boundaries without mutating `today`
  const startOfToday = new Date(today.getTime());
  startOfToday.setHours(0, 0, 0, 0);

  const endOfMaxDate = new Date(maxDate.getTime());
  endOfMaxDate.setHours(23, 59, 59, 999);

  const isTileDisabled = ({ date, view }) => {
    if (view !== "month") return false;
    const day = date.getDay();
    if (!openDays.includes(day)) return true;

    const compareDate = new Date(date.getTime());
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate < startOfToday) return true;
    if (compareDate > endOfMaxDate) return true;

    return false;
  };

  const tileClassName = ({ date, view }) => {
    if (view !== "month") return "";
    const day = date.getDay();
    const compareDate = new Date(date.getTime());
    compareDate.setHours(0, 0, 0, 0);

    if (
      openDays.includes(day) &&
      compareDate <= endOfMaxDate &&
      compareDate >= startOfToday
    ) {
      return "allowed-day";
    }
    return "";
  };

  return (
    <div className="booking-page-container">
      <div className="container-bookings">
        {slots.length === 0 ? (
          <div className="loading-data">
            <div className="loading-data-spinner"></div>
          </div>
        ) : (
          <div className="book-content">
            <div className="calendar-btn-select-date">
              <div className="date-picker-container">
                <div className="date-select-label">
                  <h2>เลือกวันที่: </h2>
                </div>
                <button
                  className="calendar-toggle-btn"
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="calendar-btn-icon"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>
                    {bookingDate
                      ? formatDateToThai(bookingDate)
                      : "เลือกวันที่"}
                  </span>
                </button>
                {showCalendar && (
                  <div className="calendar-popup-overlay">
                    <div className="calendar-popup">
                      <button
                        className="btn-cancel-select-date"
                        onClick={() => setShowCalendar(false)}
                      >
                        ปิด
                      </button>
                      <Calendar
                        locale="th-TH"
                        onChange={(date) => {
                          if (isTileDisabled({ date, view: "month" })) return;
                          setBookingDate(date);
                          setShowCalendar(false);
                          resetSelection();
                        }}
                        value={bookingDate}
                        showNeighboringMonth={false}
                        minDate={startOfToday}
                        maxDate={maxDate}
                        tileClassName={tileClassName}
                        tileDisabled={isTileDisabled}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="sum-status-box-book">
              <div className="status-item-book">
                <div className="status-box-book-1"></div>
                <label>ว่าง</label>
              </div>
              <div className="status-item-book">
                <div className="status-box-book-2"></div>
                <label>รอดำเนินการ</label>
              </div>
              <div className="status-item-book">
                <div className="status-box-book-3"></div>
                <label>จองแล้ว</label>
              </div>
            </div>

            <div className="slots-grid-book">
              {slots.map((slot, index) => {
                const isSelected = selectedSlots.includes(index);
                const isPast = isPastSlot(slot);
                const statusClass = getSlotStatus(slot);

                let slotClass = "slot-box-book";
                if (isPast) slotClass += " past-slot";
                else if (statusClass) slotClass += ` ${statusClass}`;
                else if (isSelected) slotClass += " selected-slot";

                return (
                  <div
                    key={index}
                    className={slotClass}
                    onClick={() =>
                      !isPast && !statusClass && toggleSelectSlot(index)
                    }
                  >
                    <div className="slot-time-book">{slot}</div>
                  </div>
                );
              })}
            </div>

            {addOns.length > 0 && (
              <div className="addon-options-book">
                <div className="addon-title">ประเภทราคา/แพ็กเกจ</div>
                <div className="addon-grid-book">
                  <div
                    className={`addon-card ${selectPrice === "subFieldPrice" ? "selected" : ""}`}
                    onClick={() => handlePriceOnChange("subFieldPrice")}
                  >
                    <div className="addon-content-book">
                      {subFieldData.sport_name}
                    </div>
                    <div className="addon-price-book">
                      {formatPrice(price)} บาท/ชม.
                    </div>
                  </div>
                  {addOns.map((addon) => (
                    <div
                      key={addon.add_on_id}
                      className={`addon-card ${selectPrice === addon.add_on_id.toString() ? "selected" : ""}`}
                      onClick={() =>
                        handlePriceOnChange(addon.add_on_id.toString())
                      }
                    >
                      <div className="addon-content-book">{addon.content}</div>
                      <div className="addon-price-book">
                        {formatPrice(addon.price)} บาท/ชม.
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="book-sider">
          <div className="book-sum-box">
            <h1 className="field-title-book">{fieldName}</h1>
            <h2 className="sub-field-title">
              สนาม: {subFieldData.sub_field_name}
            </h2>
            <div className="time-info">
              <p>
                วันที่:{" "}
                {bookingDate
                  ? formatDateToThai(bookingDate)
                  : "ยังไม่ได้เลือกวันที่"}
              </p>
            </div>
            <div className="time-info">
              <p>
                เปิด: {openHours} - {closeHours} น
              </p>
            </div>
            <div className="time-info server-time-info">
              <p>
                เวลาอ้างอิงสนาม (ICT):{" "}
                <span>
                  {serverTime
                    ? `${serverTime.toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit" })} น.`
                    : "กำลังโหลด..."}
                </span>
              </p>
            </div>
            <div className="time-info-book">
              <strong>เวลาเริ่ม: {timeStart || "-"}</strong>
              <strong>เวลาสิ้นสุด: {timeEnd || "-"}</strong>
              <strong>
                รวมเวลา: {totalHours ? formatTotalHours(totalHours) : "-"}
              </strong>
            </div>
            {canBook && bookingDate && (
              <>
                <div className={`total-box ${canBook ? "show" : ""}`}>
                  <strong>ราคารวม: {formatPrice(totalPrice)} บาท</strong>
                  <span className="price-deposit">
                    มัดจำ: {formatPrice(priceDeposit)} บาท
                  </span>
                </div>
                <button
                  onClick={() => setShowSummary(true)}
                  className="btn-submit-book"
                >
                  จอง
                </button>
                <button className="btn-reset" onClick={resetSelection}>
                  รีเซ็ต
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showSummary && (
        <div className="booking-summary-section">
          <div className="booking-summary-container" ref={summaryRef}>
            <h2 className="summary-header">สรุปการจอง</h2>
            <div className="summary-details">
              <h3 className="field-title-summary">{fieldName}</h3>
              <p className="sub-field-title-summary">
                สนาม: {subFieldData.sub_field_name}
              </p>

              <div className="time-summary-info">
                <div className="summary-row">
                  <strong>วันที่:</strong>
                  <span>{formatDateToThai(bookingDate)}</span>
                </div>
                <div className="summary-row">
                  <strong>เวลา:</strong>
                  <span>
                    {timeStart} - {timeEnd} น.
                  </span>
                </div>
                <div className="summary-row">
                  <strong>จำนวนเวลา:</strong>
                  <span>{formatTotalHours(totalHours)}</span>
                </div>
                <div className="summary-row">
                  <strong>กิจกรรม:</strong>
                  <span>{activity}</span>
                </div>
              </div>

              {facilities.length > 0 && (
                <div className="facilities-summary-section">
                  <h4>เลือกสิ่งอำนวยความสะดวก</h4>
                  <div className="facilities-carousel">
                    {facilities.map((fac) => {
                      const isSelected = !!selectedFacilities[fac.field_fac_id];
                      const available =
                        facilityAvailability[fac.field_fac_id] ??
                        fac.fac_quantity;
                      return (
                        <div
                          key={fac.field_fac_id}
                          className={`facility-card-summary ${isSelected ? "selected" : ""}`}
                        >
                          <div className="facility-image-container">
                            {fac.fac_image ? (
                              <img
                                src={fac.fac_image}
                                alt={fac.fac_name}
                                className="facility-image"
                              />
                            ) : (
                              <div className="facility-no-image">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="30"
                                  height="30"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  className="facility-placeholder-icon"
                                >
                                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                  <line x1="12" y1="22.08" x2="12" y2="12" />
                                </svg>
                                <span>ไม่มีรูปภาพ</span>
                              </div>
                            )}
                          </div>
                          <div className="facility-info-summary">
                            <p className="facility-name">{fac.fac_name}</p>
                            <p className="facility-price">
                              {formatPrice(fac.fac_price)} บาท/ชิ้น
                            </p>
                            <p className="facility-availability">
                              ว่าง: {available} ชิ้น
                            </p>
                            <div className="facility-controls">
                              <button
                                className={`facility-select-btn ${isSelected ? "selected" : ""}`}
                                onClick={() =>
                                  handleFacilitySelect(
                                    fac.field_fac_id,
                                    fac.fac_price,
                                    fac.fac_name,
                                  )
                                }
                                disabled={available <= 0 && !isSelected}
                              >
                                {isSelected
                                  ? "เลือกแล้ว"
                                  : available <= 0
                                    ? "สินค้าหมด"
                                    : "เลือก"}
                              </button>
                              {isSelected && (
                                <div className="quantity-control">
                                  <button
                                    type="button"
                                    className="quantity-btn"
                                    onClick={() =>
                                      handleFacilityQuantityChange(
                                        fac.field_fac_id,
                                        selectedFacilities[fac.field_fac_id]
                                          .quantity - 1,
                                      )
                                    }
                                    disabled={
                                      selectedFacilities[fac.field_fac_id]
                                        .quantity <= 1
                                    }
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    className="quantity-input"
                                    value={
                                      selectedFacilities[fac.field_fac_id]
                                        .quantity
                                    }
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 1;
                                      handleFacilityQuantityChange(
                                        fac.field_fac_id,
                                        Math.min(Math.max(1, val), available),
                                      );
                                    }}
                                    min="1"
                                    max={available}
                                  />
                                  <button
                                    type="button"
                                    className="quantity-btn"
                                    onClick={() =>
                                      handleFacilityQuantityChange(
                                        fac.field_fac_id,
                                        selectedFacilities[fac.field_fac_id]
                                          .quantity + 1,
                                      )
                                    }
                                    disabled={
                                      selectedFacilities[fac.field_fac_id]
                                        .quantity >= available
                                    }
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {Object.values(selectedFacilities).length > 0 && (
                    <div className="selected-facilities-summary">
                      <h5>สิ่งอำนวยความสะดวกที่เลือก:</h5>
                      {Object.values(selectedFacilities).map((item) => (
                        <div
                          key={item.field_fac_id}
                          className="selected-facility-item"
                        >
                          <span>
                            {item.fac_name} ({item.quantity} ชิ้น)
                          </span>
                          <span>
                            {formatPrice(item.price * item.quantity)} บาท
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="price-summary-section">
                <div className="price-breakdown">
                  <div className="price-row">
                    <strong>
                      ราคาค่าสนาม ({formatPrice(newPrice)} / ชม.):
                    </strong>
                    <span>{formatPrice(newPrice * totalHours)} บาท</span>
                  </div>
                  {Object.values(selectedFacilities).length > 0 && (
                    <div className="price-row">
                      <strong>ค่าสิ่งอำนวยความสะดวก:</strong>
                      <span>{formatPrice(sumFac)} บาท</span>
                    </div>
                  )}
                  <div className="price-row total-row">
                    <strong>ราคารวมทั้งสิ้น:</strong>
                    <span>{formatPrice(totalPrice)} บาท</span>
                  </div>
                  <div className="price-row deposit-row">
                    <strong>มัดจำที่ต้องชำระ:</strong>
                    <span>{formatPrice(priceDeposit)} บาท</span>
                  </div>
                  <div className="deposit-helper-note">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="helper-icon"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span>
                      คุณสามารถชำระเงินและแนบหลักฐานการโอนได้ภายหลังที่หน้า
                      <a
                        target="_blank"
                        href="/my-booking"
                        className="font-medium hover:underline"
                      >
                        {" "}
                        รายการจองของฉัน{" "}
                      </a>
                    </span>
                  </div>
                  <div className="price-row remaining-row">
                    <strong>คงเหลือ (จ่ายที่สนาม):</strong>
                    <span>{formatPrice(totalRemaining)} บาท</span>
                  </div>
                </div>
              </div>

              <div className="payment-method-section">
                <h5>เลือกช่องทางการชำระเงิน</h5>
                <div className="payment-options">
                  <label
                    className={`payment-option ${payMethod === PAYMENT_METHOD.TRANSFER ? "active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={PAYMENT_METHOD.TRANSFER}
                      checked={payMethod === PAYMENT_METHOD.TRANSFER}
                      onChange={(e) => setPayMethod(e.target.value)}
                    />
                    <div className="payment-icon-wrapper">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="payment-icon"
                      >
                        <rect
                          x="2"
                          y="5"
                          width="20"
                          height="14"
                          rx="2"
                          ry="2"
                        />
                        <line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                    </div>
                    <span>โอนเงิน (พร้อมเพย์)</span>
                  </label>
                  <label
                    className={`payment-option ${payMethod === PAYMENT_METHOD.CASH ? "active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={PAYMENT_METHOD.CASH}
                      checked={payMethod === PAYMENT_METHOD.CASH}
                      onChange={(e) => setPayMethod(e.target.value)}
                    />
                    <div className="payment-icon-wrapper">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="payment-icon"
                      >
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </div>
                    <span>จ่ายด้วยเงินสด</span>
                  </label>
                </div>
              </div>

              <div className="summary-actions">
                <button
                  className="btn-confirm-booking"
                  onClick={handleConfirm}
                  disabled={startProcessLoad}
                >
                  {startProcessLoad ? "กำลังประมวลผล..." : "ยืนยันการจอง"}
                </button>
                <button
                  className="btn-cancel-booking"
                  onClick={() => setShowSummary(false)}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
