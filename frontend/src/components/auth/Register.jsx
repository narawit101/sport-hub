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

  const [errors, setErrors] = useState({
    user_name: "",
    first_name: "",
    last_name: "",
    email: "",
    passwordMatch: "",
    passwordLength: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (value.trim() !== "") {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
    }

    if (name === "password" || name === "confirmPassword") {
      const updatedPassword = name === "password" ? value : formData.password;
      const updatedConfirmPassword =
        name === "confirmPassword" ? value : formData.confirmPassword;

      if (updatedPassword.length < 10) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          passwordLength: "*รหัสผ่านต้องมีอย่างน้อย 10 ตัวอักษร",
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          passwordLength: "",
        }));
      }

      if (updatedPassword !== updatedConfirmPassword) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          passwordMatch: "*รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน",
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          passwordMatch: "",
        }));
      }
    }
    const allowDomain = ["@gmail.com", "@hotmail.com", "@rmuti.ac.th"];
    if (name === "email" && value.length > 0) {
      if (!allowDomain.some((domain) => value.endsWith(domain))) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          email:
            "*โดเมนที่ใช้ได้ ได้แก่ @gmail.com, @hotmail.com, @rmuti.ac.th",
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          email: "",
        }));
      }
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (name === "password" && value.length > 0) {
      if (!passwordRegex.test(formData.password)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password:
            "*รหัสผ่านต้องประกอบด้วยตัวอักษรพิมพ์ใหญ่[A-Z], พิมพ์เล็ก[a-z], ตัวเลข[0-9] และอักขระพิเศษ[!@#$%^&*] ความยาว 10 ตัวอักษร",
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: "",
        }));
      }
    }
    if (name === "user_name" && value.length > 0) {
      const userNameRegex = /^[a-zA-Z0-9_]+$/;
      if (!userNameRegex.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          user_name:
            "*ชื่อผู้ใช้สามารถมีได้เฉพาะภาษาอังกฤษ, ตัวเลข และขีดล่าง(_)",
        }));
      }
    }
    if (name === "user_name" || name === "email") {
      clearTimeout(window.checkDuplicateTimeout);
      window.checkDuplicateTimeout = setTimeout(async () => {
        try {
          const data = await apiClient.get(
            `/register/check-duplicate?field=${name}&value=${value}`
          );
          if (data.isDuplicate) {
            setErrors((prevErrors) => ({
              ...prevErrors,
              [name]: `${
                name === "user_name" ? "*ชื่อผู้ใช้" : "*อีเมล"
              } นี้ถูกใช้แล้ว`,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};

    Object.keys(formData).forEach((field) => {
      if (formData[field].trim() === "") {
        newErrors[field] = "*กรุณากรอกข้อมูลในช่องนี้";
      }
    });
    if (formData.user_name && !/^[a-zA-Z0-9_]+$/.test(formData.user_name)) {
      newErrors.user_name =
        "*ชื่อผู้ใช้สามารถมีได้เฉพาะภาษาอังกฤษ, ตัวเลข และขีดล่าง(_)";
    }

    if (formData.password.length < 10) {
      newErrors.passwordLength = "*รหัสผ่านต้องมีอย่างน้อย 10 ตัวอักษร";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.passwordMatch = "*รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน";
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

    if (!passwordRegex.test(formData.password)) {
      newErrors.password =
        "*รหัสผ่านต้องประกอบด้วยตัวอักษรพิมพ์ใหญ่[A-Z], พิมพ์เล็ก[a-z], ตัวเลข[0-9] และอักขระพิเศษ[!@#$%^&*] ความยาว 10 ตัวอักษร";
    }

    const allowDomain = ["@gmail.com", "@hotmail.com", "@rmuti.ac.th"];
    if (!allowDomain.some((domain) => formData.email.endsWith(domain))) {
      newErrors.email =
        "*โดเมนที่ใช้ได้ ได้แก่ @gmail.com, @hotmail.com, @rmuti.ac.th";
    }

    if (!newErrors.user_name && !newErrors.email) {
      SetstartProcessLoad(true);
      try {
        const [userNameData, emailData] = await Promise.all([
          apiClient.get(`/register/check-duplicate?field=user_name&value=${formData.user_name}`),
          apiClient.get(`/register/check-duplicate?field=email&value=${formData.email}`),
        ]);

        if (userNameData.isDuplicate) {
          newErrors.user_name = "*ชื่อผู้ใช้ซ้ำ";
        }

        if (emailData.isDuplicate) {
          newErrors.email = "*อีเมลซ้ำ";
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
      setErrors({
        user_name: "",
        first_name: "",
        last_name: "",
        email: "",
        passwordMatch: "",
        passwordLength: "",
      });
    } catch (error) {
      notify(error.message || "เกิดข้อผิดพลาดระหว่างการลงทะเบียน", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  return (
    <div className="register-container">
      <h2 className="register-head">ลงทะเบียน</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group-register">
          <label>ชื่อผู้ใช้:</label>
          <input
            maxLength={20}
            type="text"
            name="user_name"
            value={formData.user_name}
            onChange={handleChange}
            className={errors.user_name ? "errors" : ""}
          />
          {errors.user_name && (
            <p className="error-message">
              <i className="fas fa-exclamation-circle"></i> {errors.user_name}
            </p>
          )}
        </div>

        <div className="input-group-register">
          <label>อีเมล:</label>
          <input
            maxLength={100}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? "errors" : ""}
          />
          {errors.email && (
            <p className="error-message">
              <i className="fas fa-exclamation-circle"></i> {errors.email}
            </p>
          )}
        </div>
        <div className="input-group-register">
          <label>ชื่อจริง:</label>
          <input
            maxLength={100}
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className={errors.first_name ? "errors" : ""}
          />
          {errors.first_name && (
            <p className="error-message">
              <i className="fas fa-exclamation-circle"></i> {errors.first_name}
            </p>
          )}
        </div>

        <div className="input-group-register">
          <label>นามสกุล:</label>
          <input
            maxLength={100}
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className={errors.last_name ? "errors" : ""}
          />
          {errors.last_name && (
            <p className="error-message">
              <i className="fas fa-exclamation-circle"></i> {errors.last_name}
            </p>
          )}
        </div>

        <div className="input-group-register">
          <label>รหัสผ่าน:</label>
          <div className="password-wrapper-register">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.passwordLength ? "errors" : ""}
            />
            <button
              type="button"
              className="toggle-password-btn-register"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "ซ่อน" : "แสดง"}
            </button>
          </div>
          {errors.passwordLength && (
            <p className="error-message">
              <i className="fas fa-exclamation-circle"></i>{" "}
              {errors.passwordLength}
            </p>
          )}
          {errors.password && (
            <p className="error-message">{errors.password}</p>
          )}
        </div>

        <div className="input-group-register">
          <label>ยืนยันรหัสผ่าน:</label>
          <div className="password-wrapper-register">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.passwordMatch ? "errors" : ""}
            />
            <button
              type="button"
              className="toggle-password-btn-register"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? "ซ่อน" : "แสดง"}
            </button>
          </div>
          {errors.passwordMatch && (
            <p className="error-message">
              <i className="fas fa-exclamation-circle"></i>{" "}
              {errors.passwordMatch}
            </p>
          )}
          {errors.password && (
            <p className="error-message">{errors.password}</p>
          )}
        </div>

        <button
          className="register-button"
          style={{
            cursor: startProcessLoad ? "not-allowed" : "pointer",
          }}
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
            "ลงทะเบียน"
          )}
        </button>
        <div className="login-title">
          <Link href="/login" className="login-link">
            หรือคุณมีบัญชีอยู่แล้ว เข้าสู่ระบบ
          </Link>
        </div>
      </form>
    </div>
  );
}
