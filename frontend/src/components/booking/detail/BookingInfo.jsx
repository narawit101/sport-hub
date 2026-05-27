import React from "react";
import { formatPrice } from "@/app/utils/format";

export default function BookingInfo({
  booking,
  formatDate,
  calTotalHours,
  getCancelDeadlineTime,
}) {
  const fieldPrice =
    Number(booking.total_price || 0) -
    Number(booking.price_deposit || 0) -
    (booking.facilities?.reduce(
      (sum, f) => sum + Number(f.fac_price || 0),
      0,
    ) || 0);

  const totalFacilitiesPrice =
    booking.facilities?.reduce((sum, f) => sum + Number(f.fac_price || 0), 0) ||
    0;

  return (
    <>
      <div className="hours-detail-box">
        <div className="line-item-hours-detail">
          <span>เวลาที่จอง:</span>
          <span>
            {booking?.start_time ? booking.start_time.substring(0, 5) : "--:--"} -{" "}
            {booking?.end_time ? booking.end_time.substring(0, 5) : "--:--"} น.
          </span>
        </div>
        <div className="line-item-hours-detail">
          <span>รวมเวลา:</span>
          <span>{calTotalHours(booking.total_hours)}</span>
        </div>
        <hr className="divider-hours-detail" />
        <div className="line-item-hours-detail cancel-info">
          <span>ยกเลิกได้ถึง:</span>
          <span>
            {formatDate(booking.start_date)} เวลา:{" "}
            {getCancelDeadlineTime(
              booking.start_date,
              booking.start_time,
              booking.cancel_hours,
            )}{" "}
            น.
          </span>
        </div>
      </div>
      <div className="booking-detail-box">
        <div className="line-item-detail">
          <span className="all-price-detail">กิจกรรม:</span>
          <span className="all-price-detail">{booking.activity}</span>
        </div>
        <div className="line-item-detail">
          <span className="all-price-detail">ราคาสนาม:</span>
          <span className="all-price-detail">
            {new Intl.NumberFormat("th-TH").format(fieldPrice)} บาท
          </span>
        </div>

        {Array.isArray(booking.facilities) && booking.facilities.length > 0 && (
          <>
            <div className="line-item-detail">
              <span className="all-price-detail">สิ่งอำนวยความสะดวก:</span>
              <span></span>
            </div>
            <ul className="facility-list-detail">
              {booking.facilities.map((fac, index) => (
                <li key={index}>
                  {fac.fac_name} <span>{formatPrice(fac.fac_price)} บาท</span>
                </li>
              ))}
            </ul>
            <div className="line-item-detail">
              <span className="all-price-detail">
                รวมราคาสิ่งอำนวยความสะดวก:
              </span>
              <span className="all-price-detail">
                {new Intl.NumberFormat("th-TH").format(totalFacilitiesPrice)}{" "}
                บาท
              </span>
            </div>
          </>
        )}

        <hr className="divider-detail" />

        <div className="line-item-detail highlight">
          <span className="total-remianing-detail">
            รวมที่ต้องจ่าย: (ยอดคงเหลือ)
          </span>
          <span>{formatPrice(booking.total_remaining)} บาท</span>
        </div>

        <div className="line-item-detail plus">
          <span className="total-deposit-detail">มัดจำ:</span>
          <span>{formatPrice(booking.price_deposit)} บาท</span>
        </div>

        <hr className="divider-detail" />

        <div className="line-item-detail total">
          <span>ราคาสุทธิ:</span>
          <span>{formatPrice(booking.total_price)} บาท</span>
        </div>

        <div className="line-item-detail payment-method">
          <span>การชำระเงิน:</span>
          <span>{booking.pay_method}</span>
        </div>
      </div>
    </>
  );
}
