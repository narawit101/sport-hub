"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import apiClient from "@/lib/apiClient";
import { useNotification } from "@/app/contexts/NotificationContext";
import "@/app/css/search-field.css";
import FieldCard from "@/components/field/FieldCard";
import FieldGrid from "@/components/shared/FieldGrid";
import { USER_STATUS } from "@/constants/status";
export default function Search() {
  const router = useRouter();
  const { notify } = useNotification();
  const searchParams = useSearchParams();
  const query = searchParams.get("query");
  const [approvedFields, setApprovedFields] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const fieldPerPage = 4;

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      if (user?.status !== USER_STATUS.VERIFIED) {
        router.push("/verification");
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!query) {
      setApprovedFields([]);
      setDataLoading(false);
      return;
    }

    const dayMapThaiToEng = {
      จันทร์: "Mon",
      อังคาร: "Tue",
      พุธ: "Wed",
      พฤหัสบดี: "Thu",
      ศุกร์: "Fri",
      เสาร์: "Sat",
      อาทิตย์: "Sun",
    };

    const translatedQuery = dayMapThaiToEng[query?.trim()] || query;

    const fetchApprovedFields = async () => {
      setDataLoading(true);
      try {
        console.log("query", query);
        console.log("query days", translatedQuery);
        const data = await apiClient.get(
          `/search?query=${encodeURIComponent(translatedQuery)}`,
        );

        setApprovedFields(data.data);
        console.log("approvefield", data);
      } catch (error) {
        console.error("Error fetching approved fields:", error);
        notify(error.message || "ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", "error");
      } finally {
        setDataLoading(false);
      }
    };

    fetchApprovedFields();
  }, [query, notify]);

  const indexOfLast = currentPage * fieldPerPage;
  const indexOfFirst = indexOfLast - fieldPerPage;
  const currentField = approvedFields.slice(indexOfFirst, indexOfLast);

  const [inputValue, setInputValue] = useState(query || "");

  useEffect(() => {
    setInputValue(query || "");
  }, [query]);

  const handlePageSearch = () => {
    if (inputValue.trim()) {
      router.push(`/search?query=${encodeURIComponent(inputValue.trim())}`);
    } else {
      notify("กรุณาพิมพ์คำค้นหา", "error");
    }
  };

  return (
    <>
      <div className="container-search">
        <div className="search-bar-on-page-wrapper">
          <div className="search-input-group-modern">
            <input
              type="text"
              placeholder="ค้นหาชื่อสนาม, ประเภทกีฬา, จังหวัด..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePageSearch()}
              className="page-search-input"
            />
            <button className="page-search-btn" onClick={handlePageSearch}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span>ค้นหา</span>
            </button>
          </div>
        </div>

        <div className="topbar-serach">
          {approvedFields.length > 0 && !dataLoading && query && (
            <div className="find-fields-message-search">
              พบสนามกีฬา {approvedFields.length} แห่งที่ตรงกับการค้นหา
              <span className="query-text-highlight"> "{query}"</span>
            </div>
          )}
        </div>

        {query ? (
          <>
            <FieldGrid
              fields={currentField}
              loading={dataLoading}
              mode="search"
              onCardClick={(field) => router.push(`/profile/${field.field_id}`)}
            />
            {!dataLoading && approvedFields.length === 0 && (
              <div className="no-results-container-search">
                <div className="no-results-icon-search">🔍</div>
                <div className="no-results-message-search">
                  <h3>ไม่พบผลการค้นหา</h3>
                  <p>
                    ไม่พบสนามกีฬาที่ตรงกับ{" "}
                    <span className="query-highlight-search">"{query}"</span>
                  </p>
                  <div className="search-suggestions-search">
                    <p>ลองค้นหาด้วยคำอื่น เช่น:</p>
                    <ul>
                      <li>ชื่อสนามกีฬา</li>
                      <li>ประเภทกีฬา (ฟุตบอล, บาสเกตบอล)</li>
                      <li>วันที่เปิดให้บริการ (จันทร์, อังคาร)</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-search-guidance">
            <h2>ค้นหาสนามกีฬาที่คุณต้องการ</h2>
            <p>พิมพ์ข้อมูลที่ช่องค้นหาด้านบนเพื่อเริ่มต้นค้นหา</p>
            <div className="quick-tips">
              <div className="tip-item">
                <strong>ชื่อสนามกีฬา</strong>
                <span>ระบุชื่อสนามที่ต้องการค้นหาโดยตรง</span>
              </div>
              <div className="tip-item">
                <strong>ประเภทกีฬา</strong>
                <span>เช่น ฟุตบอล, แบดมินตัน, วอลเลย์บอล</span>
              </div>
              <div className="tip-item">
                <strong>สถานที่และที่อยู่</strong>
                <span>พิมพ์ชื่อเขต, จังหวัด หรือที่ตั้งสนาม</span>
              </div>
              <div className="tip-item">
                <strong>รายละเอียดอื่นๆ</strong>
                <span>ค้นหาจาก พื้นผิวสนาม (หญ้าเทียม) หรือวันเปิดบริการ</span>
              </div>
            </div>
          </div>
        )}

        {approvedFields.length > fieldPerPage && (
          <div className="pagination-previwe-field-search">
            {Array.from(
              { length: Math.ceil(approvedFields.length / fieldPerPage) },
              (_, i) => (
                <button
                  key={i}
                  className={currentPage === i + 1 ? "active" : ""}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ),
            )}
          </div>
        )}
      </div>
    </>
  );
}
