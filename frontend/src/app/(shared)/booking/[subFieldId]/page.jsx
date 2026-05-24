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

export default function Booking() {
  const { subFieldId } = useParams();
  const router = useRouter();
  const { notify } = useNotification();
  const { user, isLoading: authLoading } = useAuth();

  const {
    openHours, closeHours, slots, selectedSlots, selectedSlotsArr, canBook, timeStart, timeEnd,
    startDate, endDate, totalHours, price, newPrice, addOns, activity, facilities, selectPrice,
    selectedFacilities, priceDeposit, sumFac, totalPrice, totalRemaining, payMethod, setPayMethod,
    bookingDate, setBookingDate, openDays, isBooked, subFieldData, fieldName,
    showSummary, setShowSummary, bookTimeArr, dataLoading, startProcessLoad, facilityAvailability,
    serverTime, handlePriceOnChange, handleFacilitySelect, resetSelection, handleSubmit, toggleSelectSlot,
    bookingDateFormatted, summaryRef
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
    if (!serverTime || !bookingDate) return false;
    const [st] = slot.split(" - ");
    const [h, m] = st.split(":").map(Number);
    
    // Create date based on selected booking date without time
    const sTime = new Date(bookingDate);
    sTime.setHours(h, m, 0, 0);

    // Handle overnight fields
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

  if (dataLoading || authLoading) return <div className="load"><span className="spinner"></span></div>;

  const today = serverTime || new Date();
  const maxDate = new Date(today.getTime());
  maxDate.setDate(maxDate.getDate() + 60);

  const tileClassName = ({ date, view }) => {
    const day = date.getDay();
    if (view === "month" && openDays.includes(day) && date <= maxDate && date >= new Date(today.setHours(0, 0, 0, 0))) {
      return "allowed-day";
    }
    return "";
  };

  return (
    <div>
      <div className="container-bookings">
        {slots.length === 0 ? (
          <div className="loading-data"><div className="loading-data-spinner"></div></div>
        ) : (
          <div className="book-content">
            <div className="calendar-btn-select-date">
              <div className="date-picker-container">
                <div className="date-select-label"><h2>เลือกวันที่: </h2></div>
                <button className="calendar-toggle-btn" onClick={() => setShowCalendar(!showCalendar)}>
                  {bookingDate ? formatDateToThai(bookingDate) : (
                    <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAUZJREFUSEvNVYFxwjAMfG1SJilMAkxSOgndBDpJYZJv3ycFJyF2Am6vvgMOR9G/9PLb8MvLpvKTfDGzSw2/FlcCOAIQyKYEQrIYNwIguVNiAG8AVEGtirXHnAF8mtlHTqgDIKnAxCZLWkseufSOPlp6ZxPtzQG+POB9yKKmQzyXHgBO+m9mq/BsL2+L2AtZpT68HERkU64AUPKdmU2KvgSRJH/IqxOHHCDEWpJrKla5zprAAFDf0maL7DEoQwAJU5z5ueAkQ+heBX8L4Cx0ktO4+bSJ2dy9RDjXoFfBPQtYsPcPWjRX0Htxs0RurYFO8nog6MiGF2ggq9BB24fIBwDbHODJFo0AdIqlfAuz032i6vdy5aigs1l/8JBluJNGa2927YcoQFpcOGKfSPbs2RmoXa+uQdxSNUl0i139opGe3Wri/yX0b2jJ5Bkv0yj2AAAAAElFTkSuQmCC" alt="calendar" />
                  )}
                </button>
                {showCalendar && (
                  <div className="calendar-popup-overlay">
                    <div className="calendar-popup">
                      <button className="btn-cancel-select-date" onClick={() => setShowCalendar(false)}>
                        ปิด
                      </button>
                      <Calendar
                        onChange={(date) => {
                          setBookingDate(date);
                          setShowCalendar(false);
                          resetSelection();
                        }}
                        value={bookingDate}
                        showNeighboringMonth={false}
                        minDate={new Date(today.setHours(0, 0, 0, 0))}
                        maxDate={maxDate}
                        tileClassName={tileClassName}
                        tileDisabled={({ date, view }) => view === "month" && !openDays.includes(date.getDay())}
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
                    onClick={() => !isPast && !statusClass && toggleSelectSlot(index)}
                  >
                    <div className="slot-time-book">{slot}</div>
                  </div>
                );
              })}
            </div>

            {addOns.length > 0 && (
              <div className="addon-options-book">
                <div className="addon-title">เลือกประเภทกีฬา</div>
                <div className="addon-grid-book">
                  <div
                    className={`addon-card ${selectPrice === "subFieldPrice" ? "selected" : ""}`}
                    onClick={() => handlePriceOnChange("subFieldPrice")}
                  >
                    <div className="addon-content-book">{subFieldData.sport_name}</div>
                    <div className="addon-price-book">{formatPrice(price)} บาท/ชม.</div>
                  </div>
                  {addOns.map((addon) => (
                    <div
                      key={addon.add_on_id}
                      className={`addon-card ${selectPrice === addon.add_on_id.toString() ? "selected" : ""}`}
                      onClick={() => handlePriceOnChange(addon.add_on_id.toString())}
                    >
                      <div className="addon-content-book">{addon.content}</div>
                      <div className="addon-price-book">{formatPrice(addon.price)} บาท/ชม.</div>
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
            <h2 className="sub-field-title">สนาม: {subFieldData.sub_field_name}</h2>
            <div className="time-info">
              <p>วันที่: {bookingDate ? formatDateToThai(bookingDate) : "ยังไม่ได้เลือกวันที่"}</p>
            </div>
            <div className="time-info">
              <p>เปิด: {openHours} - {closeHours} น</p>
            </div>
            <div className="time-info-book">
              <strong>เวลาเริ่ม: {timeStart || "-"}</strong>
              <strong>เวลาสิ้นสุด: {timeEnd || "-"}</strong>
              <strong>รวมเวลา: {totalHours ? formatTotalHours(totalHours) : "-"}</strong>
            </div>
            {canBook && bookingDate && (
              <>
                <div className={`total-box ${canBook ? 'show' : ''}`}>
                  <strong>ราคารวม: {formatPrice(totalPrice)} บาท</strong>
                  <span className="price-deposit">มัดจำ: {formatPrice(priceDeposit)} บาท</span>
                </div>
                <button onClick={() => setShowSummary(true)} className="btn-submit-book">จอง</button>
                <button className="btn-reset" onClick={resetSelection}>รีเซ็ต</button>
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
              <p className="sub-field-title-summary">สนาม: {subFieldData.sub_field_name}</p>

              <div className="time-summary-info">
                <div className="summary-row">
                  <strong>วันที่:</strong>
                  <span>{formatDateToThai(bookingDate)}</span>
                </div>
                <div className="summary-row">
                  <strong>เวลา:</strong>
                  <span>{timeStart} - {timeEnd} น.</span>
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
                      const available = facilityAvailability[fac.field_fac_id] ?? fac.fac_quantity;
                      return (
                        <div key={fac.field_fac_id} className={`facility-card-summary ${isSelected ? 'selected' : ''}`}>
                          <div className="facility-image-container">
                            {fac.fac_image ? (
                              <img src={fac.fac_image} alt={fac.fac_name} className="facility-image" />
                            ) : (
                              <div className="facility-no-image">ไม่มีรูปภาพ</div>
                            )}
                          </div>
                          <div className="facility-info-summary">
                            <p className="facility-name">{fac.fac_name}</p>
                            <p className="facility-price">{formatPrice(fac.fac_price)} บาท/ชิ้น</p>
                            <p className="facility-availability">ว่าง: {available} ชิ้น</p>
                            <div className="facility-controls">
                              <button
                                className={`facility-select-btn ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleFacilitySelect(fac.field_fac_id, fac.fac_price, fac.fac_name)}
                                disabled={available <= 0 && !isSelected}
                              >
                                {isSelected ? 'เลือกแล้ว' : available <= 0 ? 'สินค้าหมด' : 'เลือก'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="price-summary-section">
                <div className="price-breakdown">
                  <div className="price-row">
                    <strong>ราคาค่าสนาม ({formatPrice(newPrice)} / ชม.):</strong>
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
                    <strong>ค่ามัดจำ (จ่ายตอนนี้):</strong>
                    <span>{formatPrice(priceDeposit)} บาท</span>
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
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={PAYMENT_METHOD.TRANSFER}
                      checked={payMethod === PAYMENT_METHOD.TRANSFER}
                      onChange={(e) => setPayMethod(e.target.value)}
                    />
                    <span>โอนเงิน (พร้อมเพย์)</span>
                  </label>
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={PAYMENT_METHOD.CASH}
                      checked={payMethod === PAYMENT_METHOD.CASH}
                      onChange={(e) => setPayMethod(e.target.value)}
                    />
                    <span>จ่ายด้วยเงินสด</span>
                  </label>
                </div>
              </div>

              <div className="summary-actions">
                <button className="btn-confirm-booking" onClick={handleConfirm} disabled={startProcessLoad}>
                  {startProcessLoad ? "กำลังประมวลผล..." : "ยืนยันการจอง"}
                </button>
                <button className="btn-cancel-booking" onClick={() => setShowSummary(false)}>
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
