import React from 'react'
import Category from "@/components/admin/SportType"
import "@/app/css/sport-type-page.css"

export const metadata = {
  title: "ประเภทกีฬา - Sport Hub",
  description: "เลือกประเภทกีฬาที่คุณต้องการเล่น ไม่ว่าจะเป็นฟุตบอล แบดมินตัน เทนนิส หรือบาสเกตบอล",
};

export default function page() {
  return (
    <div>
      <div className="containercategory">
      <Category></Category>
      </div>
    </div>
  )
}
