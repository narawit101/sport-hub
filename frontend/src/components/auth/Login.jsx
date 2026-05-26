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
      // เก็บ token ใน localStorage เพื่อใช้เป็น fallback เมื่อ cookie ไม่ติด (เช่น mobile)
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
      <h2>เข้าสู่ระบบ</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group-login">
          <label htmlFor="identifier">ชื่อผู้ใช้หรืออีเมล:</label>
          <input
            maxLength={100}
            type="text"
            id="identifier"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
          />
        </div>
        <div className="input-group-login">
          <label htmlFor="password">รหัสผ่าน:</label>
          <div className="password-wrapper-login">
            <input
              maxLength={100}
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
            />
            <button
              type="button"
              className="toggle-password-btn-login"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "ซ่อน" : "แสดง"}
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
            ลงทะเบียน
          </Link>
        </div>
      </form>
    </div>
  );
}
