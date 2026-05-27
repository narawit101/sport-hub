"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "@/app/css/home-page.css";
import { useAuth } from "@/app/contexts/AuthContext";
import { useNotification } from "@/app/contexts/NotificationContext";
import FieldCard from "@/components/field/FieldCard";
import FieldGrid from "@/components/shared/FieldGrid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar as solidStar,
  faStarHalfAlt,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as regularStar } from "@fortawesome/free-regular-svg-icons";
import apiClient from "@/lib/apiClient";

import { USER_STATUS } from "@/constants/status";

export default function HomePage() {
  const router = useRouter();
  const { notify } = useNotification();
  const [selectedSport, setSelectedSport] = useState("");
  const [approvedFields, setApprovedFields] = useState([]);
  const [selectedSportName, setSelectedSportName] = useState("");
  const [sportsCategories, setSportsCategories] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const fieldPerPage = 4;
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      if (user?.status !== USER_STATUS.VERIFIED) {
        router.push("/verification");
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchSportsCategories = async () => {
      setDataLoading(true);
      try {
        const data = await apiClient.get("/sports_types/preview/type");
        setSportsCategories(data);
      } catch (error) {
        console.error("Error fetching sports categories:", error);
        notify(error.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
      } finally {
        setDataLoading(false);
      }
    };

    fetchSportsCategories();
  }, []);

  useEffect(() => {
    const fetchApprovedFields = async () => {
      setDataLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedSport) queryParams.append("sport_id", selectedSport);
        if (date) queryParams.append("date", date);
        if (time) queryParams.append("time", time);

        const queryString = queryParams.toString();
        const endpoint = `/sports_types/preview${queryString ? "?" + queryString : ""}`;
        const data = await apiClient.get(endpoint);
        setApprovedFields(data);
      } catch (error) {
        console.error("Error fetching approved fields:", error);
        notify(error.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
      } finally {
        setDataLoading(false);
      }
    };

    fetchApprovedFields();
  }, [selectedSport, date, time]);

  const indexOfLast = currentPage * fieldPerPage;
  const indexOfFirst = indexOfLast - fieldPerPage;
  const currentField = approvedFields.slice(indexOfFirst, indexOfLast);

  const handleSportChange = (e) => {
    setSelectedSport(e.target.value);
    const sport = sportsCategories.find(
      (category) => category.sport_id === e.target.value,
    );
    setSelectedSportName(sport ? sport?.sport_name : "");
  };

  return (
    <>
      <div className="container-home">
        <div className="search-filter-section">
          <div className="filter-header-block">
            <h2 className="section-title-home">สนามที่แนะนำ</h2>
            <p className="section-subtitle-home">
              ค้นหาสนามกีฬา วันที่เล่น และเวลาว่างที่ตอบโจทย์กิจกรรมของคุณ
            </p>
          </div>

          <div className="filter-card-home">
            <div className="filter-grid-home">
              {/* Category Selector */}
              <div className="filter-input-group-home">
                <label>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="5 3 19 3 19 6 5 6" />
                    <path d="M5 6v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6" />
                  </svg>
                  <span>ประเภทกีฬา</span>
                </label>
                <div className="select-wrapper-home">
                  <select
                    value={selectedSport}
                    onChange={handleSportChange}
                    className="sport-select-main"
                  >
                    <option value="">สนามกีฬาทั้งหมด</option>
                    {sportsCategories.map((category) => (
                      <option key={category.sport_id} value={category.sport_id}>
                        {category.sport_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date Picker */}
              <div className="filter-input-group-home">
                <label>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>วันที่เล่น</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="date-input-main"
                />
              </div>

              {/* Time Select */}
              <div className="filter-input-group-home">
                <label>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>เวลาว่าง</span>
                </label>
                <div className="select-wrapper-home">
                  <select
                    className="select-time-home"
                    name="open_hours"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  >
                    <option value="">-- เลือกเวลา --</option>
                    {Array.from({ length: 48 }, (_, i) => {
                      const hours = String(Math.floor(i / 2)).padStart(2, "0");
                      const minutes = i % 2 === 0 ? "00" : "30";
                      const timeValue = `${hours}:${minutes}`;
                      return (
                        <option key={timeValue} value={timeValue}>
                          {timeValue}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>

            {(selectedSport || date || time) && (
              <div className="clear-filters-wrapper-home">
                <button
                  type="button"
                  className="clear-filters-btn-home"
                  onClick={() => {
                    setSelectedSport("");
                    setSelectedSportName("");
                    setDate("");
                    setTime("");
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>ล้างตัวกรองทั้งหมด</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <FieldGrid
          fields={currentField}
          loading={dataLoading}
          mode="home"
          onCardClick={(field) => router.push(`/profile/${field.field_id}`)}
        />

        {!dataLoading && currentField.length === 0 && (
          <div className="no-fields-message">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: "8px", verticalAlign: "middle" }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>
              ยังไม่มีสนาม{" "}
              {selectedSportName ? (
                <strong>{selectedSportName}</strong>
              ) : (
                "ในระบบ"
              )}{" "}
              ที่ตรงกับวันเวลาดังกล่าว
            </span>
          </div>
        )}
        {approvedFields.length > fieldPerPage && (
          <div className="pagination-previwe-field-home">
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
