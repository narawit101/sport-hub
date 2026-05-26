"use client";

import React from "react";
import {
  formatPrice,
  formatDateToThai,
  getCancelDeadlineTime,
  getBookingStatusDisplay,
} from "@/app/utils/format";
import { BOOKING_STATUS } from "@/constants/status";

export default function BookingCard({
  booking,
  userName,
  showDeleteButton = false,
  onDelete,
}) {
  const formatDate = (isoString) => formatDateToThai(isoString);

  return (
    <li className="booking-card">
      <div className="booking-detail">
        <p>
          <strong>ชื่อผู้จอง: </strong>
          {userName || `${booking.first_name} ${booking.last_name}`}
        </p>
        <p>
          <strong>วันที่จอง: </strong>
          {formatDate(booking.start_date)}
        </p>
        <p>
          <strong>สนาม: </strong>
          {booking.field_name}
        </p>
        <p>
          <strong>สนามย่อย: </strong>
          {booking.sub_field_name}
        </p>
        <div className="hours-container-my-order">
          <div className="total-hours-order">
            <p>
              <strong> เวลาที่จอง: </strong>
              {booking.start_time?.substring(0, 5)} -{" "}
              {booking.end_time?.substring(0, 5)} น.
            </p>
            {booking.cancel_hours > 0 && (
              <p>
                <strong> สามารถยกเลิกก่อนเวลาเริ่ม: </strong>
                {booking.cancel_hours} ชม.
              </p>
            )}
          </div>
          {booking.cancel_hours > 0 && (
            <div className="total-date-order">
              <hr className="divider-order" />
              <p>
                ยกเลิกได้ถึง <strong>วันที่:</strong>{" "}
                {formatDate(booking.start_date)} <br />
                <strong> ** เวลา:</strong>{" "}
                {getCancelDeadlineTime(
                  booking.start_date,
                  booking.start_time,
                  booking.cancel_hours,
                )}{" "}
                น. **
              </p>
            </div>
          )}
        </div>

        <div className="compact-price-box-order">
          <div className="line-item-order">
            <span>กิจกรรม:</span>
            <span>{booking.activity}</span>
          </div>

          <div className="line-item-order">
            <span>ราคาสนาม:</span>
            <span>
              {formatPrice(
                booking.total_price -
                  booking.price_deposit -
                  (booking.facilities?.reduce(
                    (sum, f) => sum + f.fac_price,
                    0,
                  ) || 0),
              )}{" "}
              บาท
            </span>
          </div>

          {Array.isArray(booking.facilities) &&
            booking.facilities.length > 0 && (
              <div className="line-item-order">
                <span>ราคาสิ่งอำนวยความสะดวก:</span>
                <span>
                  {formatPrice(
                    booking.facilities.reduce((sum, f) => sum + f.fac_price, 0),
                  )}{" "}
                  บาท
                </span>
              </div>
            )}

          <hr className="divider-order" />

          <div className="line-item-order remaining">
            <span className="total-remaining-order">ยอดคงเหลือ:</span>
            <span className="total-remaining-order">
              {formatPrice(booking.total_remaining)} บาท
            </span>
          </div>

          <div className="line-item-order plus">
            <span className="total_deposit-order">มัดจำ:</span>
            <span>{formatPrice(booking.price_deposit)} บาท</span>
          </div>

          <hr className="divider-order" />

          <div className="line-item-order total">
            <span>สุทธิ:</span>
            <span>{formatPrice(booking.total_price)} บาท</span>
          </div>
        </div>

        <p>
          <strong>สถานะ:</strong>{" "}
          <span
            className={`status-text-detail ${booking.status?.toLowerCase()}`}
          >
            {booking.status?.toLowerCase() === BOOKING_STATUS.PENDING
              ? "รอตรวจสอบ"
              : booking.status?.toLowerCase() === BOOKING_STATUS.APPROVED
                ? "อนุมัติแล้ว"
                : booking.status?.toLowerCase() === BOOKING_STATUS.REJECTED
                  ? "ไม่อนุมัติ"
                  : booking.status?.toLowerCase() === BOOKING_STATUS.COMPLETE
                    ? "การจองสำเร็จ"
                    : booking.status?.toLowerCase() === BOOKING_STATUS.VERIFIED
                      ? "ตรวจสอบสลิปมัดจำแล้ว"
                      : booking.status?.toLowerCase() ===
                          BOOKING_STATUS.CANCELLED
                        ? "ยกเลิกแล้ว"
                        : "ไม่ทราบสถานะ"}
          </span>
        </p>
      </div>

      <button
        className="detail-button"
        onClick={() =>
          window.open(`/booking-detail/${booking.booking_id}`, "_blank")
        }
      >
        <img
          src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755269173/icon-park-outline--doc-detail_rufhhe.png"
          alt=""
          width={15}
          height={15}
          style={{ marginRight: "5px" }}
        />
        ดูรายละเอียด
      </button>

      {showDeleteButton && onDelete && (
        <button
          className="card-delete-bookinng-btn"
          title="ลบการจอง"
          onClick={() => onDelete(booking.booking_id)}
        >
          <img
            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAR1JREFUSEvNlusRwiAQhG870U5MJ6YStRLTiXZiOjmzGXAQjofJMCO/HDzug7tlCaQwVPUgIhcRORths5sbAPjfSRgqgIeInEoxC3wGcMzF1ADKhQCSOHe6VzcAwaqa3YA/0bozVW0pRaVSyd9r6Tzgnmnkr0nD+CeAodiDPdm/ShQmUlVKkvLcMliWKVxoqYPK2ApIFGcB9jQ8uROtAN7U+FTW3NrYWoliRa2LIilbc8w7ARhrgKvzHx/3V4Db4irc4GdYPaBMWaYtJxhbZEr3pJK6AagW3oUtgGP8NpRsuA+AWb0NO0Kziqx3wzQ7VQ3togsgtAsPsKDhnPl05k4Q+1GLVSQ2wRLnAPFdaLHu5JKVAKXPFQuWeJAPegM03+AZ7kVVEgAAAABJRU5ErkJggg=="
            alt=""
            width={15}
            height={15}
          />
        </button>
      )}
    </li>
  );
}
