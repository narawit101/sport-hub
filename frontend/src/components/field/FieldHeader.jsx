"use client";
import React from "react";
import { formatPrice } from "@/app/utils/format";

export default function FieldHeader({
  fieldData,
  followersCount = 0,
  isFollowing = false,
  onFollow,
  onUnfollow,
  onShowFollowers,
  showFollowAction = false,
  startProcessLoad = false,
  onImageClick,
  onEditImage,
  previewUrl,
}) {
  if (!fieldData) return null;

  const displayImage = previewUrl || fieldData.img_field;

  return (
    <div className="image-container-profile">
      {displayImage ? (
        <>
          <img
            src={`${displayImage}`}
            alt="รูปสนามกีฬา Background"
            className="field-image-profile-bg"
          />
          <img
            src={`${displayImage}`}
            alt="รูปสนามกีฬา"
            className="field-image-profile-fg"
          />
        </>
      ) : (
        <div className="no-image-placeholder-profile">ไม่มีรูปภาพสนาม</div>
      )}
      <div
        className="profile-header-overlay"
        style={{ cursor: onImageClick && displayImage ? "zoom-in" : "default" }}
        onClick={() =>
          onImageClick && displayImage && onImageClick(displayImage)
        }
      >
        {onEditImage && (
          <button
            className="edit-header-btn"
            onClick={(e) => {
              e.stopPropagation();
              onEditImage();
            }}
            title="แก้ไขรูปภาพสนาม"
          >
            แก้ไขรูปภาพ
          </button>
        )}
        <div
          className="profile-header-content"
          onClick={(e) => e.stopPropagation()}
        >
          <h1 className="profile-header-title">{fieldData?.field_name}</h1>
          <div className="profile-header-meta">
            {onShowFollowers && (
              <div
                onClick={onShowFollowers}
                className="profile-followers-count"
                style={{ cursor: "pointer" }}
              >
                <span>
                  ผู้ติดตาม <strong>{formatPrice(followersCount)}</strong> คน
                </span>
              </div>
            )}
            {showFollowAction && (
              <div className="profile-follow-action">
                {isFollowing ? (
                  <button
                    disabled={startProcessLoad}
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    className="follow-btn-profile following"
                    onClick={onUnfollow}
                  >
                    {startProcessLoad ? (
                      <span className="dot-loading">
                        <span className="dot one">●</span>
                        <span className="dot two">●</span>
                        <span className="dot three">●</span>
                      </span>
                    ) : (
                      "ติดตามแล้ว"
                    )}
                  </button>
                ) : (
                  <button
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    className="follow-btn-profile"
                    onClick={onFollow}
                  >
                    {startProcessLoad ? (
                      <span className="dot-loading">
                        <span className="dot one">●</span>
                        <span className="dot two">●</span>
                        <span className="dot three">●</span>
                      </span>
                    ) : (
                      "ติดตาม"
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
