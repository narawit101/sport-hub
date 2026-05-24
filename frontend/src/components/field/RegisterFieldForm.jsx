"use client";
import React, { useEffect } from "react";
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

export default function RegisterFieldForm() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { notify } = useNotification();

  const {
    sports, subFields, otherChecked, setOtherChecked, otherFacility, setOtherFacility,
    dataLoading, startProcessLoad, showPreview, setShowPreview, facilities, selectedFacilities,
    banks, loadingBanks, fieldData, setFieldData, handleFieldChange, handleEditorChange,
    handleCheckboxChange, handlePriceChange, handleimgChange, handleFileChange,
    handleOtherFacilityConfirm, handleFacilityChange, handleFacilityImageChange,
    handleRemoveFacilityImage, handleFacilityPriceChange, handleFacilityQuantityChange,
    handleFacilityDescription, addSubField, removeSubField, updateSubField,
    addAddOn, updateAddOn, removeAddOn, handleAccountTypeChange, handlePreview, handleSubmit
  } = useFieldRegistration(user, notify);

  usePreventLeave(startProcessLoad);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
    } else if (user?.status !== USER_STATUS.VERIFIED) {
      router.replace("/verification");
    }
  }, [user, authLoading, router]);

  if (dataLoading || authLoading) return <div className="load"><span className="spinner"></span></div>;

  return (
    <>
      <div className="field-register-contianer">
        <div className="heder">
          <h1 className="field-register">ลงทะเบียนสนามกีฬา</h1>
        </div>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <VenueBasicInfo
            fieldData={fieldData}
            handleFieldChange={handleFieldChange}
            setFieldData={setFieldData}
            notify={notify}
          />
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
          <MediaUpload
            fieldData={fieldData}
            handleimgChange={handleimgChange}
            handleFileChange={handleFileChange}
          />
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
          <VenueDescription
            fieldData={fieldData}
            handleEditorChange={handleEditorChange}
          />
          <button
            className="submitbtn-regisfield preview-btn"
            style={{ cursor: startProcessLoad ? "not-allowed" : "pointer" }}
            disabled={startProcessLoad}
            type="button"
            onClick={handlePreview}
          >
            ตรวจสอบข้อมูล
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
