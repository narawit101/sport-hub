"use client";

import React, { useState, useEffect } from "react";
import "@/app/css/field-post.css";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";
import apiClient from "@/lib/apiClient";
import { useNotification } from "@/app/contexts/NotificationContext";

/**
 * Shared Post Modal for both Create and Edit modes.
 */
export default function PostModal({
  isOpen,
  onClose,
  mode = "create", // "create" | "edit"
  fieldId,
  postData = null, // Used for edit mode
  onSuccess,
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [newImages, setNewImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [deletedImages, setDeletedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { notify } = useNotification();
  usePreventLeave(isSubmitting);

  const MAX_FILE_SIZE = 8 * 1024 * 1024;
  const MAX_FILES = 10;

  // Manage preview URLs for new images
  useEffect(() => {
    if (newImages.length === 0) {
      setPreviewUrls([]);
      return;
    }

    const urls = newImages.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);

    // Cleanup URLs on unmount or when newImages changes
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [newImages]);

  // Initialize data for edit mode
  useEffect(() => {
    if (mode === "edit" && postData) {
      setTitle(postData.title || "");
      setContent(postData.content || "");
      setExistingImages(postData.images || []);
      setDeletedImages([]);
      setNewImages([]);
    } else {
      // Reset for create mode
      setTitle("");
      setContent("");
      setNewImages([]);
      setExistingImages([]);
      setDeletedImages([]);
    }
  }, [mode, postData, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validFiles = [];
    const totalCurrentImages = existingImages.length - deletedImages.length + newImages.length;
    
    if (totalCurrentImages + files.length > MAX_FILES) {
      notify(`คุณสามารถอัพโหลดรูปภาพรวมได้สูงสุด ${MAX_FILES} รูป`, "error");
      e.target.value = null;
      return;
    }

    for (let file of files) {
      if (file.size > MAX_FILE_SIZE) {
        notify(`ไฟล์ ${file.name} มีขนาดใหญ่เกินไป (สูงสุด 8MB)`, "error");
        continue;
      }
      if (!file.type.startsWith("image/")) {
        notify(`ไฟล์ ${file.name} ไม่ใช่รูปภาพ`, "error");
        continue;
      }
      validFiles.push(file);
    }

    setNewImages((prev) => [...prev, ...validFiles]);
    e.target.value = null;
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (img) => {
    setDeletedImages((prev) => [...prev, img.image_url]);
    setExistingImages((prev) => prev.filter((item) => item.image_url !== img.image_url));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fieldId && mode === "create") {
      notify("ไม่พบรหัสสนาม", "error");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    
    if (mode === "create") {
      formData.append("field_id", fieldId);
    }

    newImages.forEach((file) => {
      formData.append("img_url", file);
    });

    if (mode === "edit" && deletedImages.length > 0) {
      formData.append("deleted_images", JSON.stringify(deletedImages));
    }

    setIsSubmitting(true);
    try {
      let response;
      if (mode === "create") {
        response = await apiClient.postForm("/posts/post", formData);
        notify("สร้างโพสต์เรียบร้อยแล้ว", "success");
      } else {
        response = await apiClient.patchForm(`/posts/update/${postData.post_id}`, formData);
        notify("แก้ไขโพสต์เรียบร้อยแล้ว", "success");
      }
      
      onSuccess?.(response.post || response);
      onClose();
    } catch (error) {
      console.error("Submit post error:", error);
      notify(error.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="post-modal-overlay">
      <div className="post-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="post-modal-header">
          <h2>{mode === "create" ? "สร้างโพสต์ใหม่" : "แก้ไขโพสต์"}</h2>
          <button className="post-modal-close" onClick={onClose} disabled={isSubmitting}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="post-modal-form">
          <div className="post-modal-body">
            <div className="form-group-post">
              <label>หัวข้อประกาศ</label>
              <input
                type="text"
                placeholder="ระบุหัวข้อที่ต้องการสื่อสาร..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={255}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group-post">
              <label>เนื้อหา</label>
              <textarea
                placeholder="พิมพ์รายละเอียดเนื้อหาที่นี่..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={5}
                disabled={isSubmitting}
              ></textarea>
            </div>

            <div className="form-group-post">
              <label className="post-modal-upload-label">
                <input
                  multiple
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: "none" }}
                  disabled={isSubmitting}
                />
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                เพิ่มรูปภาพ
              </label>
              <small className="upload-hint">สูงสุด 10 รูป (ขนาดไม่เกิน 8MB ต่อไฟล์)</small>
            </div>

            {/* Image Preview Gallery */}
            {(existingImages.length > 0 || previewUrls.length > 0) && (
              <div className="post-modal-gallery">
                {/* Existing Images */}
                {existingImages.map((img, idx) => (
                  <div key={`exist-${idx}`} className="post-modal-img-item">
                    <img src={img.image_url} alt="existing" />
                    <button
                      type="button"
                      className="img-remove-btn"
                      onClick={() => removeExistingImage(img)}
                      title="ลบรูปเดิม"
                      disabled={isSubmitting}
                    >
                      &times;
                    </button>
                    <span className="img-tag existing">เดิม</span>
                  </div>
                ))}
                
                {/* New Images */}
                {previewUrls.map((url, idx) => (
                  <div key={`new-${idx}`} className="post-modal-img-item">
                    <img src={url} alt="new preview" />
                    <button
                      type="button"
                      className="img-remove-btn"
                      onClick={() => removeNewImage(idx)}
                      title="ลบรูปใหม่"
                      disabled={isSubmitting}
                    >
                      &times;
                    </button>
                    <span className="img-tag new">ใหม่</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="post-modal-footer">
            <button
              type="button"
              className="post-modal-cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="post-modal-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="modal-spinner"></div>
              ) : (
                mode === "create" ? "โพสต์ข่าวสาร" : "บันทึกการแก้ไข"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
