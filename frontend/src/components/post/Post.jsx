"use client";

import { useState, useEffect } from "react";
import "@/app/css/field-post.css";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";
import apiClient from "@/lib/apiClient";
import { useNotification } from "@/app/contexts/NotificationContext";

const CreatePost = ({ fieldId, onPostSuccess, setCurrentPage }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [showPostForm, setShowPostForm] = useState(false);
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  const { notify } = useNotification();
  usePreventLeave(startProcessLoad);

  const MAX_FILE_SIZE = 8 * 1024 * 1024;
  const MAX_FILES = 10;

  const handleFileChange = (e) => {
    const files = e.target.files;
    const validFiles = [];
    let isValid = true;

    if (files.length + images.length > MAX_FILES) {
      notify(`คุณสามารถอัพโหลดได้สูงสุด ${MAX_FILES} รูป`, "error");
      e.target.value = null;
      return;
    }

    for (let file of files) {
      if (file.size > MAX_FILE_SIZE) {
        notify("ไฟล์รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 8MB)", "error");
        isValid = false;
        break;
      }

      if (file.type.startsWith("image/")) {
        const isDuplicate = images.some(
          (existingFile) => existingFile.name === file.name
        );
        if (!isDuplicate) {
          validFiles.push(file);
        }
      } else {
        notify("โปรดเลือกเฉพาะไฟล์รูปภาพเท่านั้น", "error");
        isValid = false;
        break;
      }
    }

    if (isValid) {
      setImages((prevImages) => [...prevImages, ...validFiles]);
    } else {
      e.target.value = null;
    }
  };

  const removeImage = (fileName) => {
    setImages(images.filter((image) => image.name !== fileName));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fieldId) {
      notify("Error: Field ID is missing.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("field_id", fieldId);

    images.forEach((image) => {
      formData.append("img_url", image);
    });
    SetstartProcessLoad(true);
    try {
      const data = await apiClient.postForm("/posts/post", formData);
      onPostSuccess(data.post);
      setCurrentPage(1);
      notify("โพสต์เรียบร้อย", "success");
      setTitle("");
      setContent("");
      setImages([]);
      setShowPostForm(false);
    } catch (error) {
      console.error("Error submitting post:", error);
      notify(error.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  return (
    <>
      <div className="post-container">
        {!showPostForm && (
          <button
            className="add-post-button"
            onClick={() => setShowPostForm(true)}
          >
            เพิ่มโพส
          </button>
        )}

        {showPostForm && (
          <form onSubmit={handleSubmit} className="post-form">
            <div className="form-group-post">
              <label>หัวข้อ</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={255}
              />
            </div>

            <div className="form-group-post">
              <label>เนื้อหา</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                maxLength={255}
              ></textarea>
            </div>
            <div className="form-group-post">
              <label className="file-label-post">
                <input
                  multiple
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="file-input-hidden-post"
                />
                เลือกรูปภาพ
              </label>
            </div>

            <div className="image-preview-container-post">
              {images.length > 0 && (
                <div>
                  <h3>รูปภาพที่เลือก</h3>
                  <ul>
                    {images.map((image, index) => (
                      <li key={index}>
                        <img
                          src={URL.createObjectURL(image)}
                          alt={image.name}
                          style={{ width: 100, height: 100 }}
                        />
                        <button
                          type="button"
                          className="delpre"
                          onClick={() => removeImage(image.name)}
                        >
                          ลบ
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              type="submit"
              style={{
                cursor: startProcessLoad ? "not-allowed" : "pointer",
              }}
              disabled={startProcessLoad}
              className="submit-btn-post"
            >
              {startProcessLoad ? (
                <span className="dot-loading">
                  <span className="dot one">●</span>
                  <span className="dot two">●</span>
                  <span className="dot three">● </span>
                </span>
              ) : (
                "สร้างโพสต์"
              )}
            </button>
            <button
              type="button"
              className="cancel-btn"
              style={{
                cursor: startProcessLoad ? "not-allowed" : "pointer",
              }}
              disabled={startProcessLoad}
              onClick={() => {
                setShowPostForm(false);
                setTitle("");
                setContent("");
                setImages([]);
              }}
            >
              ยกเลิก
            </button>
          </form>
        )}
      </div>
    </>
  );
};

export default CreatePost;
