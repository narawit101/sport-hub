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
import Pagination from "@/components/ui/Pagination";

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
  const sportTypePerPage = 8;
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
        `/sports_types/delete/${SportTypeToDelete}`,
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
        { sport_name: newSportName },
      );

      if (data.error) {
        notify(data.error, "error");
        return;
      }

      setSports(
        sports.map((sport) =>
          sport.sport_id === editSport.sport_id
            ? { ...sport, sport_name: newSportName }
            : sport,
        ),
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

  if (isLoading) return <LoadingSpinner mode="full" />;

  return (
    <div>
      <div className="fac-container-admin">
        <div className="input-group-admin">
          <h1 className="add-sport-title">ประเภทกีฬาทั้งหมด</h1>

          <div className="addsportcon-admin">
            <button
              className="addsport-admin"
              type="button"
              onClick={() => setShowNewSportInput(true)}
            >
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
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              เพิ่มประเภทกีฬาใหม่
            </button>
          </div>
        </div>

        {dataLoading && <LoadingSpinner mode="inline" />}

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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path>
                    </svg>
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    ลบ
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-sport-type">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              <span>ไม่พบข้อมูลประเภทกีฬา</span>
            </div>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(sports.length / sportTypePerPage)}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Add Sport Type Overlay Modal */}
      {showNewSportInput && (
        <div className="edit-modal-type">
          <div className="modal-content-type">
            <h3>เพิ่มประเภทกีฬาใหม่</h3>
            <input
              type="text"
              maxLength={50}
              placeholder="ชื่อประเภทกีฬา"
              value={newSport}
              onChange={(e) => setNewSport(e.target.value)}
              autoFocus
            />
            <div className="modal-actions-tpye">
              <button
                className="confirmbtn-type"
                style={{
                  cursor: startProcessLoad ? "not-allowed" : "pointer",
                }}
                disabled={startProcessLoad}
                type="button"
                onClick={addType}
              >
                {startProcessLoad ? <LoadingSpinner mode="dots" /> : "บันทึก"}
              </button>
              <button
                className="cancelbtn-type"
                style={{
                  cursor: startProcessLoad ? "not-allowed" : "pointer",
                }}
                disabled={startProcessLoad}
                type="button"
                onClick={() => {
                  setShowNewSportInput(false);
                  setNewSport("");
                }}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sport Type Overlay Modal */}
      {showEditModal && (
        <div className="edit-modal-type">
          <div className="modal-content-type">
            <h3>แก้ไขประเภทกีฬา</h3>
            <input
              type="text"
              maxLength={50}
              value={newSportName}
              onChange={(e) => setNewSportName(e.target.value)}
              placeholder="ชื่อประเภทกีฬา"
              autoFocus
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
                onClick={() => {
                  setShowEditModal(false);
                  setNewSportName("");
                  setEditSport(null);
                }}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmModal && (
        <div className="confirm-modal-type">
          <div className="modal-content-type">
            <div
              style={{
                color: "var(--danger-color)",
                marginBottom: "20px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="56"
                height="56"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
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
                  "ยืนยันการลบ"
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
  );
}
