import React from "react";
import Register from "@/components/auth/Register";
import "@/app/css/register.css";

export const metadata = {
  title: "สมัครสมาชิก - Sport Hub",
  description: "สมัครสมาชิกบัญชีผู้ใช้ Sport Hub เพื่อรับสิทธิ์จองสนามกีฬาและฟีเจอร์อื่นๆ",
};

export default function page() {
  return (
    <>
      <Register></Register>
    </>
  );
}
