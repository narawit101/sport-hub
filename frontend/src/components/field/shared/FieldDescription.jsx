"use client";
import React from "react";
import { Editor } from "@tinymce/tinymce-react";
import FieldModal from "./FieldModal";

const FieldDescription = ({
  field,
  isEditMode = false,
  editingField,
  editorContent,
  handleEditorChange,
  saveField,
  cancelEditing,
  startEditing,
  startProcessLoad,
}) => {
  const canEdit = isEditMode && startEditing && saveField;
  const isCurrentlyEditing = canEdit && editingField === "field_description";

  return (
    <div className="check-field-description-card">
      <h2>
        <span>ข้อมูลเพิ่มเติม:</span>
        {canEdit && (
          <button
            disabled={startProcessLoad}
            className="edit-btn-inline"
            onClick={() =>
              startEditing(
                "field_description",
                field?.field_description
              )
            }
            style={{ background: 'var(--text-color)', color: 'white' }}
          >
            แก้ไขรายละเอียด
          </button>
        )}
      </h2>
      
      <div className="field-description-content">
        <div
          className="field-description-display check-field-scroll-section"
          dangerouslySetInnerHTML={{
            __html: field?.field_description || "ไม่มีข้อมูลคำแนะนำสนาม",
          }}
        />
      </div>

      {/* Modal สำหรับแก้ไขรายละเอียด */}
      <FieldModal
        isOpen={isCurrentlyEditing}
        onClose={cancelEditing}
        title="แก้ไขรายละเอียดสนาม"
        onSave={() => saveField("field_description")}
        startProcessLoad={startProcessLoad}
        maxWidth="800px"
      >
        <div className="tinymce-editor">
          <Editor
            apiKey={process.env.NEXT_PUBLIC_TINYMCE_KEY}
            value={editorContent}
            onEditorChange={handleEditorChange}
            init={{
              height: 400,
              menubar: false,
              plugins: [
                "advlist", "autolink", "lists", "link", "image", "charmap", "preview",
                "anchor", "searchreplace", "visualblocks", "code", "fullscreen",
                "insertdatetime", "media", "table", "help", "wordcount",
              ],
              toolbar:
                "undo redo | blocks | " +
                "bold italic forecolor | alignleft aligncenter " +
                "alignright alignjustify | bullist numlist outdent indent | " +
                "removeformat | help",
              content_style:
                "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
              branding: false,
              statusbar: false,
              resize: false,
              placeholder: "ใส่รายละเอียดสนาม ช่องทางการติดต่อ หมายเหตุต่างๆ เช่น: สนามหญ้าเทียม 7 คน",
            }}
          />
        </div>
      </FieldModal>
    </div>
  );
};

export default FieldDescription;
