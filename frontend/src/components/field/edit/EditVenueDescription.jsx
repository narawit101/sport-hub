"use client";
import React from "react";
import { Editor } from "@tinymce/tinymce-react";

const EditVenueDescription = ({
  field,
  editingField,
  editorContent,
  handleEditorChange,
  saveField,
  cancelEditing,
  startEditing,
  startProcessLoad,
}) => {
  return (
    <div className="check-field-info">
      <div className="field-row-checkfield">
        <div className="field-details-checkfield">
          <strong>คำแนะนำของสนาม:</strong>
          <div className="field-value-checkfield">
            {editingField === "field_description" ? (
              <div className="edit-field-full">
                <div className="tinymce-editor">
                  <Editor
                    apiKey={process.env.NEXT_PUBLIC_TINYMCE_KEY}
                    value={editorContent}
                    onEditorChange={handleEditorChange}
                    init={{
                      height: 350,
                      menubar: false,
                      plugins: [
                        "advlist",
                        "autolink",
                        "lists",
                        "link",
                        "image",
                        "charmap",
                        "preview",
                        "anchor",
                        "searchreplace",
                        "visualblocks",
                        "code",
                        "fullscreen",
                        "insertdatetime",
                        "media",
                        "table",
                        "code",
                        "help",
                        "wordcount",
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
                      placeholder:
                        "ใส่รายละเอียดสนาม ช่องทางการติดต่อ หมายเหตุต่างๆ เช่น: สนามหญ้าเทียม 7 คน",
                      max_chars: 1000,
                      setup: function (editor) {
                        editor.on("init", function () {
                          editor.getContainer().style.transition =
                            "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out";
                        });
                      },
                    }}
                  />
                </div>
                <div className="inline-buttons">
                  <button
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    className="savebtn-inline"
                    onClick={() => saveField("field_description")}
                  >
                    {startProcessLoad ? (
                      <span className="dot-loading">
                        <span className="dot one">●</span>
                        <span className="dot two">●</span>
                        <span className="dot three">●</span>
                      </span>
                    ) : (
                      "บันทึก"
                    )}
                  </button>
                  <button
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    className="canbtn-inline"
                    onClick={cancelEditing}
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            ) : (
              <div className="view-field-inline">
                <div
                  className="field-description-display"
                  dangerouslySetInnerHTML={{
                    __html: field?.field_description || "ไม่มีข้อมูล",
                  }}
                />
                <button
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  className="edit-btn-inline"
                  onClick={() =>
                    startEditing(
                      "field_description",
                      field?.field_description
                    )
                  }
                >
                  แก้ไข
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditVenueDescription;
