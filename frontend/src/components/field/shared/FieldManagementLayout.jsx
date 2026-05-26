"use client";
import React from "react";
import FieldBasicInfo from "./FieldBasicInfo";
import FieldDescription from "./FieldDescription";
import ManageFieldDocuments from "../edit/ManageFieldDocuments";
import ManageFacilities from "../edit/ManageFacilities";
import ManageSubFields from "../edit/ManageSubFields";

export default function FieldManagementLayout({
  field,
  isEditMode = false,
  // States
  facilities = [],
  subFields = [],
  editingField = null,
  updatedValue = "",
  setUpdatedValue = () => {},
  selectedDays = [],
  dayCodes = [],
  daysInThai = {},
  startProcessLoad = false,
  editorContent = "",
  setEditorContent = () => {},
  previewUrl = null,
  sportsCategories = [],
  // Basic Info Handlers
  saveField = () => {},
  cancelEditing = () => {},
  startEditing = () => {},
  handleDayToggle = () => {},
  getGoogleMapsLink = () => "#",
  formatPrice = (v) => v,
  notify = () => {},
  router = null,
  // Documents Handlers
  handleFileChange = () => {},
  saveDocumentField = () => {},
  handleDeleteDocument = () => {},
  handleEditSingleDocument = () => {},
  editingSingleDoc = null,
  singleDocFile = null,
  handleSingleDocFileChange = () => {},
  saveSingleDocument = () => {},
  cancelSingleDocEdit = () => {},
  // Facilities Handlers
  handleEditFacility = () => {},
  handleCancelEditFac = () => {},
  handleSaveEditFacility = () => {},
  handleEditInputChange = () => {},
  handleEditImageChange = () => {},
  handleConfirmDeleteFac = () => {},
  showNewFacilityInput = false,
  handleToggleNewFacility = () => {},
  newFac = [],
  setNewFac = () => {},
  handleNewFacChange = () => {},
  onSaveNewFac = () => {},
  // SubFields Handlers
  updatedSubFieldName = "",
  setUpdatedSubFieldName = () => {},
  updatedPrice = "",
  setUpdatedPrice = () => {},
  updatedSubFieldPlayer = "",
  setUpdatedSubFieldPlayer = () => {},
  updatedSubFieldWid = "",
  setUpdatedSubFieldWid = () => {},
  updatedSubFieldLength = "",
  setUpdatedSubFieldLength = () => {},
  updatedSubFieldFieldSurface = "",
  setUpdatedSubFieldFieldSurface = () => {},
  updatedSportId = "",
  setUpdatedSportId = () => {},
  saveSubField = () => {},
  startEditingSubField = () => {},
  handleDeleteSubFieldClick = () => {},
  showAddSubFieldForm = false,
  setShowAddSubFieldForm = () => {},
  newSubField = {},
  setNewSubField = () => {},
  newSportId = "",
  setNewSportId = () => {},
  addSubField = () => {},
  userId = null,
  showAddOnForm = {},
  setShowAddOnForm = () => {},
  addOnInputs = {},
  setAddOnInputs = () => {},
  handleAddOnInputChange = () => {},
  addAddOn = () => {},
  editingAddon = {},
  setEditingAddon = () => {},
  saveAddon = () => {},
  setSelectedAddOn = () => {},
  setShowDeleteAddOnModal = () => {},
  startEditingAddon = () => {},
  editFacilityData = {},
  editingFacility = null,
  onDeleteAddon = () => {},
  selectedFiles = null,
  // Modals props
  showEditGeneralModal,
  setShowEditGeneralModal,
  editGeneralData,
  setEditGeneralData,
  saveGeneralInfo,
  handleOpenEditGeneral,
  showEditFinancialModal,
  setShowEditFinancialModal,
  editFinancialData,
  setEditFinancialData,
  saveFinancialInfo,
  handleOpenEditFinancial,
}) {
  const currentEditingField = isEditMode ? editingField : null;
  const currentEditingFacility = isEditMode ? editingFacility : null;
  const currentEditingSingleDoc = isEditMode ? editingSingleDoc : null;

  return (
    <>
      <FieldBasicInfo
        field={field}
        isEditMode={isEditMode}
        editingField={currentEditingField}
        updatedValue={updatedValue}
        setUpdatedValue={setUpdatedValue}
        saveField={saveField}
        cancelEditing={cancelEditing}
        startEditing={startEditing}
        startProcessLoad={startProcessLoad}
        selectedDays={selectedDays}
        handleDayToggle={handleDayToggle}
        daysInThai={daysInThai}
        dayCodes={dayCodes}
        router={router}
        getGoogleMapsLink={getGoogleMapsLink}
        notify={notify}
        formatPrice={formatPrice}
        showEditGeneralModal={showEditGeneralModal}
        setShowEditGeneralModal={setShowEditGeneralModal}
        editGeneralData={editGeneralData}
        setEditGeneralData={setEditGeneralData}
        saveGeneralInfo={saveGeneralInfo}
        handleOpenEditGeneral={handleOpenEditGeneral}
        showEditFinancialModal={showEditFinancialModal}
        setShowEditFinancialModal={setShowEditFinancialModal}
        editFinancialData={editFinancialData}
        setEditFinancialData={setEditFinancialData}
        saveFinancialInfo={saveFinancialInfo}
        handleOpenEditFinancial={handleOpenEditFinancial}
      />

      <div className="check-field-secondary-grid">
        <FieldDescription
          field={field}
          isEditMode={isEditMode}
          editingField={currentEditingField}
          editorContent={editorContent}
          handleEditorChange={(content) => {
            if (isEditMode) {
              setUpdatedValue(content);
              setEditorContent(content);
            }
          }}
          saveField={saveField}
          cancelEditing={cancelEditing}
          startEditing={startEditing}
          startProcessLoad={startProcessLoad}
        />

        <ManageFieldDocuments
          field={field}
          isEditMode={isEditMode}
          editingField={currentEditingField}
          startProcessLoad={startProcessLoad}
          handleFileChange={handleFileChange}
          saveDocumentField={saveDocumentField}
          cancelEditing={cancelEditing}
          handleDeleteDocument={handleDeleteDocument}
          handleEditSingleDocument={handleEditSingleDocument}
          editingSingleDoc={currentEditingSingleDoc}
          singleDocFile={singleDocFile}
          handleSingleDocFileChange={handleSingleDocFileChange}
          saveSingleDocument={saveSingleDocument}
          cancelSingleDocEdit={cancelSingleDocEdit}
          startEditing={startEditing}
          selectedFiles={selectedFiles}
        />
      </div>

      <div className="check-field-secondary-grid">
        <ManageFacilities
          fieldId={field?.field_id}
          isEditMode={isEditMode}
          facilities={facilities}
          editingFacility={currentEditingFacility}
          editFacilityData={editFacilityData}
          handleEditFacility={handleEditFacility}
          handleCancelEdit={handleCancelEditFac}
          handleSaveEditFacility={handleSaveEditFacility}
          handleEditInputChange={handleEditInputChange}
          handleEditImageChange={handleEditImageChange}
          handleConfirmDelete={handleConfirmDeleteFac}
          showNewFacilityInput={isEditMode ? showNewFacilityInput : false}
          handleToggleNewFacility={handleToggleNewFacility}
          newFac={newFac}
          setNewFac={setNewFac}
          handleChange={handleNewFacChange}
          onSaveNewFac={onSaveNewFac}
          startProcessLoad={startProcessLoad}
          formatPrice={formatPrice}
          notify={notify}
        />

        <ManageSubFields
          field={field}
          isEditMode={isEditMode}
          subFields={subFields}
          sportsCategories={sportsCategories}
          editingField={currentEditingField}
          updatedSubFieldName={updatedSubFieldName}
          setUpdatedSubFieldName={setUpdatedSubFieldName}
          updatedPrice={updatedPrice}
          setUpdatedPrice={setUpdatedPrice}
          updatedSubFieldPlayer={updatedSubFieldPlayer}
          setUpdatedSubFieldPlayer={setUpdatedSubFieldPlayer}
          updatedSubFieldWid={updatedSubFieldWid}
          setUpdatedSubFieldWid={setUpdatedSubFieldWid}
          updatedSubFieldLength={updatedSubFieldLength}
          setUpdatedSubFieldLength={setUpdatedSubFieldLength}
          updatedSubFieldFieldSurface={updatedSubFieldFieldSurface}
          setUpdatedSubFieldFieldSurface={setUpdatedSubFieldFieldSurface}
          updatedSportId={updatedSportId}
          setUpdatedSportId={setUpdatedSportId}
          saveSubField={saveSubField}
          startEditingSubField={startEditingSubField}
          cancelEditing={cancelEditing}
          handleDeleteClick={handleDeleteSubFieldClick}
          showAddSubFieldForm={isEditMode ? showAddSubFieldForm : false}
          setShowAddSubFieldForm={setShowAddSubFieldForm}
          newSubField={newSubField}
          setNewSubField={setNewSubField}
          newSportId={newSportId}
          setNewSportId={setNewSportId}
          addSubField={addSubField}
          userId={userId}
          showAddOnForm={showAddOnForm}
          setShowAddOnForm={setShowAddOnForm}
          addOnInputs={addOnInputs}
          setAddOnInputs={setAddOnInputs}
          handleAddOnInputChange={handleAddOnInputChange}
          addAddOn={addAddOn}
          editingAddon={isEditMode ? editingAddon : {}}
          setEditingAddon={setEditingAddon}
          saveAddon={saveAddon}
          setSelectedAddOn={setSelectedAddOn}
          setShowDeleteAddOnModal={setShowDeleteAddOnModal}
          startProcessLoad={startProcessLoad}
          formatPrice={formatPrice}
          notify={notify}
          startEditingAddon={startEditingAddon}
          onDeleteAddon={onDeleteAddon}
        />
      </div>
    </>
  );
}
