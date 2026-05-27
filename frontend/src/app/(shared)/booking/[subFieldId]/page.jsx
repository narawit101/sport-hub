"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import "@/app/css/booking-slot.css";
import { useAuth } from "@/app/contexts/AuthContext";
import { formatPrice, formatDateToThai } from "@/app/utils/format";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";
import { useNotification } from "@/app/contexts/NotificationContext";
import Calendar from "react-calendar";
import "@/app/css/calendar-styles.css";
import { useBookingFlow } from "@/app/hooks/useBookingFlow";
import { BOOKING_STATUS, PAYMENT_METHOD } from "@/constants/status";

export default function Booking() {
  const { subFieldId } = useParams();
  const { notify } = useNotification();
  const { user, isLoading: authLoading } = useAuth();

  const {
    openHours,
    closeHours,
    slots,
    selectedSlots,
    canBook,
    timeStart,
    timeEnd,
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
  const [facLightboxImage, setFacLightboxImage] = useState(null);
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
                  <div
                    className="calendar-popup-overlay"
                    onClick={() => setShowCalendar(false)}
                  >
                    <div
                      className="calendar-popup"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="btn-close-calendar-premium"
                        onClick={() => setShowCalendar(false)}
                        aria-label="ปิดปฏิทิน"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
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
          </div>
        )}

        <div className="book-sider">
          <div className="book-sum-box">
            <div className="server-time-reference-premium">
              <div className="time-icon-wrapper">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="server-time-content">
                <span className="server-time-label">
                  เวลามาตรฐานประเทศไทย (GMT+7)
                </span>
                <span className="server-time-value">
                  {serverTime
                    ? `${serverTime.toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit" })} น.`
                    : "--:--"}
                </span>
              </div>
            </div>

            <h1 className="field-title-book">{fieldName}</h1>
            <h2 className="sub-field-title">
              สนาม: {subFieldData.sub_field_name}
            </h2>

            <div className="booking-info-list-premium">
              <div className="info-item-premium">
                <span className="info-label">วันที่:</span>
                <span className="info-value">
                  {bookingDate
                    ? formatDateToThai(bookingDate)
                    : "ยังไม่ได้เลือกวันที่"}
                </span>
              </div>
              <div className="info-item-premium">
                <span className="info-label">เปิดบริการ:</span>
                <span className="info-value">
                  {openHours} - {closeHours} น.
                </span>
              </div>
            </div>

            <div className="divider-premium" />

            {addOns.length > 0 && (
              <div className="package-selector-premium">
                <div className="package-title-premium">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  <span>เลือกประเภทแพ็กเกจ</span>
                </div>
                <div className="package-grid-premium">
                  <div
                    className={`package-card-premium ${selectPrice === "subFieldPrice" ? "selected" : ""}`}
                    onClick={() => handlePriceOnChange("subFieldPrice")}
                  >
                    <div className="package-info-premium">
                      <span className="package-name-premium">
                        ราคาปกติ ({subFieldData.sport_name})
                      </span>
                      <span className="package-price-premium">
                        {formatPrice(price)} บาท/ชม.
                      </span>
                    </div>
                    <div className="package-check-icon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  </div>
                  {addOns.map((addon) => (
                    <div
                      key={addon.add_on_id}
                      className={`package-card-premium ${selectPrice === addon.add_on_id.toString() ? "selected" : ""}`}
                      onClick={() =>
                        handlePriceOnChange(addon.add_on_id.toString())
                      }
                    >
                      <div className="package-info-premium">
                        <span className="package-name-premium">
                          {addon.content}
                        </span>
                        <span className="package-price-premium">
                          {formatPrice(addon.price)} บาท/ชม.
                        </span>
                      </div>
                      <div className="package-check-icon">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="time-selection-summary-premium">
              <div className="time-row-premium">
                <div className="time-col-premium">
                  <span className="time-label">เวลาเริ่ม</span>
                  <span className="time-value">{timeStart || "--:--"}</span>
                </div>
                <div className="time-col-premium">
                  <span className="time-label">เวลาสิ้นสุด</span>
                  <span className="time-value">{timeEnd || "--:--"}</span>
                </div>
              </div>
              <div className="total-duration-premium">
                <span>รวมเวลาทั้งหมด:</span>
                <strong>
                  {totalHours ? formatTotalHours(totalHours) : "-"}
                </strong>
              </div>
            </div>

            {canBook && bookingDate && (
              <div className="price-summary-box-premium">
                <div className="price-row-premium total">
                  <span>ราคารวมทั้งสิ้น:</span>
                  <strong>{formatPrice(totalPrice)} บาท</strong>
                </div>
                {/* <div className="price-row-premium deposit">
                  <span>ค่ามัดจำ:</span>
                  <strong>{formatPrice(priceDeposit)} บาท</strong>
                </div> */}

                <div className="action-buttons-premium">
                  <button
                    onClick={() => setShowSummary(true)}
                    className="btn-submit-premium"
                  >
                    สรุปการจอง
                  </button>
                  <button
                    className="btn-reset-premium"
                    onClick={resetSelection}
                  >
                    รีเซ็ตการเลือก
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSummary && (
        <div
          className="booking-summary-section"
          onClick={() => setShowSummary(false)}
        >
          <div
            className="booking-summary-container"
            onClick={(e) => e.stopPropagation()}
            ref={summaryRef}
          >
            <div className="card-header" style={{ padding: "30px 30px 10px" }}>
              <div className="header-icon-wrapper">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <h2 className="card-title">สรุปรายการจอง</h2>
              <p className="card-subtitle">
                กรุณาตรวจสอบข้อมูลการจองของคุณก่อนยืนยัน
              </p>
            </div>

            <div className="summary-details">
              <div className="venue-summary-box">
                <h3 className="field-title-summary">{fieldName}</h3>
                <p className="sub-field-title-summary">
                  สนามย่อย: {subFieldData.sub_field_name}
                </p>
              </div>

              <div className="details-grid-premium">
                <div className="detail-item-compact">
                  <span className="label">วันที่จอง</span>
                  <span className="value">{formatDateToThai(bookingDate)}</span>
                </div>
                <div className="detail-item-compact">
                  <span className="label">ช่วงเวลา</span>
                  <span className="value">
                    {timeStart} - {timeEnd} น.
                  </span>
                </div>
                <div className="detail-item-compact">
                  <span className="label">รวมเวลา</span>
                  <span className="value">{formatTotalHours(totalHours)}</span>
                </div>
                <div className="detail-item-compact">
                  <span className="label">ประเภทกิจกรรม</span>
                  <span className="value">{activity || "-"}</span>
                </div>
              </div>

              {facilities.length > 0 && (
                <div className="facilities-compact-section">
                  <h4 className="section-title-compact">
                    สิ่งอำนวยความสะดวกเพิ่มเติม
                  </h4>
                  <div className="facilities-list-compact">
                    {facilities.map((fac) => {
                      const isSelected = !!selectedFacilities[fac.field_fac_id];
                      const available =
                        facilityAvailability[fac.field_fac_id] ??
                        fac.fac_quantity;

                      return (
                        <div
                          key={fac.field_fac_id}
                          className={`facility-row-compact ${isSelected ? "active" : ""}`}
                        >
                          <div
                            className={`fac-visual-compact ${fac.image_path ? "clickable" : ""}`}
                            onClick={() =>
                              fac.image_path &&
                              setFacLightboxImage(fac.image_path)
                            }
                            title={fac.image_path ? "คลิกเพื่อดูรูปขยาย" : ""}
                          >
                            {fac.image_path ? (
                              <img
                                src={fac.image_path}
                                alt={fac.fac_name}
                                className="fac-thumb-premium"
                              />
                            ) : (
                              <div className="fac-thumb-placeholder">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                >
                                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                  <line
                                    x1="12"
                                    y1="22.08"
                                    x2="12"
                                    y2="12"
                                  ></line>
                                </svg>
                                <span
                                  style={{ fontSize: "10px", marginTop: "2px" }}
                                >
                                  ไม่มีรูป
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="fac-info">
                            <span className="fac-name">{fac.fac_name}</span>
                            <div className="fac-meta-compact">
                              <span className="fac-price">
                                {formatPrice(fac.fac_price)} บาท
                              </span>
                              <span className="fac-available">
                                คงเหลือ: {available} ชิ้น
                              </span>
                            </div>
                          </div>

                          <div className="fac-actions">
                            {!isSelected ? (
                              <button
                                className="fac-add-btn"
                                onClick={() =>
                                  handleFacilitySelect(
                                    fac.field_fac_id,
                                    fac.fac_price,
                                    fac.fac_name,
                                  )
                                }
                                disabled={available <= 0}
                              >
                                {available <= 0 ? "หมด" : "+ เพิ่ม"}
                              </button>
                            ) : (
                              <div className="fac-quantity-stepper">
                                <button
                                  onClick={() =>
                                    handleFacilityQuantityChange(
                                      fac.field_fac_id,
                                      selectedFacilities[fac.field_fac_id]
                                        .quantity - 1,
                                    )
                                  }
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  className="fac-quantity-input-compact"
                                  value={
                                    selectedFacilities[fac.field_fac_id]
                                      ?.quantity || 1
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
                                  onClick={() =>
                                    handleFacilityQuantityChange(
                                      fac.field_fac_id,
                                      (selectedFacilities[fac.field_fac_id]
                                        ?.quantity || 1) + 1,
                                    )
                                  }
                                  disabled={
                                    (selectedFacilities[fac.field_fac_id]
                                      ?.quantity || 1) >= available
                                  }
                                >
                                  +
                                </button>
                                <button
                                  className="fac-remove-btn"
                                  onClick={() =>
                                    handleFacilitySelect(
                                      fac.field_fac_id,
                                      fac.fac_price,
                                      fac.fac_name,
                                    )
                                  }
                                >
                                  ×
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="price-breakdown-premium">
                <div className="price-row-item">
                  <span>ค่าสนาม ({formatPrice(newPrice)}/ชม.)</span>
                  <span>{formatPrice(newPrice * totalHours)} บาท</span>
                </div>
                {Object.values(selectedFacilities).length > 0 && (
                  <div className="price-row-item">
                    <span>ค่าสิ่งอำนวยความสะดวก</span>
                    <span>{formatPrice(sumFac)} บาท</span>
                  </div>
                )}
                <div className="price-row-item total-final">
                  <strong>ราคารวมทั้งสิ้น</strong>
                  <strong>{formatPrice(totalPrice)} บาท</strong>
                </div>
                <div className="price-row-item deposit-final">
                  <span>ยอดมัดจำที่ต้องชำระ</span>
                  <span>{formatPrice(priceDeposit)} บาท</span>
                </div>
                <div className="price-row-item remaining-final">
                  <span>คงเหลือจ่ายหน้าสนาม</span>
                  <span>{formatPrice(totalRemaining)} บาท</span>
                </div>
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
                  คุณสามารถแนบหลักฐานการชำระเงินได้ภายหลังที่หน้า
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

              {priceDeposit > 0 && (
                <div className="auto-cancel-warning-note">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="warning-icon"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span>
                    กรุณาชำระเงินและแนบหลักฐานภายใน <strong>60 นาที</strong>{" "}
                    มิฉะนั้นการจองของคุณจะถูกยกเลิกอัตโนมัติ
                  </span>
                </div>
              )}

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

      {facLightboxImage && (
        <div
          className="premium-lightbox-overlay"
          onClick={() => setFacLightboxImage(null)}
        >
          <div
            className="premium-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="btn-close-lightbox-fac"
              onClick={() => setFacLightboxImage(null)}
            >
              ×
            </button>
            <img src={facLightboxImage} alt="รูปสิ่งอำนวยความสะดวก" />
          </div>
        </div>
      )}
    </div>
  );
}
