"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "@/app/css/my-field.css";
import { useAuth } from "@/app/contexts/AuthContext";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";
import apiClient from "@/lib/apiClient";
import { useNotification } from "@/app/contexts/NotificationContext";
import { USER_STATUS, FIELD_STATUS, USER_ROLE } from "@/constants/status";
import FieldGrid from "@/components/shared/FieldGrid";

export default function MyFieldPage() {
  const router = useRouter();
  const { notify } = useNotification();
  const [myFields, setMyFields] = useState([]);
  const [filteredFields, setFilteredFields] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fieldIdToDelete, setFieldIdToDelete] = useState(null);
  const [fieldNameToDelete, setFieldNameToDelete] = useState("");
  const [confirmInput, setConfirmInput] = useState("");
  const { user, isLoading } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const fieldPerPage = 20;
  usePreventLeave(startProcessLoad);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
    }

    if (user?.status !== USER_STATUS.VERIFIED) {
      router.replace("/verification");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchMyFields = async () => {
      try {
        const data = await apiClient.get("/myfield/myfields");
        setMyFields(data);
        setFilteredFields(data);
      } catch (err) {
        notify(err.message, "error");
      } finally {
        setDataLoading(false);
      }
    };

    fetchMyFields();
  }, [notify]);

  const indexOfLast = currentPage * fieldPerPage;
  const indexOfFirst = indexOfLast - fieldPerPage;
  const currentField = filteredFields.slice(indexOfFirst, indexOfLast);

  useEffect(() => {
    setDataLoading(true);
    try {
      if (statusFilter === "ทั้งหมด") {
        setFilteredFields(myFields);
      } else {
        setFilteredFields(
          myFields.filter((field) => field.status === statusFilter)
        );
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error filtering fields:", error);
      notify("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
      setFilteredFields([]);
    } finally {
      setDataLoading(false);
    }
  }, [statusFilter, myFields, notify]);

  const handleDeleteField = (field_id, field_name) => {
    setFieldIdToDelete(field_id);
    setFieldNameToDelete(field_name || "");
    setConfirmInput("");
    setShowDeleteModal(true);
  };

  const confirmDeleteSubField = async () => {
    try {
      SetstartProcessLoad(true);
      await apiClient.delete(`/field/delete/field/${fieldIdToDelete}`);

      setMyFields(
        myFields.filter((field) => field.field_id !== fieldIdToDelete)
      );
      setFilteredFields(
        filteredFields.filter((field) => field.field_id !== fieldIdToDelete)
      );
      setShowDeleteModal(false);
      notify("ลบสนามเรียบร้อยแล้ว", "success");
    } catch (error) {
      console.error("Error deleting field:", error);
      notify(error.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
      if (error.message && !error.message.includes("เชื่อมต่อ")) {
        setTimeout(() => {
          router.replace("contact");
        }, 3000);
      }
    } finally {
      SetstartProcessLoad(false);
    }
  };

  if (isLoading)
    return (
      <div className="load">
        <span className="spinner"></span>
      </div>
    );

  return (
    <>
      <div className="myfield-container">
        <div className="field-section-title-container">
          {user?.role === USER_ROLE.ADMIN ? (
            <h2 className="field-section-title">สนามทั้งหมด</h2>
          ) : (
            <h2 className="field-section-title">สนามของฉัน</h2>
          )}
          <select
            onChange={(e) => setStatusFilter(e.target.value)}
            value={statusFilter}
            className="sport-select-myfield"
          >
            <option value="ทั้งหมด">ทั้งหมด</option>
            <option value={FIELD_STATUS.VERIFIED}>{FIELD_STATUS.VERIFIED}</option>
            <option value={FIELD_STATUS.PENDING}>{FIELD_STATUS.PENDING}</option>
            <option value={FIELD_STATUS.REJECTED}>{FIELD_STATUS.REJECTED}</option>
          </select>
        </div>
        <FieldGrid
          fields={currentField}
          loading={dataLoading}
          mode="myfield"
          onDelete={handleDeleteField}
        />
        {!dataLoading && filteredFields.length === 0 && (
          <div className="custom-no-fields-message-myfield">
            {myFields.length === 0 ? (
              <>
                <p>คุณยังไม่มีสนามกีฬาในระบบ</p>
                <button
                  onClick={() => router.push("/register-field")}
                  className="register-field-btn-myfield"
                >
                  ลงทะเบียนสนามตอนนี้
                </button>
              </>
            ) : (
              <p>ไม่มีสนามที่ตรงกับสถานะที่เลือก</p>
            )}
          </div>
        )}
        {showDeleteModal && (
          <div className="modal-overlay-myfield">
            <div className="modal-myfield">
              <h3>ยืนยันการลบสนาม</h3>
              <p className="confirm-delete-text">
                พิมพ์ชื่อสนาม <strong>{fieldNameToDelete}</strong>{" "}
                เพื่อยืนยันการลบ
                <br />
                การลบนี้ไม่สามารถย้อนกลับได้ รวมถึงข้อมูลการจองและข้อมูลอื่น ๆ
                ของสนามกีฬา
              </p>
              <div className="input-confirmdelete-myfield">
                <input
                  type="text"
                  placeholder={fieldNameToDelete}
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  className="confirm-delete-input"
                />
                {/* {fieldNameToDelete &&
                  confirmInput &&
                  confirmInput.trim() !== fieldNameToDelete && (
                    <div className="confirm-delete-error">ชื่อสนามไม่ตรง</div>
                  )} */}
              </div>
              <div className="modal-actions-myfield">
                <button
                  style={{
                    cursor:
                      (fieldNameToDelete &&
                        confirmInput.trim() !== fieldNameToDelete) ||
                      startProcessLoad
                        ? "not-allowed"
                        : "pointer",
                  }}
                  disabled={
                    startProcessLoad ||
                    (fieldNameToDelete &&
                      confirmInput.trim() !== fieldNameToDelete)
                  }
                  className="savebtn-myfield"
                  onClick={confirmDeleteSubField}
                >
                  {startProcessLoad ? (
                    <span className="dot-loading">
                      <span className="dot one">●</span>
                      <span className="dot two">●</span>
                      <span className="dot three">●</span>
                    </span>
                  ) : (
                    "ยืนยัน"
                  )}
                </button>
                <button
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  className="canbtn-myfield"
                  onClick={() => setShowDeleteModal(false)}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="pagination-myfield">
        {Array.from(
          { length: Math.ceil(filteredFields.length / fieldPerPage) },
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
