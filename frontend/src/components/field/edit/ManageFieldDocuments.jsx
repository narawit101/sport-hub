"use client";
import React from "react";

const ManageFieldDocuments = ({
  field,
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
}) => {
  return (
    <div className="documents-section-full">
      <h2>เอกสารประกอบการสมัคร</h2>
      {editingField === "documents" ? (
        <div className="edit-documents-section">
          <input
            type="file"
            onChange={handleFileChange}
            multiple
            accept="image/*,.pdf"
            className="file-input-documents"
          />
          <div className="edit-documents-buttons">
            <button
              style={{
                cursor: startProcessLoad ? "not-allowed" : "pointer",
              }}
              disabled={startProcessLoad}
              className="savebtn-inline"
              onClick={saveDocumentField}
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
              className="canbtn-inline"
              style={{
                cursor: startProcessLoad ? "not-allowed" : "pointer",
              }}
              disabled={startProcessLoad}
              onClick={cancelEditing}
            >
              ยกเลิก
            </button>
          </div>
        </div>
      ) : field?.documents ? (
        <div className="documents-grid">
          {(Array.isArray(field.documents)
            ? field.documents
            : field.documents.split(",")
          ).map((doc, i) => {
            const docUrl = doc.trim();
            const fileName = docUrl.split("/").pop() || `เอกสาร ${i + 1}`;
            const fileExt = fileName.split(".").pop()?.toLowerCase();

            return (
              <div className="document-card" key={i}>
                {editingSingleDoc && editingSingleDoc.index === i ? (
                  <div className="single-doc-edit-form">
                    <div className="document-icon">
                      <span className="file-icon edit-mode">EDIT</span>
                    </div>
                    <div className="document-info">
                      <h4 className="document-name">แก้ไขเอกสาร {i + 1}</h4>
                      <div className="single-doc-file-input">
                        <label className="edit-doc-label">
                          <input
                            type="file"
                            style={{ display: "none" }}
                            onChange={handleSingleDocFileChange}
                            accept="image/*,.pdf"
                            className="file-input-single-doc"
                          />
                          เลือกไฟล์ใหม่
                        </label>

                        {singleDocFile && (
                          <p className="selected-file-name">
                            ไฟล์ที่เลือก: {singleDocFile.name}
                          </p>
                        )}
                      </div>
                      <div className="inline-buttons">
                        <button
                          className="savebtn-inline"
                          onClick={saveSingleDocument}
                          disabled={startProcessLoad || !singleDocFile}
                          style={{
                            cursor:
                              startProcessLoad || !singleDocFile
                                ? "not-allowed"
                                : "pointer",
                          }}
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
                          className="canbtn-inline"
                          onClick={cancelSingleDocEdit}
                          disabled={startProcessLoad}
                          style={{
                            cursor: startProcessLoad
                              ? "not-allowed"
                              : "pointer",
                          }}
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="document-icon">
                      {fileExt === "pdf" ? (
                        <div className="pdf-icon-display">
                          <div className="pdf-icon-large">📄</div>
                          <div className="pdf-text">PDF</div>
                        </div>
                      ) : fileExt === "jpg" ||
                        fileExt === "jpeg" ||
                        fileExt === "png" ||
                        fileExt === "gif" ? (
                        <div className="image-preview">
                          <img
                            src={docUrl}
                            alt={`เอกสาร ${i + 1}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: "4px",
                            }}
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                          <div
                            className="file-fallback"
                            style={{ display: "none" }}
                          >
                            IMG
                          </div>
                        </div>
                      ) : (
                        <span
                          className={`file-icon ${
                            fileExt === "doc" || fileExt === "docx"
                              ? "doc-icon"
                              : "file-icon"
                          }`}
                        >
                          {(fileExt === "doc" || fileExt === "docx") &&
                            "DOC"}
                          {![
                            "pdf",
                            "jpg",
                            "jpeg",
                            "png",
                            "gif",
                            "doc",
                            "docx",
                          ].includes(fileExt) && "FILE"}
                        </span>
                      )}
                    </div>
                    <div className="document-info">
                      <h4 className="document-name">
                        เอกสาร {i + 1}
                        <span
                          className={`file-type-inline ${
                            fileExt === "pdf"
                              ? "pdf-type"
                              : fileExt === "jpg" ||
                                fileExt === "jpeg" ||
                                fileExt === "png" ||
                                fileExt === "gif"
                              ? "image-type"
                              : fileExt === "doc" || fileExt === "docx"
                              ? "doc-type"
                              : "file-type"
                          }`}
                        >
                          {fileExt === "pdf" && " PDF"}
                          {(fileExt === "jpg" ||
                            fileExt === "jpeg" ||
                            fileExt === "png" ||
                            fileExt === "gif") &&
                            "  รูป"}
                          {(fileExt === "doc" || fileExt === "docx") &&
                            "DOC"}
                          {![
                            "pdf",
                            "jpg",
                            "jpeg",
                            "png",
                            "gif",
                            "doc",
                            "docx",
                          ].includes(fileExt) && "FILE"}
                        </span>
                      </h4>
                      <p className="document-filename">{fileName}</p>
                      <div className="document-actions">
                        <a
                          href={docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-preview"
                        >
                          เปิด
                        </a>

                        <button
                          className="edit-btn-inline"
                          onClick={() =>
                            handleEditSingleDocument(i, docUrl)
                          }
                          disabled={startProcessLoad || editingSingleDoc}
                          style={{
                            cursor:
                              startProcessLoad || editingSingleDoc
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          แก้ไข
                        </button>
                        <button
                          className="btn-delete-doc"
                          onClick={() => handleDeleteDocument(docUrl, i)}
                          disabled={startProcessLoad || editingSingleDoc}
                          style={{
                            cursor:
                              startProcessLoad || editingSingleDoc
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          <img
                            width={15}
                            height={15}
                            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAR1JREFUSEvNlusRwiAQhG870U5MJ6YStRLTiXZiOjmzGXAQjofJMCO/HDzug7tlCaQwVPUgIhcRORths5sbAPjfSRgqgIeInEoxC3wGcMzF1ADKhQCSOHe6VzcAwaqa3YA/0bozVW0pRaVSyd9r6Tzgnmnkr0nD+CeAodiDPdm/ShQmUlVKkvLcMliWKVxoqYPK2ApIFGcB9jQ8uROtAN7U+FTW3NrYWoliRa2LIilbc8w7ARhrgKvzHx/3V4Db4irc4GdYPaBMWaYtJxhbZEr3pJK6AagW3oUtgGP8NpRsuA+AWb0NO0Kziqx3wzQ7VQ3togsgtAsPsKDhnPl05k4Q+1GLVSQ2wRLnAPFdaLHu5JKVAKXPFQuWeJAPegM03+AZ7kVVEgAAAABJRU5ErkJggg=="
                            alt=""
                          />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-documents">
          <div className="no-documents-icon">ไม่มีเอกสาร</div>
          <p>ไม่มีเอกสารแนบ</p>
        </div>
      )}
    </div>
  );
};

export default ManageFieldDocuments;
