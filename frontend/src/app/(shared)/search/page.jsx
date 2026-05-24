import React, { Suspense } from "react";

import Search from "@/components/search/Search";

export const metadata = {
  title: "ค้นหาสนามกีฬา - Sport Hub",
  description: "ค้นหาสนามกีฬาในพื้นที่ของคุณ เปรียบเทียบราคา สิ่งอำนวยความสะดวก และทำการจองออนไลน์ได้ทันที",
};

export default function page() {
  return (
    <div>
      <Suspense fallback={<div></div>}>
        <Search />
      </Suspense>
    </div>
  );
}
