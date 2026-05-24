import React, { Suspense } from "react";
import Login from "@/components/auth/Login";
import "@/app/css/login.css";

export const metadata = {
  title: "เข้าสู่ระบบ - Sport Hub",
  description: "เข้าสู่ระบบบัญชีผู้ใช้ Sport Hub เพื่อจองสนามกีฬาออนไลน์",
};

export default function page() {
  return (
    <Suspense fallback={<div></div>}>
      <Login />
    </Suspense>
  );
}
