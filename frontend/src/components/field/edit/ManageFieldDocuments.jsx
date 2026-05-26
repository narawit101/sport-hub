"use client";
import React, { useState, useEffect } from "react";
import FieldDocumentsList from "@/components/field/shared/FieldDocumentsList";
import FieldModal from "@/components/field/shared/FieldModal";

const ManageFieldDocuments = ({
  field,
  isEditMode = false,
  editingField,
  startProcessLoad,
  handleFileChange,
  saveDocumentField,
  cancelEditing,
  handleDeleteDocument,
  handleEditSingleDocument,
  editingSingleDoc,
  singleDocFile,
  handleSingleDocFileChange,
  saveSingleDocument,
  cancelSingleDocEdit,
  startEditing,
  selectedFiles,
}) => {
  const isCurrentlyUploading = isEditMode && editingField === "documents" && !editingSingleDoc;
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    if (selectedFiles && selectedFiles.length > 0) {
      const newPreviews = Array.from(selectedFiles).map(file => ({
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file)
      }));
      setPreviews(newPreviews);
      return () => newPreviews.forEach(p => URL.revokeObjectURL(p.url));
    } else {
      setPreviews([]);
    }
  }, [selectedFiles]);

  return (
    <div className="documents-section-full">
      <h2>
        <span>เอกสารประกอบการสมัคร:</span>
        {isEditMode && (
          <button
            className="edit-btn-inline"
            onClick={() => startEditing && startEditing("documents", field?.documents)}
            style={{ background: 'var(--text-color)', color: 'white' }}
          >
            อัปโหลดเพิ่ม
          </button>
        )}
      </h2>

      <div className="documents-list-container check-field-scroll-section">
        <FieldDocumentsList 
          documents={field?.documents}
          isEditMode={isEditMode}
          onDelete={handleDeleteDocument}
          onEdit={(index, docUrl) => handleEditSingleDocument(index, docUrl)}
          startProcessLoad={startProcessLoad}
        />
      </div>

      {/* Modal สำหรับอัปโหลดเพิ่มแบบหลายไฟล์ */}
      <FieldModal
        isOpen={isCurrentlyUploading}
        onClose={cancelEditing}
        title="อัปโหลดเอกสารประกอบการสมัคร"
        onSave={saveDocumentField}
        saveText="บันทึกและอัปโหลด"
        startProcessLoad={startProcessLoad}
        maxWidth="600px"
      >
        <div className="form-group form-group-full">
          <label className="file-label-fac" style={{ display: 'block', padding: '15px', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '10px', textAlign: 'center', cursor: 'pointer' }}>
            <input
              type="file"
              onChange={handleFileChange}
              multiple
              accept="image/*,.pdf"
              style={{ display: "none" }}
            />
            คลิกเพื่อเลือกไฟล์เอกสาร (รูปภาพ หรือ PDF)
          </label>
        </div>

        {previews.length > 0 && (
          <div className="pending-previews" style={{ marginTop: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: '800', color: '#64748b', marginBottom: '12px' }}>
              ไฟล์ที่เลือกเตรียมอัปโหลด ({previews.length} ไฟล์):
            </p>
            <div className="previews-container check-field-scroll-section" style={{ maxHeight: '250px' }}>
              {previews.map((p, i) => (
                <div key={i} className="preview-item-modal" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: '#fcfdfe', border: '1px solid #f1f5f9', borderRadius: '8px', marginBottom: '8px' }}>
                  <div className="preview-icon-small" style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyObject: 'center', overflow: 'hidden' }}>
                    {p.type === "application/pdf" ? (
                      <span style={{ fontSize: '10px', fontWeight: '900', color: '#ef4444' }}>PDF</span>
                    ) : (
                      <img src={p.url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <div className="preview-info-small" style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#334155', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>{p.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </FieldModal>

      {/* Modal สำหรับแก้ไขไฟล์เดียว */}
      {isEditMode && editingSingleDoc && (
        <FieldModal
          isOpen={true}
          onClose={cancelSingleDocEdit}
          title={`แก้ไขเอกสารที่ ${editingSingleDoc.index + 1}`}
          onSave={saveSingleDocument}
          startProcessLoad={startProcessLoad}
          maxWidth="400px"
        >
          <div className="form-group form-group-full">
            <label className="edit-doc-label" style={{ display: 'block', padding: '15px', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '8px', textAlign: 'center', cursor: 'pointer' }}>
              <input
                type="file"
                style={{ display: "none" }}
                onChange={handleSingleDocFileChange}
                accept="image/*,.pdf"
              />
              คลิกเพื่อเปลี่ยนไฟล์ใหม่
            </label>
            {singleDocFile && (
              <p style={{ fontSize: '12px', marginTop: '10px', color: '#10b981', textAlign: 'center', fontWeight: '700' }}>
                ไฟล์ที่เลือก: {singleDocFile.name}
              </p>
            )}
          </div>
        </FieldModal>
      )}
    </div>
  );
};

export default ManageFieldDocuments;
