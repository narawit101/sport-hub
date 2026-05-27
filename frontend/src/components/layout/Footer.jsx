"use client";
import React from "react";
import "@/app/css/footer.css";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook, faLine, faTwitter, faInstagram } from "@fortawesome/free-brands-svg-icons";
import { useAuth } from "@/app/contexts/AuthContext";

export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section brand-section">
          {/* <img
            src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1750926494/logo2_jxtkqq.png"
            alt="Sport-Hub Logo"
            className="footer-logo"
          /> */}
          <div className="footer-section links-section">
            <h4>
              Online Sports Venue Booking Platform
            </h4>
            <p className="footer-desc">แพลตฟอร์มจองสนามกีฬาออนไลน์ที่สะดวกและรวดเร็วที่สุด ค้นหาสนามที่ถูกใจและจองได้ทันที</p>
            {/* <div className="social-links">
            <a href="#" aria-label="Facebook"><FontAwesomeIcon icon={faFacebook} /></a>
            <a href="#" aria-label="LINE"><FontAwesomeIcon icon={faLine} /></a>
            <a href="#" aria-label="Instagram"><FontAwesomeIcon icon={faInstagram} /></a>
            <a href="#" aria-label="Twitter"><FontAwesomeIcon icon={faTwitter} /></a>
          </div> */}
          </div>
        </div>

        <div className="footer-section links-section">
          <h4>เมนูด่วน</h4>
          <ul>
            <li><Link href="/">หน้าแรก</Link></li>
            <li><Link href="/search">ค้นหาสนาม</Link></li>
            <li><Link href="/contact">ติดต่อเรา</Link></li>
          </ul>
        </div>

        <div className="footer-section links-section">
          <h4>สำหรับผู้ใช้</h4>
          <ul>
            {!user && (
              <>
                <li><Link href="/login">เข้าสู่ระบบ</Link></li>
                <li><Link href="/register">สมัครสมาชิก</Link></li>
              </>
            )}

            <li><Link href="/register-field">ลงทะเบียนสนาม</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} แพลตฟอร์มจองสนามกีฬาออนไลน์. All Rights Reserved.
      </div>
    </footer>
  );
}
