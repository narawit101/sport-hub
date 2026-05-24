"use client";
import React from "react";

export default function NotFoundCard({
  title = "ไม่พบข้อมูล",
  description = "ข้อมูลที่คุณค้นหาอาจถูกลบหรือไม่มีอยู่จริง",
  primaryLabel = "กลับหน้าแรก",
  onPrimary,
  secondaryLabel = "ย้อนกลับ",
  onSecondary,
  children,
}) {
  return (
    <div
      style={{
        minHeight: "55vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px 20px",
        textAlign: "center",
        gap: "14px",
      }}
    >
      <h1 style={{ fontSize: "2rem", margin: 0 }}>{title}</h1>
      <p
        style={{
          maxWidth: 560,
          lineHeight: 1.6,
          color: "#555",
          margin: 0,
          whiteSpace: "pre-line",
        }}
      >
        {description}
      </p>
      {children}
      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        {secondaryLabel && onSecondary && (
          <button
            onClick={onSecondary}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              background: "#e2e8f0",
              border: "none",
              cursor: "pointer",
            }}
          >
            {secondaryLabel}
          </button>
        )}
        {primaryLabel && onPrimary && (
          <button
            onClick={onPrimary}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              background: "#0284c7",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {primaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
