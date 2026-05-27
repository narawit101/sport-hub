"use client";
import React, { useEffect, useMemo } from "react";
import "@/app/css/register-field-form.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";
import { useNotification } from "@/app/contexts/NotificationContext";
import { USER_STATUS } from "@/constants/status";
import { useFieldRegistration } from "@/app/hooks/useFieldRegistration";

import VenueBasicInfo from "./register/VenueBasicInfo";
import VenueDescription from "./register/VenueDescription";
import SubFieldForm from "./register/SubFieldForm";
import FacilitiesForm from "./register/FacilitiesForm";
import MediaUpload from "./register/MediaUpload";
import AccountInfo from "./register/AccountInfo";
import RegistrationPreview from "./register/RegistrationPreview";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapLocationDot,
  faFutbol,
  faImages,
  faWallet,
  faConciergeBell,
  faFileLines
} from "@fortawesome/free-solid-svg-icons";

const STEPS = [
  { label: "ข้อมูลสนาม", icon: <FontAwesomeIcon icon={faMapLocationDot} /> },
  { label: "สนามย่อย", icon: <FontAwesomeIcon icon={faFutbol} /> },
  { label: "รูปภาพ", icon: <FontAwesomeIcon icon={faImages} /> },
  { label: "การเงิน", icon: <FontAwesomeIcon icon={faWallet} /> },
  { label: "สิ่งอำนวยฯ", icon: <FontAwesomeIcon icon={faConciergeBell} /> },
  { label: "รายละเอียด", icon: <FontAwesomeIcon icon={faFileLines} /> },
];

export default function RegisterFieldForm() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { notify } = useNotification();

  const {
    sports,
    subFields,
    otherChecked,
    setOtherChecked,
    otherFacility,
    setOtherFacility,
    dataLoading,
    startProcessLoad,
    showPreview,
    setShowPreview,
    facilities,
    selectedFacilities,
    banks,
    loadingBanks,
    fieldData,
    setFieldData,
    handleFieldChange,
    handleEditorChange,
    handleCheckboxChange,
    handlePriceChange,
    handleimgChange,
    handleFileChange,
    handleOtherFacilityConfirm,
    handleFacilityChange,
    handleFacilityImageChange,
    handleRemoveFacilityImage,
    handleFacilityPriceChange,
    handleFacilityQuantityChange,
    handleFacilityDescription,
    addSubField,
    removeSubField,
    updateSubField,
    addAddOn,
    updateAddOn,
    removeAddOn,
    handleAccountTypeChange,
    handlePreview,
    handleSubmit,
  } = useFieldRegistration(user, notify);

  usePreventLeave(startProcessLoad);

  // Helper to determine the status of each step dynamically
  const stepStatuses = useMemo(() => {
    // Step 1: ข้อมูลสนาม
    const isStep0Done =
      fieldData.field_name &&
      fieldData.address &&
      fieldData.gps_location &&
      fieldData.open_hours &&
      fieldData.close_hours &&
      fieldData.slot_duration &&
      fieldData.open_days?.length > 0;

    // Step 2: สนามย่อย
    const isStep1Done = subFields.length > 0;

    // Step 3: รูปภาพ
    const isStep2Done = fieldData.imgPreview || (fieldData.documents && fieldData.documents.length > 0);

    // Step 4: การเงิน
    const isStep3Done =
      fieldData.account_type &&
      fieldData.name_bank &&
      fieldData.number_bank &&
      fieldData.account_holder;

    // Step 5: สิ่งอำนวยฯ (Optional - considered done if interacted or previous steps are done)
    const isStep4Done = Object.keys(selectedFacilities || {}).length > 0;

    // Step 6: รายละเอียด
    const isStep5Done = fieldData.field_description && fieldData.field_description.replace(/<[^>]*>?/gm, '').trim().length > 0;

    // Calculate maximum active step index based on sequential completion
    let activeIndex = 0;
    if (isStep0Done) activeIndex = 1;
    if (isStep0Done && isStep1Done) activeIndex = 2;
    if (isStep0Done && isStep1Done && isStep2Done) activeIndex = 3;
    if (isStep0Done && isStep1Done && isStep2Done && isStep3Done) activeIndex = 4;
    if (isStep0Done && isStep1Done && isStep2Done && isStep3Done && isStep4Done) activeIndex = 5;
    if (isStep0Done && isStep1Done && isStep2Done && isStep3Done && isStep5Done) activeIndex = 5;

    // Optional: if step 5 is complete, mark all as done
    if (isStep0Done && isStep1Done && isStep2Done && isStep3Done && isStep5Done) {
       activeIndex = 6; // All steps done
    }

    // Return array of classes
    return STEPS.map((_, idx) => {
      if (idx < activeIndex) return "done"; // Completed step
      if (idx === activeIndex) return "active"; // Current active
      return ""; // Default (gray line/icon)
    });
  }, [fieldData, subFields, selectedFacilities]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
    } else if (user?.status !== USER_STATUS.VERIFIED) {
      router.replace("/verification");
    }
  }, [user, authLoading, router]);

  if (dataLoading || authLoading)
    return (
      <div className="load">
        <span className="spinner"></span>
      </div>
    );

  return (
    <>
      <div className="field-register-contianer">
        {/* ── Page Header ── */}
        <div className="rf-page-header">
          <h1 className="rf-page-title">ลงทะเบียนสนามกีฬา</h1>
          <p className="rf-page-subtitle">
            กรอกข้อมูลสนามของคุณให้ครบถ้วน เพื่อให้ลูกค้าค้นหาพบได้ง่ายขึ้น
          </p>
        </div>

        {/* ── Step Progress Bar ── */}
        <div className="rf-steps" aria-label="ขั้นตอนการลงทะเบียน">
          {STEPS.map((step, idx) => (
            <div key={idx} className={`rf-step ${stepStatuses[idx] || ""}`.trim()}>
              <div className="rf-step-num">{step.icon}</div>
              <span className="rf-step-label">{step.label}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          {/* ── Section 1: ข้อมูลสนามกีฬา ── */}
          <div className="rf-section-card">
            <div className="rf-section-header">
              <div className="rf-section-icon">
                <FontAwesomeIcon icon={faMapLocationDot} />
              </div>
              <div>
                <h2 className="rf-section-title">ข้อมูลสนามกีฬา</h2>
                <p className="rf-section-desc">
                  ชื่อ ที่ตั้ง พิกัด GPS และเวลาเปิด-ปิด
                </p>
              </div>
            </div>
            <div className="rf-section-body">
              <VenueBasicInfo
                fieldData={fieldData}
                handleFieldChange={handleFieldChange}
                setFieldData={setFieldData}
                notify={notify}
              />
            </div>
          </div>

          {/* ── Section 2: สนามย่อย ── */}
          <div className="rf-section-card">
            <div className="rf-section-header">
              <div className="rf-section-icon">
                <FontAwesomeIcon icon={faFutbol} />
              </div>
              <div>
                <h2 className="rf-section-title">สนามย่อย</h2>
                <p className="rf-section-desc">
                  เพิ่มสนามย่อย ราคา ประเภทกีฬา และกิจกรรมเพิ่มเติม
                </p>
              </div>
            </div>
            <div className="rf-section-body">
              <SubFieldForm
                subFields={subFields}
                sports={sports}
                updateSubField={updateSubField}
                addSubField={addSubField}
                removeSubField={removeSubField}
                addAddOn={addAddOn}
                updateAddOn={updateAddOn}
                removeAddOn={removeAddOn}
                notify={notify}
              />
            </div>
          </div>

          {/* ── Section 3: สื่อและเอกสาร ── */}
          <div className="rf-section-card">
            <div className="rf-section-header">
              <div className="rf-section-icon">
                <FontAwesomeIcon icon={faImages} />
              </div>
              <div>
                <h2 className="rf-section-title">รูปโปรไฟล์สนาม & เอกสาร</h2>
                <p className="rf-section-desc">
                  อัปโหลดรูปสนาม และเอกสารประกอบ (สูงสุด 10 ไฟล์)
                </p>
              </div>
            </div>
            <div className="rf-section-body">
              <MediaUpload
                fieldData={fieldData}
                handleimgChange={handleimgChange}
                handleFileChange={handleFileChange}
              />
            </div>
          </div>

          {/* ── Section 4: ข้อมูลบัญชีและการเงิน ── */}
          <div className="rf-section-card">
            <div className="rf-section-header">
              <div className="rf-section-icon">
                <FontAwesomeIcon icon={faWallet} />
              </div>
              <div>
                <h2 className="rf-section-title">ข้อมูลบัญชีและการเงิน</h2>
                <p className="rf-section-desc">
                  บัญชีธนาคาร / พร้อมเพย์ และนโยบายค่ามัดจำ
                </p>
              </div>
            </div>
            <div className="rf-section-body">
              <AccountInfo
                fieldData={fieldData}
                banks={banks}
                handleAccountTypeChange={handleAccountTypeChange}
                handleFieldChange={handleFieldChange}
                setFieldData={setFieldData}
                handleCheckboxChange={handleCheckboxChange}
                handlePriceChange={handlePriceChange}
                loadingBanks={loadingBanks}
                notify={notify}
              />
            </div>
          </div>

          {/* ── Section 5: สิ่งอำนวยความสะดวก ── */}
          <div className="rf-section-card">
            <div className="rf-section-header">
              <div className="rf-section-icon">
                <FontAwesomeIcon icon={faConciergeBell} />
              </div>
              <div>
                <h2 className="rf-section-title">สิ่งอำนวยความสะดวก</h2>
                <p className="rf-section-desc">
                  เลือกสิ่งอำนวยความสะดวกที่มีในสนาม
                </p>
              </div>
            </div>
            <div className="rf-section-body">
              <FacilitiesForm
                facilities={facilities}
                selectedFacilities={selectedFacilities}
                handleFacilityChange={handleFacilityChange}
                handleFacilityPriceChange={handleFacilityPriceChange}
                handleFacilityQuantityChange={handleFacilityQuantityChange}
                handleFacilityDescription={handleFacilityDescription}
                handleFacilityImageChange={handleFacilityImageChange}
                handleRemoveFacilityImage={handleRemoveFacilityImage}
                otherChecked={otherChecked}
                setOtherChecked={setOtherChecked}
                otherFacility={otherFacility}
                setOtherFacility={setOtherFacility}
                handleOtherFacilityConfirm={handleOtherFacilityConfirm}
                startProcessLoad={startProcessLoad}
                notify={notify}
              />
            </div>
          </div>

          {/* ── Section 6: รายละเอียดและคำแนะนำ ── */}
          <div className="rf-section-card">
            <div className="rf-section-header">
              <div className="rf-section-icon">
                <FontAwesomeIcon icon={faFileLines} />
              </div>
              <div>
                <h2 className="rf-section-title">รายละเอียดและคำแนะนำ</h2>
                <p className="rf-section-desc">
                  อธิบายสนาม กฎ และข้อมูลที่เป็นประโยชน์สำหรับผู้จอง
                </p>
              </div>
            </div>
            <div className="rf-section-body">
              <VenueDescription
                fieldData={fieldData}
                handleEditorChange={handleEditorChange}
              />
            </div>
          </div>

          {/* ── Submit / Preview Button ── */}
          <button
            className="submitbtn-regisfield preview-btn"
            style={{ cursor: startProcessLoad ? "not-allowed" : "pointer" }}
            disabled={startProcessLoad}
            type="button"
            onClick={handlePreview}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="white"
              viewBox="0 0 24 24"
            >
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
            </svg>
            ตรวจสอบข้อมูลก่อนลงทะเบียน
          </button>
        </form>
      </div>

      <RegistrationPreview
        showPreview={showPreview}
        setShowPreview={setShowPreview}
        fieldData={fieldData}
        subFields={subFields}
        selectedFacilities={selectedFacilities}
        sports={sports}
        handleSubmit={handleSubmit}
        startProcessLoad={startProcessLoad}
      />
    </>
  );
}
