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
}) {
  const formatDate = (isoString) => formatDateToThai(isoString);

  const handleModeSwitch = () => {
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
  };

  const renderStatusOptions = () => (
    <select name="status" value={filters.status} onChange={onFilterChange}>
      <option value="">ทั้งหมด</option>
      <option value="pending">รอตรวจสอบ</option>
      <option value="approved">อนุมัติแล้ว</option>
      <option value="rejected">ไม่อนุมัติ</option>
      <option value="complete">การจองสำเร็จ</option>
      <option value="verified">ตรวจสอบสลิปมัดจำแล้ว</option>
    </select>
  );

  return (
    <div className="filters-order">
      {!useDateRange ? (
        <>
          <label>
            วันที่จอง:
            {filters.bookingDate && <>{formatDate(filters.bookingDate)}</>}
            <input
              type="date"
              name="bookingDate"
              value={filters.bookingDate}
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
              {(filters.startDate || filters.endDate) && (
                <>{filters.startDate && formatDate(filters.startDate)}</>
              )}
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={onFilterChange}
              />
            </label>

            <label>
              ถึงวันที่:
              {(filters.startDate || filters.endDate) && (
                <>{filters.endDate && formatDate(filters.endDate)}</>
              )}
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
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
        <button onClick={clearFilters} className="clear-filters-btn">
          ล้างตัวกรอง
        </button>
        <button
          className="swip-mode-order"
          type="button"
          onClick={handleModeSwitch}
        >
          {useDateRange ? "ใช้วันที่อย่างเดียว" : "ใช้ช่วงวัน"}
        </button>
      </div>

      {totalRevenue !== undefined && totalRevenue >= 0 && (
        <div className="revenue-summary">
          <div className="revenue-card">
            <h3>รายได้รวม (การจองสำเร็จ)</h3>
            <p className="revenue-amount">
              {formatPrice(totalRevenue)} บาท
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
