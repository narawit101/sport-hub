import React from "react";
import "@/app/css/footer.css";
import Link from "next/link";

export default function Footer() {
  return (
    <>
      <footer>
        <div className="p">
          &copy; 2025 แพลตฟอร์มจองสนามกีฬาออนไลน์ | All Rights Reserved
        </div>
        {/* <Link
          href="/contact"
          // className={pathname === "/contact" ? "active" : ""}
        >
          ติดต่อผู้ดูแลระบบ
        </Link> */}
      </footer>
    </>
  );
}
