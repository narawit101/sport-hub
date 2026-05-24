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
  const fieldPerPage = 16;

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
        const data = await apiClient.get(`/search?query=${encodeURIComponent(translatedQuery)}`);

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

  return (
    <>
      <div className="container-search">
        <div className="topbar-serach">
          {approvedFields.length > 0 && !dataLoading && (
            <div className="find-fields-message-search">
              พบทั้งหมด {approvedFields.length} รายการสำหรับ
              <p> "{query || ""}"</p>
            </div>
          )}
        </div>
        <FieldGrid
          fields={currentField}
          loading={dataLoading}
          mode="search"
          onCardClick={(field) => router.push(`/profile/${field.field_id}`)}
        />
        {!dataLoading && currentField.length === 0 && (
          <div className="no-results-container-search">
            <div className="no-results-icon-search">🔍</div>
            <div className="no-results-message-search">
              <h3>ไม่พบผลการค้นหา</h3>
              <p>
                ไม่พบสนามกีฬาที่ตรงกับ <span className="query-highlight-search">"{query}"</span>
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
      </div>
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
          )
        )}
      </div>
    </>
  );
}
