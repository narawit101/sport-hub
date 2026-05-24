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
  const fieldPerPage = 16;
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
      (category) => category.sport_id === e.target.value
    );
    setSelectedSportName(sport ? sport?.sport_name : "");
  };

  return (
    <>
      <div className="container-home">
        <div className="section-title-container">
          <h2 className="section-title-home">สนามที่แนะนำ</h2>
          <div className="parent-select-home">
            <div className="title-center-home">
              <h2>ค้นหาเวลาว่าง</h2>
            </div>
            <div className="filter-center-home">
              <div className="filter-date-home">
                <label>
                  <input
                    type="date"
                    name="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>
              </div>
              <label>
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
              </label>
            </div>
          </div>

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
        <FieldGrid
          fields={currentField}
          loading={dataLoading}
          mode="home"
          onCardClick={(field) => router.push(`/profile/${field.field_id}`)}
        />
        {!dataLoading && currentField.length === 0 && (
          <div className="no-fields-message">
            ยังไม่มีสนาม <strong>{selectedSportName}</strong>
          </div>
        )}
      </div>
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
          )
        )}
      </div>
    </>
  );
}

