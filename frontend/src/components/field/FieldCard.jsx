"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar as solidStar,
  faStarHalfAlt,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as regularStar } from "@fortawesome/free-regular-svg-icons";
import { convertToThaiDays } from "@/app/utils/format";
import { FIELD_STATUS } from "@/constants/status";

export default function FieldCard({ field, mode = "home", onClick, onDelete }) {
  const router = useRouter();
  const isSearch = mode === "search";
  const isMyField = mode === "myfield";

  if (isMyField) {
    return (
      <div
        className="card-myfield"
        onClick={() => router.push(`/profile/${field.field_id}`)}
      >
        <div className="card-myfield-image-wrapper" style={{ position: "relative", width: "100%" }}>
          <img
            src={
              field.img_field
                ? `${field.img_field}`
                : "https://www.nstru.ac.th/resources/news/thumbnail/221.jpg"
            }
            alt={field.field_name}
            className="card-myfield-img"
          />
          <div
            className={`card-myfield-status-badge ${
              field.status === FIELD_STATUS.VERIFIED
                ? "passed"
                : field.status === FIELD_STATUS.REJECTED
                ? "failed"
                : "pending"
            }`}
          >
            {field.status}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete && onDelete(field.field_id, field.field_name);
          }}
          className="card-delete-btn"
          title="ลบสนาม"
        >
          <FontAwesomeIcon icon={faTrash} style={{ fontSize: "16px" }} />
        </button>

        <h3 className="custom-field-name">{field.field_name}</h3>
        <div className="custom-owner-info-myfield">
          เจ้าของ: {field.first_name} {field.last_name}
        </div>

        <div 
          className="custom-button-group-myfield" 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="main-buttons-row">
            <button
              onClick={() =>
                router.push(`/check-field/${field.field_id}`)
              }
              className="custom-button-view-myfield"
            >
              <img
                src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755269173/icon-park-outline--doc-detail_rufhhe.png"
                alt=""
                width={15}
                height={15}
              />
              ดูรายละเอียด
            </button>
            {field.status !== FIELD_STATUS.PENDING && (
              <button
                onClick={() =>
                  router.push(`/edit-field/${field.field_id}`)
                }
                className="custom-button-edit-myfield"
              >
                <img
                  src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755269214/flowbite--edit-outline_efjgro.png"
                  width={15}
                  height={15}
                  alt=""
                />
                แก้ไข
              </button>
            )}
          </div>

          {field.status === FIELD_STATUS.VERIFIED && (
            <div className="full-width-buttons">
              <button
                onClick={() =>
                  router.push(`/my-order/${field.field_id}`)
                }
                className="custom-button-view-order-myfield"
              >
                <img
                  src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755269241/material-symbols--order-approve-outline-rounded_xgqryx.png"
                  width={15}
                  height={15}
                  alt=""
                />
                รายการจองของสนาม
              </button>
              <button
                onClick={() =>
                  router.push(`/statistics/${field.field_id}`)
                }
                className="custom-button-view-stat-myfield"
              >
                <img
                  src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755269200/akar-icons--statistic-up_w8pkoi.png"
                  width={15}
                  height={15}
                  alt=""
                />
                สถิติการจองสนาม
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const cardClassName = isSearch ? "card-search" : "card-home";
  const imgClassName = isSearch ? "card-img-search" : "card-img-home";
  const bodyClassName = isSearch ? "card-body-search" : "card-body-home";
  const reviewContainerClassName = isSearch ? "reviwe-container-search" : "reviwe-container-home";
  const reviewStarClassName = isSearch ? "reviwe-star-search" : "reviwe-star-home";
  const firstTimeClassName = isSearch ? "firsttime-search" : "firsttime-home";
  const firstOpenClassName = isSearch ? "firstopen-search" : "firstopen-home";

  return (
    <div className={cardClassName} onClick={onClick}>
      <img
        src={
          field.img_field
            ? `${field.img_field}`
            : "https://www.nstru.ac.th/resources/news/thumbnail/221.jpg"
        }
        alt={field.field_name}
        className={imgClassName}
      />
      <div className={bodyClassName}>
        <h3>{field.field_name}</h3>
        <div className={reviewContainerClassName}>
          <strong className={reviewStarClassName}>
            {field.avg_rating && field.avg_rating > 0 ? (
              <>
                <span className="rating-score" style={{ marginRight: "4px" }}>{field.avg_rating}</span>
                <div className="card-rating-stars-row" style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                  {[1, 2, 3, 4, 5].map((num) => {
                    const rating = field.avg_rating || 0;
                    const roundedRating =
                      Math.floor(rating) + (rating % 1 >= 0.8 ? 1 : 0);

                    const isFull = num <= roundedRating;
                    const isHalf =
                      !isFull && num - 0.5 <= rating && rating % 1 < 0.8;

                    return (
                      <FontAwesomeIcon
                        key={num}
                        icon={
                          isFull
                            ? solidStar
                            : isHalf
                            ? faStarHalfAlt
                            : regularStar
                        }
                        style={{
                          color: "#facc15",
                          fontSize: "14px",
                        }}
                      />
                    );
                  })}
                </div>
              </>
            ) : (
              <span className="no-rating-text" style={{ color: "#6b7280", fontWeight: 500, fontSize: "13px" }}>ยังไม่มีรีวิว</span>
            )}
          </strong>
        </div>

        <div className="card-info-details-list">
          {/* Time Row */}
          <div className="card-info-detail-item">
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
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{field.open_hours} น. - {field.close_hours} น.</span>
          </div>

          {/* Days Row */}
          <div className="card-info-detail-item">
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
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{convertToThaiDays(field.open_days)}</span>
          </div>

          {/* Sports Row */}
          <div className="card-info-detail-item">
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
              <polygon points="5 3 19 3 19 6 5 6" />
              <path d="M5 6v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6" />
            </svg>
            <span>{field.sport_names?.join(" / ")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
