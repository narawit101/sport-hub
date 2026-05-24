"use client";
import React, { useEffect, useState } from "react";
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
  const [editingField, setEditingField] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [updatedValue, setUpdatedValue] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

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
      await apiClient.put(`/users/update-profile/${currentUser.user_id}`, updatedUser);

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
    setEditingField(null);
  };
  const startEditing = (user_profile) => {
    setEditingField(user_profile);
  };
  const MAX_FILE_SIZE = 8 * 1024 * 1024;
  const handleImgChange = (e) => {
    const file = e.target.files[0];
    if (file.size > MAX_FILE_SIZE) {
      notify("ไฟล์รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 8MB)", "error");
      e.target.value = null;
      return;
    }

    if (file.type.startsWith("image/")) {
      setSelectedFile(file);
      setUpdatedValue(file.name);
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
        formData
      );

      notify("อัปโหลดรูปสำเร็จ", "success");
      setEditingField(null);
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setCurrentUser((prev) => ({
        ...prev,
        user_profile: result.user_profile,
      }));
      console.log("Updated user profile:", result.user_profile);
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
        <h2 className="head-edit-profile">ข้อมูลของคุณ</h2>
        {editingField === "user_profile" ? (
          <div className="container-user-profile">
            <div className="preview-container-user-profile">
              {previewUrl && <img src={previewUrl} alt="preview" />}
            </div>
            <div>
              <div>
                <div className="file-input-edit-profile">
                  <label className="user-profile-image-label">
                    <input
                      style={{ display: "none" }}
                      type="file"
                      onChange={handleImgChange}
                      accept="image/*"
                    />
                    เลือกรูปภาพ
                  </label>
                </div>
              </div>
              <div className="btn-group-edit-profile">
                <button
                  className="savebtn-edit-profile"
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  onClick={saveImageField}
                >
                  {startProcessLoad ? (
                    <span className="dot-loading">
                      <span className="dot one">●</span>
                      <span className="dot two">●</span>
                      <span className="dot three">●</span>
                    </span>
                  ) : (
                    "บันทึก"
                  )}
                </button>
                <button
                  className="canbtn-edit-profile"
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  onClick={cancelEditing}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="container-user-profile">
            <img
              src={`${currentUser?.user_profile
                  ? currentUser.user_profile
                  : "https://res.cloudinary.com/dlwfuul9o/image/upload/v1755157542/qlementine-icons--user-24_zre8k9.png"
                }`}
              alt="รุปโปรไฟล์"
              className="preview-container-user-profile"
            />
            <div className="btn-group-edit-profile">
              <button
                style={{
                  cursor: startProcessLoad ? "not-allowed" : "pointer",
                }}
                disabled={startProcessLoad}
                className="editbtn-editfield-profile"
                onClick={() =>
                  startEditing("user_profile", currentUser?.user_profile)
                }
              >
                แก้ไขรูปโปรไฟล์
              </button>
            </div>
          </div>
        )}
        <form onSubmit={handleUpdateProfile} className="editprofile-form">
          <div className="edit-f-l-name-row">
            <div className="name-fields-container">
              <div className="name-field-group">
                <label className="edit-profile-title-first-last_name">
                  ชื่อ:
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={updatedUser.first_name}
                  onChange={(e) =>
                    setUpdatedUser({
                      ...updatedUser,
                      first_name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="name-field-group">
                <label className="edit-profile-title-first-last_name">
                  นามสกุล:
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={updatedUser.last_name}
                  onChange={(e) =>
                    setUpdatedUser({
                      ...updatedUser,
                      last_name: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="buttons-container">
              <button
                type="submit"
                className="save-btn-edit-profile"
                style={{
                  cursor: startProcessLoad ? "not-allowed" : "pointer",
                }}
                disabled={startProcessLoad}
              >
                {startProcessLoad ? (
                  <span className="dot-loading">
                    <span className="dot one">●</span>
                    <span className="dot two">●</span>
                    <span className="dot three">●</span>
                  </span>
                ) : (
                  "บันทึกข้อมูล"
                )}
              </button>
              <Link href="/change-password" className="change-password-link">
                เปลี่ยนรหัสผ่าน
              </Link>
            </div>
          </div>
        </form>
        <div className="user-info">
          <div className="info-row">
            <p>
              <img
                width={20}
                height={20}
                style={{
                  marginRight: 8,
                  verticalAlign: "middle",
                }}
                src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755157542/qlementine-icons--user-24_zre8k9.png"
                alt=""
              />
              <strong>ชื่อผู้ใช้:</strong> {currentUser?.user_name}
            </p>
            <p>
              <img
                width={20}
                height={20}
                style={{
                  marginRight: 8,
                  verticalAlign: "middle",
                }}
                src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757077456/ic--outline-email_n4x6hb.png"
                alt=""
              />
              <strong>อีเมล:</strong> {currentUser?.email}
            </p>
          </div>
          <div className="info-row">
            <p>
              <img
                width={20}
                height={20}
                style={{
                  marginRight: 8,
                  verticalAlign: "middle",
                }}
                src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757081428/eos-icons--role-binding-outlined_ps5xfm.png"
                alt=""
              />
              <strong>ประเภทบัญชี:</strong>
              {currentUser?.role === USER_ROLE.ADMIN ? (
                <strong className="user-role-editprofile">ผู้ดูแลระบบ</strong>
              ) : currentUser?.role === USER_ROLE.CUSTOMER ? (
                <strong className="user-role-editprofile">ลูกค้า</strong>
              ) : currentUser?.role === USER_ROLE.FIELD_OWNER ? (
                <strong className="user-role-editprofile">
                  เจ้าของสนามกีฬา
                </strong>
              ) : (
                "ไม่ทราบบทบาท"
              )}
            </p>
            <p>
              <img
                width={20}
                height={20}
                style={{
                  marginRight: 8,
                  verticalAlign: "middle",
                }}
                //
                src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757081429/material-symbols-light--verified-outline_ug65kg.png"
                alt=""
              />
              <strong>สถานะบัญชี:</strong>
              <strong
                className={`status-text-manager ${currentUser?.status === USER_STATUS.PENDING
                    ? "pending"
                    : currentUser?.status === USER_STATUS.VERIFIED
                      ? "approved"
                      : "unknown"
                  }`}
              >
                {currentUser?.status}
              </strong>
            </p>
          </div>
          <div className="info-row">
            <p>
              <img
                width={20}
                height={20}
                style={{
                  marginRight: 8,
                  verticalAlign: "middle",
                }}
                src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757081573/icon-park-outline--log_buq556.png"
                alt=""
              />
              <strong>วันที่สมัคร:</strong>{" "}
              {formatDateToThai(currentUser?.created_at, "ไม่ทราบวันที่")}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
