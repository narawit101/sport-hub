"use client";

import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    if (!isHome || images.length <= 1) return;

    const rotationMs = 15000;
    const tickMs = 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + tickMs;
        if (next >= rotationMs) {
          setActiveIdx((prevIdx) => (prevIdx + 1) % images.length);
          return 0;
        }
        return next;
      });
    }, tickMs);

    return () => clearInterval(interval);
  }, [isHome, images.length]);

  const handlePrev = () => {
    setActiveIdx((prev) => (prev - 1 < 0 ? images.length - 1 : prev - 1));
    setProgress(0);
  };

  const handleNext = () => {
    setActiveIdx((prev) => (prev + 1) % images.length);
    setProgress(0);
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
          />
          <div className="field-name-created-at-home">
            <h2 className="post-field-name-home">{post.field_name}</h2>
            <div className="time-home">{dayjs(post.created_at).fromNow()}</div>
          </div>
        </div>
      )}

      {!isHome ? (
        <>
          <h2 className="post-title">{renderTextWithLinks(post.title)}</h2>
          <div className="time">{dayjs(post.created_at).fromNow()}</div>
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
            {isHome ? (
              <div className="ig-carousel-track-home">
                <img
                  key={`img-${post.post_id}-${activeIdx}`}
                  src={`${images[activeIdx]?.image_url}`}
                  alt="รูปโพสต์"
                  className="ig-carousel-image-home fade-swap"
                />
              </div>
            ) : (
              <div
                className="ig-carousel-track"
                style={{
                  transform: `translateX(-${activeIdx * 100}%)`,
                }}
              >
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={`${img.image_url}`}
                    alt="รูปโพสต์"
                    className="ig-carousel-image"
                    onClick={() => setSelectedImage?.(`${img.image_url}`)}
                    style={{ cursor: "zoom-in" }}
                  />
                ))}
              </div>
            )}

            {isHome && images.length > 1 && (
              <div className="carousel-progress" aria-hidden="true">
                <div
                  className="carousel-progress-bar"
                  style={{ width: `${(progress / 15000) * 100}%` }}
                />
              </div>
            )}

            {images.length > 1 && (
              <>
                <button
                  className={isHome ? "arrow-btn left-home" : "arrow-btn left"}
                  onClick={handlePrev}
                >
                  ❮
                </button>
                <button
                  className={
                    isHome ? "arrow-btn right-home" : "arrow-btn right"
                  }
                  onClick={handleNext}
                >
                  ❯
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

      {post.content.length > 100 ? (
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
          ดูโพสต์
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
