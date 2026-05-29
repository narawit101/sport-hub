"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/th";

dayjs.extend(relativeTime);
dayjs.locale("th");

export default function PostCard({
  post,
  mode = "home",
  onViewPost,
  onEditPost,
  onDeletePost,
  canPost = false,
  setSelectedImage,
  children,
}) {
  const router = useRouter();
  const [activeIdx, setActiveIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [progress, setProgress] = useState(0);

  const isHome = mode === "home";
  const images = post.images || [];

  const renderTextWithLinks = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
    const parts = text.split(urlRegex);
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        const url = part.startsWith("http") ? part : `https://${part}`;
        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="post-link"
            style={{ color: "#3b82f6", textDecoration: "underline" }}
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const handlePrev = () => {
    setActiveIdx((prev) => (prev - 1 < 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIdx((prev) => (prev + 1) % images.length);
  };

  if (children) {
    return (
      <div className="post-card-profile" id={`post-${post.post_id}`}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={isHome ? "post-card-home" : "post-card-profile"}
      id={`post-${post.post_id}`}
    >
      {isHome && (
        <div className="inline-name-field">
          <img
            src={
              post.img_field
                ? `${post.img_field}`
                : "https://www.nstru.ac.th/resources/news/thumbnail/221.jpg"
            }
            alt={post.field_name}
            className="post-img-field-home"
            onClick={() => router.push(`/profile/${post.field_id}`)}
            style={{ cursor: "pointer" }}
          />
          <div>
            <div
              className="field-name-created-at-home hover:text-blue-500 hover:underline cursor-pointer"
              onClick={() => router.push(`/profile/${post.field_id}`)}
            >
              <h2 className="post-field-name-home">{post.field_name}</h2>
            </div>
            <div className="time-home">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="time-icon-home"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{dayjs(post.created_at).fromNow()}</span>
            </div>
          </div>
        </div>
      )}

      {!isHome ? (
        <>
          <div className="inline-name-field mb-3">
            <img
              src={
                post.img_field
                  ? `${post.img_field}`
                  : "https://www.nstru.ac.th/resources/news/thumbnail/221.jpg"
              }
              alt={post.field_name}
              className="post-img-field-home"
            />
            <div className="field-name-created-at-home">
              <p className="post-field-name-home text-lg">{post.field_name}</p>
              <div className="time text-sm text-gray-500 mt-1 flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="time-icon-profile"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{dayjs(post.created_at).fromNow()}</span>
              </div>
            </div>
          </div>
          <h2 className="post-title">{renderTextWithLinks(post.title)}</h2>
        </>
      ) : (
        <h2 className="post-title-home">{renderTextWithLinks(post.title)}</h2>
      )}

      {images.length > 0 && (
        <div
          className={
            isHome ? "ig-carousel-container-home" : "ig-carousel-container"
          }
        >
          <div
            className={
              isHome
                ? "ig-carousel-track-wrapper-home"
                : "ig-carousel-track-wrapper"
            }
          >
            <div
              className={
                isHome ? "ig-carousel-track-home" : "ig-carousel-track"
              }
              style={{
                transform: `translateX(-${activeIdx * 100}%)`,
              }}
            >
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={`${img.image_url}`}
                  alt="รูปโพสต์"
                  className={
                    isHome ? "ig-carousel-image-home" : "ig-carousel-image"
                  }
                  onClick={() => setSelectedImage?.(`${img.image_url}`)}
                  style={{ cursor: "zoom-in", flexShrink: 0, width: "100%" }}
                />
              ))}
            </div>

            {images.length > 1 && (
              <>
                <button
                  className={isHome ? "arrow-btn left-home" : "arrow-btn left"}
                  onClick={handlePrev}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <button
                  className={
                    isHome ? "arrow-btn right-home" : "arrow-btn right"
                  }
                  onClick={handleNext}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className={isHome ? "dot-indicators-home" : "dot-indicators"}>
              {images.map((_, dotIdx) => (
                <span
                  key={dotIdx}
                  className={
                    isHome
                      ? `dot-home ${activeIdx === dotIdx ? "active-home" : ""}`
                      : `dot-post ${activeIdx === dotIdx ? "active" : ""}`
                  }
                  onClick={() => {
                    setActiveIdx(dotIdx);
                    setProgress(0);
                  }}
                ></span>
              ))}
            </div>
          )}
        </div>
      )}

      {post.content.length > 200 ? (
        <p className={isHome ? "post-text-home" : "post-text"}>
          {renderTextWithLinks(
            expanded
              ? post.content
              : `${post.content.substring(0, 100).trim()}... `,
          )}
          <span
            onClick={() => setExpanded(!expanded)}
            className={isHome ? "see-more-button-home" : "see-more-button-post"}
          >
            {expanded ? "ย่อ" : "ดูเพิ่มเติม"}
          </span>
        </p>
      ) : (
        <p className={isHome ? "post-text-home" : "post-text"}>
          {renderTextWithLinks(post.content)}
        </p>
      )}

      {isHome && onViewPost && (
        <button
          type="button"
          className="view-post-btn-home"
          onClick={() => onViewPost(post)}
        >
          <span>ดูรายละเอียด</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      )}

      {!isHome && canPost && (
        <div className="post-actions-profile">
          <button onClick={() => onEditPost?.(post)} className="btn-profile">
            แก้ไขโพส
          </button>
          <button
            onClick={() => onDeletePost?.(post.post_id)}
            className="btn-profile"
          >
            ลบโพส
          </button>
        </div>
      )}
    </div>
  );
}
