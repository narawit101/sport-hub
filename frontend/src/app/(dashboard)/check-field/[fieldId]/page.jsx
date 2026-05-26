"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import "@/app/css/check-field.css";
import "@/app/css/field-profile.css";
import { useAuth } from "@/app/contexts/AuthContext";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";
import { formatPrice, daysInThai } from "@/app/utils/format";
import apiClient from "@/lib/apiClient";
import { useNotification } from "@/app/contexts/NotificationContext";
import { FIELD_STATUS, USER_STATUS, USER_ROLE } from "@/constants/status";
import FieldHeader from "@/components/field/FieldHeader";
import FieldManagementLayout from "@/components/field/shared/FieldManagementLayout";

const StatusChangeModal = ({
  newStatus,
  onConfirm,
  onClose,
  reasoning,
  setReasoning,
  startProcessLoad,
}) => (
  <div className="confirm-modal-check-field">
    <div className="modal-content-check-field">
      <div className="newstatus">
        คุณแน่ใจว่าจะเปลี่ยนสถานะเป็น:
        <h2
          className={`newstatus-text ${
            newStatus === FIELD_STATUS.VERIFIED
              ? "status-approve"
              : newStatus === FIELD_STATUS.REJECTED
                ? "status-reject"
                : "status-pending"
          }`}
        >
          {newStatus} ?
        </h2>
      </div>
      {newStatus === FIELD_STATUS.REJECTED && (
        <div className="resoning-check-field">
          <textarea
            placeholder="กรุณาใส่เหตุผลที่ไม่ผ่านการอนุมัติ"
            required
            disabled={startProcessLoad}
            maxLength={500}
            value={reasoning}
            onChange={(e) => {
              setReasoning(e.target.value);
            }}
          />
        </div>
      )}
      <div className="modal-actions-check-field">
        <button
          style={{
            cursor: startProcessLoad ? "not-allowed" : "pointer",
          }}
          disabled={startProcessLoad}
          className="confirmbtn"
          onClick={onConfirm}
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
          className="cancelbtn"
          onClick={onClose}
        >
          ยกเลิก
        </button>
      </div>
    </div>
  </div>
);

export default function CheckFieldDetail() {
  const { fieldId } = useParams();
  const { notify } = useNotification();
  const [fieldData, setFieldData] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const { user, isLoading } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  const [reasoning, setReasoning] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const router = useRouter();
  usePreventLeave(startProcessLoad);

  const dayCodes = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const handleCloseLightbox = () => {
    setSelectedImage(null);
  };

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/login");
    }

    if (user?.status !== USER_STATUS.VERIFIED) {
      router.push("/verification");
    }

    if (
      user?.role !== USER_ROLE.ADMIN &&
      user?.role !== USER_ROLE.FIELD_OWNER
    ) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchFieldData = async () => {
      if (!fieldId) return;
      try {
        const data = await apiClient.get(`/field/${fieldId}`);
        setFieldData(data);
      } catch (error) {
        console.error("Error fetching field data:", error);
        notify("เกิดข้อผิดพลาดในการดึงข้อมูลสนามกีฬา", "error");
        router.push("/");
      } finally {
        setDataLoading(false);
      }
    };

    fetchFieldData();
  }, [fieldId, router, notify]);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const data = await apiClient.get(`/facilities/${fieldId}`);
        setFacilities(data.data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchFacilities();
  }, [fieldId]);

  const openConfirmModal = (status) => {
    setReasoning("");
    setNewStatus(status);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setReasoning("");
  };

  const updateFieldStatus = async (fieldId, newStatus) => {
    if (newStatus === FIELD_STATUS.REJECTED && reasoning.length === 0) {
      notify("กรุณาเลือกเหตุผลการปฏิเสธ", "error");
      return;
    }
    SetstartProcessLoad(true);
    try {
      await apiClient.put(`/field/update-status/${fieldId}`, {
        status: newStatus,
        reasoning: reasoning,
      });

      setFieldData({ ...fieldData, status: newStatus });
      notify(
        `อัพเดทสถานะเป็น: ${newStatus}`,
        newStatus === FIELD_STATUS.VERIFIED ? "success" : "error",
      );
      closeConfirmModal();
    } catch (error) {
      console.error(" Error updating status:", error);
      notify(error.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      SetstartProcessLoad(false);
      setReasoning("");
    }
  };

  const getGoogleMapsLink = (gpsLocation) => {
    if (!gpsLocation) return "#";
    const cleaned = gpsLocation.replace(/\s+/g, "");
    if (cleaned.startsWith("http")) return cleaned;
    if (/^-?[0-9.]+,-?[0-9.]+$/.test(cleaned)) {
      return `https://www.google.com/maps/search/?api=1&query=${cleaned}`;
    }
    return "#";
  };

  if (dataLoading)
    return (
      <div className="load">
        <span className="spinner"></span>
      </div>
    );

  return (
    <>
      {selectedImage && (
        <div className="lightbox-overlay" onClick={handleCloseLightbox}>
          <img src={selectedImage} alt="Zoomed" className="lightbox-image" />
        </div>
      )}

      <FieldHeader 
        fieldData={fieldData} 
        onImageClick={setSelectedImage} 
      />

      <div className="check-field-detail-container">
        <h1>รายละเอียดสนามกีฬา</h1>
        
        <FieldManagementLayout 
          field={fieldData}
          isEditMode={false}
          facilities={facilities}
          subFields={fieldData?.sub_fields || []}
          dayCodes={dayCodes}
          daysInThai={daysInThai}
          getGoogleMapsLink={getGoogleMapsLink}
          formatPrice={formatPrice}
          notify={notify}
          router={router}
        />

        <div className="status-buttons" style={{ marginTop: '24px' }}>
          {user?.role === USER_ROLE.ADMIN && (
            <>
              {fieldData?.status !== FIELD_STATUS.VERIFIED && (
                <button
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  className="approve-btn"
                  onClick={() => openConfirmModal(FIELD_STATUS.VERIFIED)}
                >
                  ผ่านการอนุมัติ
                </button>
              )}
              {fieldData?.status !== FIELD_STATUS.REJECTED && (
                <button
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  className="reject-btn"
                  onClick={() => openConfirmModal(FIELD_STATUS.REJECTED)}
                >
                  ไม่ผ่านการอนุมัติ
                </button>
              )}
            </>
          )}
        </div>
        {showConfirmModal && (
          <StatusChangeModal
            newStatus={newStatus}
            onConfirm={() => {
              updateFieldStatus(fieldId, newStatus, reasoning);
            }}
            startProcessLoad={startProcessLoad}
            reasoning={reasoning}
            setReasoning={setReasoning}
            onClose={closeConfirmModal}
          />
        )}
      </div>
    </>
  );
}
