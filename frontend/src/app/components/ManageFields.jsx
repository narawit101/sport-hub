"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "@/app/css/my-field.css";
import { useAuth } from "@/app/contexts/AuthContext";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";

export default function MyFieldPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [myFields, setMyFields] = useState([]);
  const [filteredFields, setFilteredFields] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fieldIdToDelete, setFieldIdToDelete] = useState(null);
  const [fieldNameToDelete, setFieldNameToDelete] = useState("");
  const [confirmInput, setConfirmInput] = useState("");
  const { user, isLoading } = useAuth();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
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

    if (user?.status !== "ตรวจสอบแล้ว") {
      router.replace("/verification");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchMyFields = async () => {
      try {
        const res = await fetch(`${API_URL}/myfield/myfields`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "เกิดข้อผิดพลาดในการดึงข้อมูลสนาม");
        }

        setMyFields(data);
        setFilteredFields(data);
      } catch (err) {
        setMessage(`${err.message}`);
        setMessageType("error");
      } finally {
        setDataLoading(false);
      }
    };

    fetchMyFields();
  }, []);

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
      setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
      setMessageType("error");
      setFilteredFields([]);
    } finally {
      setDataLoading(false);
    }
  }, [statusFilter, myFields]);

  const handleDeleteField = (field_id, field_name) => {
    setFieldIdToDelete(field_id);
    setFieldNameToDelete(field_name || "");
    setConfirmInput("");
    setShowDeleteModal(true);
  };

  const confirmDeleteSubField = async () => {
    try {
      SetstartProcessLoad(true);
      const res = await fetch(
        `${API_URL}/field/delete/field/${fieldIdToDelete}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const data = await res.json();

      if (res.ok) {
        setMyFields(
          myFields.filter((field) => field.field_id !== fieldIdToDelete)
        );
        setFilteredFields(
          filteredFields.filter((field) => field.field_id !== fieldIdToDelete)
        );
        setShowDeleteModal(false);
        setMessage("ลบสนามเรียบร้อยแล้ว");
        setMessageType("success");
      } else {
        setMessage(data.message || "เกิดข้อผิดพลาดในการลบสนาม");
        setMessageType("error");
        setShowDeleteModal(false);
        setTimeout(() => {
          setMessage("");
          setMessageType("");
          router.replace("contact");
        }, 3000);
      }
    } catch (error) {
      console.error("Error deleting field:", error);
      setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  if (isLoading)
    return (
      <div className="load">
        <span className="spinner"></span>
      </div>
    );

  return (
    <>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <div className="myfield-container">
        <div className="field-section-title-container">
          {user?.role === "admin" ? (
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
            <option value="ผ่านการอนุมัติ">ผ่านการอนุมัติ</option>
            <option value="รอตรวจสอบ">รอตรวจสอบ</option>
            <option value="ไม่ผ่านการอนุมัติ">ไม่ผ่านการอนุมัติ</option>
          </select>
        </div>
        {dataLoading ? (
          <div className="loading-data">
            <div className="loading-data-spinner"></div>
          </div>
        ) : currentField.length > 0 ? (
          <div className="grid-myfield">
            {currentField.map((field) => (
              <div key={field.field_id} className="card-myfield">
                <button
                  onClick={() =>
                    handleDeleteField(field.field_id, field.field_name)
                  }
                  className="card-delete-btn"
                  title="ลบสนาม"
                >
                  <img
                    src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAR1JREFUSEvNlusRwiAQhG870U5MJ6YStRLTiXZiOjmzGXAQjofJMCO/HDzug7tlCaQwVPUgIhcRORths5sbAPjfSRgqgIeInEoxC3wGcMzF1ADKhQCSOHe6VzcAwaqa3YA/0bozVW0pRaVSyd9r6Tzgnmnkr0nD+CeAodiDPdm/ShQmUlVKkvLcMliWKVxoqYPK2ApIFGcB9jQ8uROtAN7U+FTW3NrYWoliRa2LIilbc8w7ARhrgKvzHx/3V4Db4irc4GdYPaBMWaYtJxhbZEr3pJK6AagW3oUtgGP8NpRsuA+AWb0NO0Kziqx3wzQ7VQ3togsgtAsPsKDhnPl05k4Q+1GLVSQ2wRLnAPFdaLHu5JKVAKXPFQuWeJAPegM03+AZ7kVVEgAAAABJRU5ErkJggg=="
                    alt=""
                    width={15}
                    height={15}
                  />
                </button>

                <img
                  onClick={() => router.push(`/profile/${field.field_id}`)}
                  src={
                    field.img_field
                      ? `${field.img_field}`
                      : "https://www.nstru.ac.th/resources/news/thumbnail/221.jpg"
                  }
                  alt={field.field_name}
                  className="card-myfield-img"
                />
                <h3 className="custom-field-name">{field.field_name}</h3>
                <div className="custom-owner-info-myfield">
                  เจ้าของ: {field.first_name} {field.last_name}
                </div>
                <div
                  className={`custom-owner-info-myfield ${
                    field.status === "ผ่านการอนุมัติ"
                      ? "passed"
                      : field.status === "ไม่ผ่านการอนุมัติ"
                      ? "failed"
                      : "pending"
                  }`}
                >
                  {field.status}
                </div>

                <div className="custom-button-group-myfield">
                  <div className="main-buttons-row">
                    <button
                      onClick={() =>
                        router.push(`/check-field/${field.field_id}`)
                      }
                      className="custom-button-view-myfield"
                    >
                      <img
                        src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755269173/icon-park-outline--doc-detail_rufhhe.png"
                        alt=""
                        width={15}
                        height={15}
                      />
                      ดูรายละเอียด
                    </button>
                    {field.status !== "รอตรวจสอบ" && (
                      <button
                        onClick={() =>
                          router.push(`/edit-field/${field.field_id}`)
                        }
                        className="custom-button-edit-myfield"
                      >
                        <img
                          src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755269214/flowbite--edit-outline_efjgro.png"
                          width={15}
                          height={15}
                          alt=""
                        />
                        แก้ไข
                      </button>
                    )}
                  </div>

                  {field.status == "ผ่านการอนุมัติ" && (
                    <div className="full-width-buttons">
                      <button
                        onClick={() =>
                          router.push(`/my-order/${field.field_id}`)
                        }
                        className="custom-button-view-order-myfield"
                      >
                        <img
                          src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755269241/material-symbols--order-approve-outline-rounded_xgqryx.png"
                          width={15}
                          height={15}
                          alt=""
                        />
                        รายการจองของสนาม
                      </button>
                      <button
                        onClick={() =>
                          router.push(`/statistics/${field.field_id}`)
                        }
                        className="custom-button-view-stat-myfield"
                      >
                        <img
                          src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755269200/akar-icons--statistic-up_w8pkoi.png"
                          width={15}
                          height={15}
                          alt=""
                        />
                        สถิติการจองสนาม
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
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
