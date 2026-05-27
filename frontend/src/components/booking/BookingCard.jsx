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
      <div className="booking-card-header">
        <h3 className="booking-card-title">
          {booking.field_name}
          <span className="sub-field-dot">•</span>
          <span className="sub-field-text">{booking.sub_field_name}</span>
        </h3>
        <span
          className={`status-badge-detail ${booking.status?.toLowerCase()}`}
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
                    : booking.status?.toLowerCase() === BOOKING_STATUS.CANCELLED
                      ? "ยกเลิกแล้ว"
                      : "ไม่ทราบสถานะ"}
        </span>
      </div>

      <div className="booking-detail">
        <div className="booking-meta-grid">
          <div className="booking-meta-item">
            <strong>ผู้จอง:</strong>
            <span>
              {userName || `${booking.first_name} ${booking.last_name}`}
            </span>
          </div>
          <div className="booking-meta-item">
            <strong>วันที่เล่น:</strong>
            <span>{formatDate(booking.start_date)}</span>
          </div>
          <div className="booking-meta-item">
            <strong>เวลา:</strong>
            <span>
              {booking.start_time?.substring(0, 5)} -{" "}
              {booking.end_time?.substring(0, 5)} น.
            </span>
          </div>
          <div className="booking-meta-item">
            <strong>กิจกรรม:</strong>
            <span>{booking.activity || "-"}</span>
          </div>
        </div>

        {booking.cancel_hours > 0 && (
          <div className="cancel-deadline-box">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>
              ยกเลิกได้ภายใน: {formatDate(booking.start_date)} เวลา{" "}
              {getCancelDeadlineTime(
                booking.start_date,
                booking.start_time,
                booking.cancel_hours,
              )}{" "}
              น.
            </span>
          </div>
        )}

        <div className="compact-price-box-order">
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
                <span>สิ่งอำนวยความสะดวก:</span>
                <span>
                  {formatPrice(
                    booking.facilities.reduce((sum, f) => sum + f.fac_price, 0),
                  )}{" "}
                  บาท
                </span>
              </div>
            )}

          <div className="line-item-order remaining">
            <span>ยอดจ่ายหน้างาน:</span>
            <span>{formatPrice(booking.total_remaining)} บาท</span>
          </div>

          <div className="line-item-order deposit">
            <span>ชำระมัดจำแล้ว:</span>
            <span>{formatPrice(booking.price_deposit)} บาท</span>
          </div>

          <hr className="divider-order" />

          <div className="line-item-order total">
            <span>รวมสุทธิ:</span>
            <span>{formatPrice(booking.total_price)} บาท</span>
          </div>
        </div>
      </div>

      <div className="booking-card-actions">
        <button
          className="detail-button"
          onClick={() =>
            window.open(`/booking-detail/${booking.booking_id}`, "_blank")
          }
        >
          <img
            src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755269173/icon-park-outline--doc-detail_rufhhe.png"
            alt=""
            width={14}
            height={14}
          />
          <span>ดูรายละเอียดการจอง</span>
        </button>

        {showDeleteButton && onDelete && (
          <button
            className="card-delete-booking-btn"
            title="ลบการจอง"
            onClick={() => onDelete(booking.booking_id)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>
    </li>
  );
}
