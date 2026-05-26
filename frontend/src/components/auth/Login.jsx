"use client";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import "@/app/css/login.css";
import { useAuth } from "@/app/contexts/AuthContext";
import { useNotification } from "@/app/contexts/NotificationContext";
import Link from "next/link";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";
import apiClient from "@/lib/apiClient";

export default function Login() {
  const { user, setUser, isLoading, login } = useAuth();
  const { notify } = useNotification();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  usePreventLeave(startProcessLoad);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(redirect);
    }
  }, [user, isLoading, redirect]);

  useEffect(() => {
    const msg = sessionStorage.getItem("login_message");
    if (msg) {
      notify(msg, "error");
      sessionStorage.removeItem("login_message");
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    SetstartProcessLoad(true);
    try {
      const { token } = await apiClient.post("/login", formData);
      login(token);

      const userData = await apiClient.get("/users/me");
      notify("เข้าสู่ระบบสำเร็จ", "success");
      setUser(userData);
      router.push(redirect);
    } catch (error) {
      console.error("Error:", error);
      notify(error.message || "เกิดข้อผิดพลาดระหว่างเข้าสู่ระบบ", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
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
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h2 className="login-title">เข้าสู่ระบบ</h2>
      </div>

      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="identifier">ชื่อผู้ใช้หรืออีเมล</label>
          <input
            maxLength={100}
            type="text"
            id="identifier"
            name="identifier"
            placeholder="กรอกชื่อผู้ใช้หรืออีเมลของคุณ"
            value={formData.identifier}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">รหัสผ่าน</label>
          <div className="password-wrapper-login">
            <input
              maxLength={100}
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              placeholder="กรอกรหัสผ่านของคุณ"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="toggle-password-btn-login"
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
        </div>

        <button
          className="login-button"
          type="submit"
          disabled={startProcessLoad}
        >
          {startProcessLoad ? (
            <span className="dot-loading">
              <span className="dot one">●</span>
              <span className="dot two">●</span>
              <span className="dot three">●</span>
            </span>
          ) : (
            "เข้าสู่ระบบ"
          )}
        </button>

        <div className="reset-password">
          <Link href="/reset-password" className="reset-link">
            ลืมรหัสผ่าน
          </Link>
          <Link href="/register" className="register-link">
            ลงทะเบียนสมาชิกใหม่
          </Link>
        </div>
      </form>
    </div>
  );
}
