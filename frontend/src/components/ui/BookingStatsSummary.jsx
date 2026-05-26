"use client";

import React from "react";
import { formatPrice } from "@/app/utils/format";

export default function BookingStatsSummary({ stats, children }) {
  if (!stats) return null;

  return (
    <div className="stats-summary">
      <div className="stats-grid">
        <div className="stat-card all">
          <div className="stat-icon">
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
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 17h6" />
              <path d="M9 12h6" />
              <path d="M9 7h6" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">รายการทั้งหมด</span>
            <span className="stat-number">{stats.total || 0}</span>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">
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
          <div className="stat-content">
            <span className="stat-label">รอตรวจสอบ</span>
            <span className="stat-number">{stats.pending || 0}</span>
          </div>
        </div>

        <div className="stat-card approved">
          <div className="stat-icon">
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
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">อนุมัติแล้ว</span>
            <span className="stat-number">{stats.approved || 0}</span>
          </div>
        </div>

        <div className="stat-card rejected">
          <div className="stat-icon">
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
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">ไม่อนุมัติ</span>
            <span className="stat-number">{stats.rejected || 0}</span>
          </div>
        </div>

        {stats.cancelled !== undefined && (
          <div className="stat-card cancelled">
            <div className="stat-icon">
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
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="9" x2="15" y2="15" />
                <line x1="15" y1="9" x2="9" y2="15" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">ยกเลิกแล้ว</span>
              <span className="stat-number">{stats.cancelled || 0}</span>
            </div>
          </div>
        )}

        <div className="stat-card complete">
          <div className="stat-icon">
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
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">การจองสำเร็จ</span>
            <span className="stat-number">{stats.complete || 0}</span>
          </div>
        </div>

        <div className="stat-card verified">
          <div className="stat-icon">
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
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 11 2 2 4-4" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">ตรวจสอบสลิปมัดจำแล้ว</span>
            <span className="stat-number">{stats.verified || 0}</span>
          </div>
        </div>

        {stats.totalRevenue !== undefined && stats.totalRevenue >= 0 && (
          <div className="stat-card revenue">
            <div className="stat-icon">
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
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">รายได้รวม (จองสำเร็จ)</span>
              <span className="stat-number">{formatPrice(stats.totalRevenue)} บาท</span>
            </div>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
