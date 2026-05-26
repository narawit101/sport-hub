"use client";

import React from "react";
import { formatDateToThai, formatPrice } from "@/app/utils/format";

export default function DateRangeFilter({
  filters,
  onFilterChange,
  clearFilters,
  useDateRange,
  setUseDateRange,
  setFilters,
  totalRevenue,
  fetchData,
  customerMode = false,
}) {
  const formatDate = (isoString) => formatDateToThai(isoString);

  const handleModeSwitch = () => {
    if (setUseDateRange && setFilters) {
      setUseDateRange((prev) => {
        const nextMode = !prev;
        setFilters({
          bookingDate: "",
          startDate: "",
          endDate: "",
          status: "",
        });
        if (fetchData) {
          setTimeout(() => {
            fetchData();
          }, 0);
        }
        return nextMode;
      });
    }
  };

  const renderStatusOptions = () => (
    <select name="status" value={filters.status} onChange={onFilterChange}>
      <option value="">ทั้งหมด</option>
      <option value="pending">รอตรวจสอบ</option>
      <option value="approved">อนุมัติแล้ว</option>
      <option value="rejected">ไม่อนุมัติ</option>
      <option value="cancelled">ยกเลิกแล้ว</option>
      <option value="complete">การจองสำเร็จ</option>
      <option value="verified">ตรวจสอบสลิปมัดจำแล้ว</option>
    </select>
  );

  return (
    <div className="filters-order">
      {customerMode ? (
        <>
          <label>
            วันที่:
            <input
              type="date"
              name="date"
              value={filters.date || ""}
              onChange={onFilterChange}
            />
          </label>
          <label>
            สถานะ:
            {renderStatusOptions()}
          </label>
        </>
      ) : !useDateRange ? (
        <>
          <label>
            วันที่จอง:
            <input
              type="date"
              name="bookingDate"
              value={filters.bookingDate || ""}
              onChange={onFilterChange}
            />
          </label>
          <label>
            สถานะ:
            {renderStatusOptions()}
          </label>
        </>
      ) : (
        <>
          <div className="date-range-filter">
            <label>
              วันที่เริ่ม:
              <input
                type="date"
                name="startDate"
                value={filters.startDate || ""}
                onChange={onFilterChange}
              />
            </label>

            <label>
              ถึงวันที่:
              <input
                type="date"
                name="endDate"
                value={filters.endDate || ""}
                onChange={onFilterChange}
                min={filters.startDate}
              />
            </label>
          </div>
          <label>
            สถานะ:
            {renderStatusOptions()}
          </label>
        </>
      )}

      <div className="btn-group-filter">
        <button onClick={clearFilters} className="clear-filters-btn" type="button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
          ล้างตัวกรอง
        </button>

        {!customerMode && (
          <button
            className="swip-mode-order"
            type="button"
            onClick={handleModeSwitch}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {useDateRange ? "ใช้วันที่อย่างเดียว" : "ใช้ช่วงวัน"}
          </button>
        )}
      </div>
    </div>
  );
}
