"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import "@/app/css/edit-profile.css";
import { useAuth } from "@/app/contexts/AuthContext";
import Link from "next/link";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";
import { formatDateToThai } from "@/app/utils/format";
import apiClient from "@/lib/apiClient";
import { useNotification } from "@/app/contexts/NotificationContext";
import { USER_STATUS, USER_ROLE } from "@/constants/status";

export default function EditProfile() {
  const { notify } = useNotification();
  const [currentUser, setCurrentUser] = useState(null);
  const [updatedUser, setUpdatedUser] = useState({
    first_name: "",
    last_name: "",
  });
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  usePreventLeave(startProcessLoad);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user?.status !== USER_STATUS.VERIFIED) {
      router.replace("/verification");
    }
    if (user) {
      setCurrentUser(user);
      setUpdatedUser({
        first_name: user?.first_name,
        last_name: user?.last_name,
      });
    } else {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (!updatedUser.first_name.trim() || !updatedUser.last_name.trim()) {
      notify("ไม่สามารถใส่ชื่อหรือนามสกุลที่ว่างเปล่าได้", "error");
      return;
    }
    if (!currentUser || !currentUser.user_id) {
      notify("ไม่พบข้อมูลผู้ใช้", "error");
      return;
    }
    SetstartProcessLoad(true);

    try {
      await apiClient.put(
        `/users/update-profile/${currentUser.user_id}`,
        updatedUser,
      );

      notify("ข้อมูลโปรไฟล์ของคุณถูกอัปเดตแล้ว", "success");
      setCurrentUser((prev) => ({
        ...prev,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
      }));
    } catch (error) {
      console.error("Error updating profile:", error);
      notify(error.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const cancelEditing = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const MAX_FILE_SIZE = 8 * 1024 * 1024;
  const handleImgChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      notify("ไฟล์รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 8MB)", "error");
      e.target.value = null;
      return;
    }

    if (file.type.startsWith("image/")) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      e.target.value = null;
      notify("โปรดเลือกเฉพาะไฟล์รูปภาพเท่านั้น", "error");
    }
  };

  const saveImageField = async () => {
    SetstartProcessLoad(true);
    try {
      if (!selectedFile) {
        notify("กรุณาเลือกไฟล์ก่อนอัปโหลด", "error");
        return;
      }

      const formData = new FormData();
      formData.append("user_profile", selectedFile);
      const result = await apiClient.putForm(
        `/users/update-user-profile/${currentUser.user_id}`,
        formData,
      );

      notify("อัปโหลดรูปสำเร็จ", "success");
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setCurrentUser((prev) => ({
        ...prev,
        user_profile: result.user_profile,
      }));
    } catch (error) {
      console.error("Error saving image field:", error);
      notify(error.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  if (isLoading)
    return (
      <div className="load">
        <span className="spinner"></span>
      </div>
    );

  return (
    <>
      <div className="edit-profile-container">
        <h2 className="head-edit-profile">ข้อมูลส่วนตัวของคุณ</h2>
        
        <div className="profile-grid">
          {/* Left Column: Profile Picture & Status Card */}
          <div className="profile-left-col">
            <div className="avatar-card">
              <div className="avatar-wrapper" onClick={() => fileInputRef.current.click()} title="คลิกเพื่อเปลี่ยนรูปโปรไฟล์">
                <img
                  src={
                    previewUrl ||
                    currentUser?.user_profile ||
                    "https://res.cloudinary.com/dlwfuul9o/image/upload/v1755157542/qlementine-icons--user-24_zre8k9.png"
                  }
                  alt="รูปโปรไฟล์"
                />
                <div className="avatar-hover-overlay">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span>เปลี่ยนรูปภาพ</span>
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleImgChange}
                accept="image/*"
              />

              {previewUrl && (
                <div className="avatar-actions">
                  <button
                    className="save-avatar-btn"
                    onClick={saveImageField}
                    disabled={startProcessLoad}
                    type="button"
                  >
                    {startProcessLoad ? "บันทึก..." : "บันทึกรูปใหม่"}
                  </button>
                  <button
                    className="cancel-avatar-btn"
                    onClick={cancelEditing}
                    disabled={startProcessLoad}
                    type="button"
                  >
                    ยกเลิก
                  </button>
                </div>
              )}

              <div className="profile-badges">
                <span className="badge-role">
                  {currentUser?.role === USER_ROLE.ADMIN
                    ? "ผู้ดูแลระบบ"
                    : currentUser?.role === USER_ROLE.CUSTOMER
                    ? "ลูกค้า"
                    : currentUser?.role === USER_ROLE.FIELD_OWNER
                    ? "เจ้าของสนามกีฬา"
                    : "ไม่ทราบบทบาท"}
                </span>
                <span
                  className={`badge-status ${
                    currentUser?.status === USER_STATUS.VERIFIED ? "approved" : "pending"
                  }`}
                >
                  {currentUser?.status === USER_STATUS.VERIFIED
                    ? "ยืนยันตัวตนแล้ว"
                    : "รอการยืนยัน"}
                </span>
              </div>

              <div className="profile-joined">
                <span>เป็นสมาชิกตั้งแต่:</span>
                <strong>
                  {formatDateToThai(currentUser?.created_at, "ไม่ทราบวันที่")}
                </strong>
              </div>
            </div>
          </div>

          {/* Right Column: Form Editing & Account Details */}
          <div className="profile-right-col">
            <form onSubmit={handleUpdateProfile} className="profile-form">
              <h3 className="section-title">แก้ไขข้อมูลชื่อ-นามสกุล</h3>
              <div className="form-row-2">
                <div className="form-group">
                  <label>ชื่อ:</label>
                  <input
                    type="text"
                    maxLength={100}
                    value={updatedUser.first_name || ""}
                    onChange={(e) =>
                      setUpdatedUser({
                        ...updatedUser,
                        first_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>นามสกุล:</label>
                  <input
                    type="text"
                    maxLength={100}
                    value={updatedUser.last_name || ""}
                    onChange={(e) =>
                      setUpdatedUser({
                        ...updatedUser,
                        last_name: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="save-profile-btn"
                  disabled={startProcessLoad}
                >
                  {startProcessLoad ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                </button>
                <Link href="/change-password" className="pwd-link-btn">
                  เปลี่ยนรหัสผ่าน
                </Link>
              </div>
            </form>

            <div className="account-details-section">
              <h3 className="section-title">ข้อมูลบัญชีผู้ใช้งาน</h3>
              
              <div className="details-grid">
                <div className="detail-item">
                  <div className="detail-icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="detail-content">
                    <span className="detail-label">ชื่อผู้ใช้</span>
                    <span className="detail-value">{currentUser?.user_name}</span>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div className="detail-content">
                    <span className="detail-label">อีเมล</span>
                    <span className="detail-value">{currentUser?.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
