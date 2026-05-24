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
        <img
          src={
            field.img_field
              ? `${field.img_field}`
              : "https://www.nstru.ac.th/resources/news/thumbnail/221.jpg"
          }
          alt={field.field_name}
          className="card-myfield-img"
        />

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
          className={`custom-owner-info-myfield ${
            field.status === FIELD_STATUS.VERIFIED
              ? "passed"
              : field.status === FIELD_STATUS.REJECTED
              ? "failed"
              : "pending"
          }`}
        >
          {field.status}
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
            <p>
              {field.avg_rating && field.avg_rating > 0
                ? `คะแนนรีวิว ${field.avg_rating}`
                : "ยังไม่มีคะแนนรีวิว"}
            </p>

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
                    fontSize: "20px",
                    marginRight: "4px",
                  }}
                />
              );
            })}
          </strong>
        </div>

        <div className={firstTimeClassName}>
          <p className="filedname">
            <span className="first-label-time">เปิดเวลา: </span>
            {field.open_hours} น. - {field.close_hours} น.
          </p>
        </div>
        <div className={firstOpenClassName}>
          <p>
            <span className="first-label-time">วันทำการ: </span>
            {convertToThaiDays(field.open_days)}
          </p>
        </div>
        <div className={firstOpenClassName}>
          <p>
            <span className="first-label-time">กีฬา: </span>
            {field.sport_names?.join(" / ")}
          </p>
        </div>
      </div>
    </div>
  );
}
