"use client";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import "@/app/css/register.css";
import { useAuth } from "@/app/contexts/AuthContext";
import { useNotification } from "@/app/contexts/NotificationContext";
import Link from "next/link";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";
import apiClient from "@/lib/apiClient";
import { USER_ROLE } from "@/constants/status";

export default function Register() {
  const { user, isLoading } = useAuth();
  const { notify } = useNotification();
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  const router = useRouter();
  usePreventLeave(startProcessLoad);

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  const [formData, setFormData] = useState({
    user_name: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: USER_ROLE.CUSTOMER,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateField = (name, value, currentFormData) => {
    const allowDomain = ["@gmail.com", "@hotmail.com", "@rmuti.ac.th"];
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    const userNameRegex = /^[a-zA-Z0-9_]+$/;

    switch (name) {
      case "user_name":
        if (!value.trim()) return "*กรุณากรอกชื่อผู้ใช้";
        if (!userNameRegex.test(value)) {
          return "*ชื่อผู้ใช้สามารถมีได้เฉพาะภาษาอังกฤษ, ตัวเลข และขีดล่าง(_)";
        }
        return "";
      case "first_name":
        if (!value.trim()) return "*กรุณากรอกชื่อจริง";
        return "";
      case "last_name":
        if (!value.trim()) return "*กรุณากรอกนามสกุล";
        return "";
      case "email":
        if (!value.trim()) return "*กรุณากรอกอีเมล";
        if (!allowDomain.some((domain) => value.endsWith(domain))) {
          return "*โดเมนที่ใช้ได้ ได้แก่ @gmail.com, @hotmail.com, @rmuti.ac.th";
        }
        return "";
      case "password":
        if (!value) return "*กรุณากรอกรหัสผ่าน";
        if (value.length < 10) return "*รหัสผ่านต้องมีอย่างน้อย 10 ตัวอักษร";
        if (!passwordRegex.test(value)) {
          return "*รหัสผ่านต้องประกอบด้วยตัวอักษรพิมพ์ใหญ่[A-Z], พิมพ์เล็ก[a-z], ตัวเลข[0-9] และอักขระพิเศษ[!@#$%^&*]";
        }
        return "";
      case "confirmPassword":
        if (!value) return "*กรุณายืนยันรหัสผ่าน";
        const pwd = currentFormData
          ? currentFormData.password
          : formData.password;
        if (value !== pwd) return "*รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน";
        return "";
      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };
    setFormData(updatedFormData);

    // Reward early: If field has been touched or has an error, validate on the fly to remove error
    if (errors[name] || touched[name]) {
      const errorMsg = validateField(name, value, updatedFormData);
      setErrors((prev) => ({ ...prev, [name]: errorMsg }));
    }

    // Recalculate confirm password error if password changes
    if (
      name === "password" &&
      (errors.confirmPassword || touched.confirmPassword)
    ) {
      const confirmErrorMsg = validateField(
        "confirmPassword",
        formData.confirmPassword,
        updatedFormData,
      );
      setErrors((prev) => ({ ...prev, confirmPassword: confirmErrorMsg }));
    }

    // Debounced Duplicates checking
    if (name === "user_name" || name === "email") {
      clearTimeout(window.checkDuplicateTimeout);

      const formatError = validateField(name, value, updatedFormData);
      if (formatError) return; // Do not hit db if format validation is already failing

      window.checkDuplicateTimeout = setTimeout(async () => {
        try {
          const data = await apiClient.get(
            `/register/check-duplicate?field=${name}&value=${value}`,
          );
          if (data.isDuplicate) {
            setErrors((prevErrors) => ({
              ...prevErrors,
              [name]: `${name === "user_name" ? "*ชื่อผู้ใช้" : "*อีเมล"}นี้ถูกใช้แล้ว`,
            }));
          } else {
            setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
          }
        } catch (error) {
          console.error("Error checking duplicates:", error);
        }
      }, 500);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    const errorMsg = validateField(name, value, formData);
    setErrors((prev) => ({ ...prev, [name]: errorMsg }));

    // Run duplicate check instantly on blur if format is correct
    if ((name === "user_name" || name === "email") && !errorMsg) {
      clearTimeout(window.checkDuplicateTimeout);
      (async () => {
        try {
          const data = await apiClient.get(
            `/register/check-duplicate?field=${name}&value=${value}`,
          );
          if (data.isDuplicate) {
            setErrors((prevErrors) => ({
              ...prevErrors,
              [name]: `${name === "user_name" ? "*ชื่อผู้ใช้" : "*อีเมล"}นี้ถูกใช้แล้ว`,
            }));
          }
        } catch (error) {
          console.error("Error checking duplicates:", error);
        }
      })();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      user_name: true,
      first_name: true,
      last_name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    let newErrors = {};
    Object.keys(formData).forEach((field) => {
      if (field !== "role") {
        const errorMsg = validateField(field, formData[field], formData);
        if (errorMsg) {
          newErrors[field] = errorMsg;
        }
      }
    });

    // Check duplicates synchronously on submit
    if (!newErrors.user_name && !newErrors.email) {
      SetstartProcessLoad(true);
      try {
        const [userNameData, emailData] = await Promise.all([
          apiClient.get(
            `/register/check-duplicate?field=user_name&value=${formData.user_name}`,
          ),
          apiClient.get(
            `/register/check-duplicate?field=email&value=${formData.email}`,
          ),
        ]);

        if (userNameData.isDuplicate) {
          newErrors.user_name = "*ชื่อผู้ใช้ นี้ถูกใช้แล้ว";
        }

        if (emailData.isDuplicate) {
          newErrors.email = "*อีเมล นี้ถูกใช้แล้ว";
        }
      } catch (error) {
        console.error("Error checking duplicates:", error);
        notify("เกิดข้อผิดพลาดระหว่างการตรวจสอบอีเมล/ชื่อผู้ใช้", "error");
      } finally {
        SetstartProcessLoad(false);
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    SetstartProcessLoad(true);
    try {
      await apiClient.post("/register", formData);

      notify("ลงทะเบียนบัญชีสำเร็จ", "success");
      setTimeout(() => {
        router.push("/login");
      }, 3000);

      setFormData({
        user_name: "",
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: USER_ROLE.CUSTOMER,
      });
      setErrors({});
      setTouched({});
    } catch (error) {
      notify(error.message || "เกิดข้อผิดพลาดระหว่างการลงทะเบียน", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const renderError = (errorMsg) => {
    if (!errorMsg) return null;
    return (
      <p className="error-message">
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
          style={{ marginRight: "5px", flexShrink: 0 }}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{errorMsg}</span>
      </p>
    );
  };

  return (
    <div className="register-container">
      <div className="register-header">
        <div className="header-icon-wrapper">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
        </div>
        <h2 className="register-title">ลงทะเบียน</h2>
        <p className="register-subtitle">
          สร้างบัญชีผู้ใช้งานใหม่เพื่อเข้าใช้บริการ
        </p>
      </div>

      <form onSubmit={handleSubmit} className="register-form">
        <div className="form-group">
          <label>ชื่อผู้ใช้</label>
          <input
            maxLength={20}
            type="text"
            name="user_name"
            placeholder="กรอกชื่อผู้ใช้สำหรับเข้าสู่ระบบ"
            value={formData.user_name}
            onChange={handleChange}
            onBlur={handleBlur}
            className={errors.user_name ? "errors" : ""}
            required
          />
          {renderError(errors.user_name)}
        </div>

        <div className="form-group">
          <label>อีเมล</label>
          <input
            maxLength={100}
            type="email"
            name="email"
            placeholder="กรอกอีเมล เช่น example@mail.com"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={errors.email ? "errors" : ""}
            required
          />
          {renderError(errors.email)}
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label>ชื่อจริง</label>
            <input
              maxLength={100}
              type="text"
              name="first_name"
              placeholder="กรอกชื่อจริง"
              value={formData.first_name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.first_name ? "errors" : ""}
              required
            />
            {renderError(errors.first_name)}
          </div>

          <div className="form-group">
            <label>นามสกุล</label>
            <input
              maxLength={100}
              type="text"
              name="last_name"
              placeholder="กรอกนามสกุล"
              value={formData.last_name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.last_name ? "errors" : ""}
              required
            />
            {renderError(errors.last_name)}
          </div>
        </div>

        <div className="form-group">
          <label>รหัสผ่าน</label>
          <div className="password-wrapper-register">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="ตั้งรหัสผ่านอย่างน้อย 10 ตัวอักษร"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={
                errors.password || errors.passwordLength ? "errors" : ""
              }
              required
            />
            <button
              type="button"
              className="toggle-password-btn-register"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {renderError(errors.passwordLength || errors.password)}
        </div>

        <div className="form-group">
          <label>ยืนยันรหัสผ่าน</label>
          <div className="password-wrapper-register">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="ยืนยันรหัสผ่านอีกครั้ง"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.passwordMatch ? "errors" : ""}
              required
            />
            <button
              type="button"
              className="toggle-password-btn-register"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              title={showConfirmPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            >
              {showConfirmPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {renderError(errors.passwordMatch)}
        </div>

        <button
          className="register-button"
          disabled={startProcessLoad}
          type="submit"
        >
          {startProcessLoad ? (
            <span className="dot-loading">
              <span className="dot one">●</span>
              <span className="dot two">●</span>
              <span className="dot three">●</span>
            </span>
          ) : (
            "ลงทะเบียนบัญชีใหม่"
          )}
        </button>

        <div className="login-title">
          <Link href="/login" className="login-link">
            มีบัญชีสมาชิกอยู่แล้ว? เข้าสู่ระบบ
          </Link>
        </div>
      </form>
    </div>
  );
}
