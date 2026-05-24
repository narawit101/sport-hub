import React from "react";
import Contact from "@/components/shared/ContactUs";

export const metadata = {
  title: "ติดต่อเรา - Sport Hub",
  description: "มีข้อสงสัยหรือต้องการความช่วยเหลือ? ติดต่อทีมงาน Sport Hub ได้ตลอดเวลา",
};

export default function page() {
  return (
    <div>
      <Contact></Contact>
    </div>
  );
}
