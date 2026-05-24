import React from "react";
import HomePage from "@/components/home/Home";
import "@/app/css/home-page.css";

export const metadata = {
  title: "Sport Hub - แพลตฟอร์มจองสนามกีฬาออนไลน์",
  description: "ค้นหาและจองสนามฟุตบอล บาสเกตบอล แบดมินตัน และอื่นๆ สะดวก รวดเร็ว พร้อมชำระเงินออนไลน์",
};

export default function page() {
  return (
    <div>
      <HomePage></HomePage>
    </div>
  );
}
