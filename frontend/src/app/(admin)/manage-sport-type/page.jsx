"use client";
import React, { useState, useEffect } from "react";
import "@/app/css/manage-fac-type.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { useNotification } from "@/app/contexts/NotificationContext";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import apiClient from "@/lib/apiClient";
import { USER_STATUS, USER_ROLE } from "@/constants/status";

export default function RegisterFieldForm() {
  const router = useRouter("");
  const { notify } = useNotification();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sports, setSports] = useState([]);
  const [editSport, setEditSport] = useState(null);
  const [newSportName, setNewSportName] = useState("");
  const [SportTypeToDelete, setSportTypeToDelete] = useState(null);
  const [showNewSportInput, setShowNewSportInput] = useState(false);
  const [newSport, setNewSport] = useState("");
  const { user, isLoading } = useAuth();
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const sportTypePerPage = 4;
  usePreventLeave(startProcessLoad);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
    }

    if (user?.status !== USER_STATUS.VERIFIED) {
      router.replace("/verification");
    }

    if (user?.role !== USER_ROLE.ADMIN) {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchSports = async () => {
      setDataLoading(true);
      try {
        const data = await apiClient.get("/sports_types");
        setSports(data);
      } catch (err) {
        console.error("Error fetching sports:", err);
        notify(err.message || "ไม่สามารถโหลดประเภทกีฬาได้", "error");
      } finally {
        setDataLoading(false);
      }
    };

    fetchSports();
  }, [notify]);

  const indexOfLast = currentPage * sportTypePerPage;
  const indexOfFirst = indexOfLast - sportTypePerPage;
  const currentsportType = sports.slice(indexOfFirst, indexOfLast);

  const addType = async () => {
    if (!newSport.trim()) return;
    SetstartProcessLoad(true);
    try {
      const data = await apiClient.post("/sports_types/add", {
        sport_name: newSport,
      });

      if (data.error) {
        notify(data.error, "error");
        return;
      }

      setSports([...sports, data]);
      setNewSport("");
      setShowNewSportInput(false);
      notify("เพิ่มประเภทกีฬาสำเร็จ", "success");
    } catch (err) {
      console.error("Fetch error:", err);
      notify(err.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const deleteSportType = async () => {
    if (!SportTypeToDelete) return;
    SetstartProcessLoad(true);
    try {
      const data = await apiClient.delete(
        `/sports_types/delete/${SportTypeToDelete}`
      );

      if (data.error) {
        console.error("Error:", data.error);
        notify(data.error, "error");
        return;
      }
      setSports(sports.filter((sport) => sport.sport_id !== SportTypeToDelete));
      setShowConfirmModal(false);
      notify("ลบประเภทกีฬาสำเร็จ", "success");
    } catch (err) {
      console.error("Fetch error:", err);
      notify(err.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const editSportType = async () => {
    if (!newSportName.trim()) return;
    SetstartProcessLoad(true);
    try {
      const data = await apiClient.put(
        `/sports_types/update/${editSport.sport_id}`,
        { sport_name: newSportName }
      );

      if (data.error) {
        notify(data.error, "error");
        return;
      }

      setSports(
        sports.map((sport) =>
          sport.sport_id === editSport.sport_id
            ? { ...sport, sport_name: newSportName }
            : sport
        )
      );
      setEditSport(null);
      setNewSportName("");
      setShowEditModal(false);
      notify("แก้ไขประเภทกีฬาสำเร็จ", "success");
    } catch (err) {
      console.error("Fetch error:", err);
      notify(err.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  if (isLoading)
    return <LoadingSpinner mode="full" />;

  return (
    <div>
      <div className="fac-container-admin">
        <div className="input-group-admin">
          <label className="add-sport-title">ประเภทกีฬาทั้งหมด</label>

          <div className="addsportcon-admin">
            {!showNewSportInput ? (
              <button
                className="addsport-admin"
                type="button"
                onClick={() => setShowNewSportInput(true)}
              >
                + เพิ่มประเภทกีฬาใหม่
              </button>
            ) : (
              <div className="add-sport-form">
                <input
                  type="text"
                  maxLength={50}
                  placeholder="ชื่อประเภทกีฬา"
                  value={newSport}
                  onChange={(e) => setNewSport(e.target.value)}
                />
                <div className="form-actions-admin">
                  <button
                    className="savebtn-admin"
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    type="button"
                    onClick={addType}
                  >
                    {startProcessLoad ? (
                      <LoadingSpinner mode="dots" />
                    ) : (
                      "บันทึก"
                    )}
                  </button>
                  <button
                    className="cancelbtn-admin"
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    type="button"
                    onClick={() => setShowNewSportInput(false)}
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            )}
          </div>
          {dataLoading && <LoadingSpinner mode="inline" />}
          {showEditModal && (
            <div className="edit-modal-type">
              <div className="modal-content-type">
                <input
                  type="text"
                  maxLength={50}
                  value={newSportName}
                  onChange={(e) => setNewSportName(e.target.value)}
                  placeholder="แก้ไขชื่อประเภทกีฬา"
                />
                <div className="modal-actions-tpye">
                  <button
                    className="confirmbtn-type"
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    onClick={editSportType}
                  >
                    {startProcessLoad ? (
                      <LoadingSpinner mode="dots" />
                    ) : (
                      "บันทึกการแก้ไข"
                    )}
                  </button>
                  <button
                    className="cancelbtn-type"
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    onClick={() => setShowEditModal(false)}
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="typecon-admin">
          {currentsportType.length > 0 ? (
            currentsportType.map((sport) => (
              <div key={sport.sport_id} className="typename-admin">
                <div className="sportname-admin">{sport.sport_name}</div>
                <div className="button-group-add">
                  <button
                    className="editbtn-admin"
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    type="button"
                    onClick={() => {
                      setEditSport(sport);
                      setNewSportName(sport.sport_name);
                      setShowEditModal(true);
                    }}
                  >
                    แก้ไข
                  </button>
                  <button
                    className="deletebtn-admin"
                    type="button"
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    onClick={() => {
                      setSportTypeToDelete(sport.sport_id);
                      setShowConfirmModal(true);
                    }}
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="no-sport-type">ไม่พบข้อมูล</p>
          )}
        </div>
        <div className="pagination-facilities">
          {Array.from(
            { length: Math.ceil(sports.length / sportTypePerPage) },
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
        {showConfirmModal && (
          <div className="confirm-modal-type">
            <div className="modal-content-type">
              <p>คุณแน่ใจหรือไม่ว่าต้องการลบประเภทกีฬานี้?</p>
              <div className="modal-actions-type">
                <button
                  className="confirmbtn-type"
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  onClick={deleteSportType}
                >
                  {startProcessLoad ? (
                    <LoadingSpinner mode="dots" />
                  ) : (
                    "ยืนยัน"
                  )}
                </button>
                <button
                  className="cancelbtn-type"
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  onClick={() => setShowConfirmModal(false)}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
