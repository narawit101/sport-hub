"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import "@/app/css/edit-field.css";
import "@/app/css/check-field.css";
import "@/app/css/field-profile.css";
import { useAuth } from "@/app/contexts/AuthContext";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";
import { useNotification } from "@/app/contexts/NotificationContext";
import { USER_STATUS, USER_ROLE, FIELD_STATUS } from "@/constants/status";
import FieldHeader from "@/components/field/FieldHeader";
import FieldManagementLayout from "@/components/field/shared/FieldManagementLayout";

// Import remaining page-specific components if any
import EditVenueProfileImage from "@/components/field/edit/EditVenueProfileImage";

export default function EditFieldDetail() {
  const { fieldId } = useParams();
  const router = useRouter();
  const { notify } = useNotification();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [userId, setUserId] = useState(null);
  const [newSportId, setNewSportId] = useState("");
  const [sportsCategories, setSportsCategories] = useState([]);
  const [updatedSubFieldName, setUpdatedSubFieldName] = useState("");
  const [updatedSubFieldPlayer, setUpdatedSubFieldPlayer] = useState("");
  const [updatedSubFieldWid, setUpdatedSubFieldWid] = useState("");
  const [updatedSubFieldLength, setUpdatedSubFieldLength] = useState("");
  const [updatedSubFieldFieldSurface, setUpdatedSubFieldFieldSurface] =
    useState("");
  const [updatedPrice, setUpdatedPrice] = useState("");
  const [updatedSportId, setUpdatedSportId] = useState("");
  const [field, setField] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [updatedValue, setUpdatedValue] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
  const [subFields, setSubFields] = useState([]);
  const [addOnInputs, setAddOnInputs] = useState({});
  const [facilities, setFacilities] = useState([]);
  const [showNewFacilityInput, setShowNewFacilityInput] = useState(false);
  const [newFac, setNewFac] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(null);

  const [newSubField, setNewSubField] = useState({
    sub_field_name: "",
    price: "",
    sport_id: "",
    players_per_team: "",
    wid_field: "",
    length_field: "",
    field_surface: "",
  });
  const [editingAddon, setEditingAddon] = useState({
    addOnId: null,
    content: "",
    price: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showAddSubFieldForm, setShowAddSubFieldForm] = useState(false);
  const [showAddOnForm, setShowAddOnForm] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSubField, setSelectedSubField] = useState(null);
  const [showDeleteAddOnModal, setShowDeleteAddOnModal] = useState(false);
  const [selectedAddOn, setSelectedAddOn] = useState(null);
  const [showDeleteDocModal, setShowDeleteDocModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const { user, isLoading } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  usePreventLeave(startProcessLoad);

  const handleCloseLightbox = () => {
    setSelectedImage(null);
  };

  const [showEditGeneralModal, setShowEditGeneralModal] = useState(false);
  const [editGeneralData, setEditGeneralData] = useState({
    field_name: "",
    address: "",
    open_days: [],
    open_hours: "",
    close_hours: "",
    slot_duration: "",
  });

  const [showEditFinancialModal, setShowEditFinancialModal] = useState(false);
  const [editFinancialData, setEditFinancialData] = useState({
    price_deposit: "",
    name_bank: "",
    account_holder: "",
    number_bank: "",
    cancel_hours: "",
  });

  const [editingFacility, setEditingFacility] = useState(null);
  const [editingSingleDoc, setEditingSingleDoc] = useState(null);
  const [singleDocFile, setSingleDocFile] = useState(null);
  const [editFacilityData, setEditFacilityData] = useState({
    facility_name: "",
    facility_price: "",
    facility_count: "",
    facility_description: "",
    facility_image: null,
  });

  const handleEditFacility = (facility) => {
    setEditingFacility(facility.field_fac_id);
    setEditFacilityData({
      facility_name: facility.fac_name,
      facility_price: facility.fac_price,
      facility_count: facility.quantity_total,
      facility_description: facility.description || "",
      facility_image: null,
    });
  };

  const handleCancelEditFac = () => {
    setEditingFacility(null);
    setEditFacilityData({
      facility_name: "",
      facility_price: "",
      facility_count: "",
      facility_description: "",
      facility_image: null,
    });
  };

  const handleSaveEditFacility = async () => {
    if (!editFacilityData.facility_name?.trim()) {
      notify("กรุณาระบุชื่อสิ่งอำนวยความสะดวก", "error");
      return;
    }
    if (editFacilityData.facility_price.toString().trim() === "") {
      notify("กรุณาระบุราคา", "error");
      return;
    }
    if (
      !editFacilityData.facility_count ||
      editFacilityData.facility_count.toString().trim() === ""
    ) {
      notify("กรุณาระบุจำนวน", "error");
      return;
    }

    SetstartProcessLoad(true);
    try {
      const formData = new FormData();
      const dataToSend = {
        fac_name: editFacilityData.facility_name.trim(),
        fac_price: editFacilityData.facility_price,
        quantity_total: editFacilityData.facility_count,
        description: editFacilityData.facility_description || "",
      };
      formData.append("data", JSON.stringify(dataToSend));
      if (editFacilityData.facility_image) {
        formData.append("facility_image", editFacilityData.facility_image);
      }
      const response = await fetch(
        `${API_URL}/field/facility/${editingFacility}`,
        {
          method: "PUT",
          credentials: "include",
          body: formData,
        },
      );
      const data = await response.json();
      if (response.ok) {
        notify("แก้ไขสิ่งอำนวยความสะดวกสำเร็จ", "success");
        setFacilities((prev) =>
          prev.map((f) =>
            f.field_fac_id === editingFacility ? { ...f, ...data.facility } : f,
          ),
        );
        handleCancelEditFac();
      } else {
        notify(data.message || "เกิดข้อผิดพลาด", "error");
      }
    } catch (error) {
      console.error("Edit facility error:", error);
      notify("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const handleEditInputChange = (field, value) => {
    setEditFacilityData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditFacilityData((prev) => ({ ...prev, facility_image: file }));
    }
  };

  useEffect(() => {
    if (user && !isLoading) {
      setUserId(user?.user_id);
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (!fieldId) return;
    const fetchFieldData = async () => {
      try {
        const res = await fetch(`${API_URL}/field/${fieldId}`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (data.error) {
          notify("ไม่พบข้อมูลสนามกีฬา", "error");
          router.push("/");
          return;
        }
        setField(data);
        setSubFields(data.sub_fields || []);
        if (Array.isArray(data.open_days)) {
          setSelectedDays(data.open_days);
        }
      } catch (error) {
        console.error("Error fetching field data:", error);
      } finally {
        setDataLoading(false);
      }
    };
    fetchFieldData();
  }, [fieldId, router, API_URL, notify]);

  useEffect(() => {
    const fetchSportsCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/sports_types/preview/type`, {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (response.ok) {
          setSportsCategories(data);
        }
      } catch (error) {
        console.error("Error fetching sports categories:", error);
      }
    };
    fetchSportsCategories();
  }, [API_URL]);

  useEffect(() => {
    if (!fieldId) return;
    const fetchFieldFacilities = async () => {
      try {
        const res = await fetch(`${API_URL}/field/field-fac/${fieldId}`, {
          method: "GET",
          credentials: "include",
        });
        const j = await res.json().catch(() => null);
        const rows = j && j.data ? j.data : Array.isArray(j) ? j : [];
        setFacilities(rows);
      } catch (err) {
        console.error("fetchFieldFacilities error:", err);
      }
    };
    fetchFieldFacilities();
  }, [fieldId, API_URL]);

  const handleConfirmDeleteFac = (field_id, field_fac_id) => {
    setSelectedFacility({ field_id, field_fac_id });
    setShowModal(true);
  };

  const handleDeleteFacility = async () => {
    if (!selectedFacility) return;
    const { field_id, field_fac_id } = selectedFacility;
    SetstartProcessLoad(true);
    try {
      const res = await fetch(
        `${API_URL}/field/facilities/${field_id}/${field_fac_id}`,
        { method: "DELETE", credentials: "include" },
      );
      const result = await res.json();
      if (res.ok) {
        setFacilities((prev) =>
          prev.filter((f) => f.field_fac_id !== field_fac_id),
        );
        notify("ลบสิ่งอำนวยความสะดวกสำเร็จ", "success");
        setShowModal(false);
      }
    } catch (err) {
      notify("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const handleNewFacChange = (index, field, value) => {
    if (field === "image_path") {
      const file = value;
      if (!file) {
        setNewFac((prev) => {
          const updated = [...prev];
          if (updated[index]?.image_preview) {
            try {
              URL.revokeObjectURL(updated[index].image_preview);
            } catch (e) {}
          }
          updated[index] = {
            ...updated[index],
            [field]: value,
            image_preview: null,
          };
          return updated;
        });
        return;
      }
      const preview = URL.createObjectURL(file);
      setNewFac((prev) => {
        const updated = [...prev];
        if (updated[index]?.image_preview) {
          try {
            URL.revokeObjectURL(updated[index].image_preview);
          } catch (e) {}
        }
        updated[index] = {
          ...updated[index],
          [field]: file,
          image_preview: preview,
        };
        return updated;
      });
      return;
    }
    setNewFac((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleToggleNewFacility = () => {
    if (!showNewFacilityInput) {
      setShowNewFacilityInput(true);
      setNewFac([
        {
          fac_name: "",
          fac_price: "",
          quantity_total: "",
          description: "",
          image_path: null,
        },
      ]);
    } else {
      newFac.forEach((f) => {
        if (f?.image_preview) {
          try {
            URL.revokeObjectURL(f.image_preview);
          } catch (e) {}
        }
      });
      setNewFac([]);
      setShowNewFacilityInput(false);
    }
  };

  const onSaveNewFac = async (index) => {
    const fac = newFac[index];
    if (!fac?.fac_name?.trim() || !fac.fac_price || !fac.quantity_total) {
      notify("กรุณากรอกข้อมูลสิ่งอำนวยความสะดวกให้ครบถ้วน", "error");
      return;
    }
    SetstartProcessLoad(true);
    const formData = new FormData();
    if (fac.image_path) {
      formData.append("facility_image", fac.image_path);
    }
    formData.append(
      "data",
      JSON.stringify({
        fac_name: fac.fac_name.trim(),
        fac_price: fac.fac_price,
        quantity_total: fac.quantity_total,
        description: fac.description.trim(),
      }),
    );
    try {
      const res = await fetch(`${API_URL}/facilities/${fieldId}`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        notify("บันทึกเรียบร้อย", "success");
        setFacilities((prev) => [...prev, data.inserted]);
        setNewFac([]);
        setShowNewFacilityInput(false);
      }
    } catch (err) {
      notify("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const startEditing = (fieldName, currentValue) => {
    setEditingField(fieldName);
    setUpdatedValue(currentValue);
    if (fieldName === "open_days" && field?.open_days) {
      setSelectedDays(field.open_days);
    }
    if (fieldName === "field_description") {
      setEditorContent(currentValue || "");
    }
  };

  const cancelEditing = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setEditingField(null);
    setUpdatedSubFieldName("");
    setUpdatedSubFieldPlayer("");
    setUpdatedSubFieldWid("");
    setUpdatedSubFieldLength("");
    setUpdatedSubFieldFieldSurface("");
    setUpdatedPrice("");
    setUpdatedSportId("");
    setEditorContent("");
    setEditingFacility(null);
    setEditingSingleDoc(null);
    setSingleDocFile(null);
  };

  const startEditingSubField = (sub) => {
    setEditingField(sub.sub_field_id);
    setUpdatedSubFieldName(sub.sub_field_name);
    setUpdatedSubFieldPlayer(sub.players_per_team);
    setUpdatedSubFieldWid(sub.wid_field);
    setUpdatedSubFieldLength(sub.length_field);
    setUpdatedSubFieldFieldSurface(sub.field_surface);
    setUpdatedPrice(sub.price);
    let resolved = sub?.sport_id != null ? String(sub.sport_id) : "";
    if (
      (!resolved ||
        !sportsCategories.some((c) => String(c.sport_id) === resolved)) &&
      sub?.sport_name
    ) {
      const found = sportsCategories.find(
        (c) => c.sport_name?.trim() === sub.sport_name?.trim()
      );
      if (found) resolved = String(found.sport_id);
    }
    setUpdatedSportId(resolved);
  };

  const startEditingAddon = (addon) => {
    setEditingAddon({
      addOnId: addon.add_on_id,
      content: addon.content,
      price: addon.price,
    });
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    const MAX_FILES = 10;
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    let isValid = true;

    const existingCount = field?.documents ? field.documents.split(",").map(d => d.trim()).filter(Boolean).length : 0;
    if (existingCount + files.length > 10) {
      notify(`ไม่สามารถอัปโหลดเพิ่มได้ เนื่องจากจะเกินขีดจำกัดสูงสุด ${MAX_FILES} ไฟล์ (ปัจจุบันมี ${existingCount} ไฟล์, เลือกเพิ่มอีก ${files.length} ไฟล์)`, "error");
      e.target.value = null;
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > MAX_FILE_SIZE) {
        isValid = false;
        notify("ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5MB)", "error");
        e.target.value = null;
        break;
      }

      const fileType = file.type;
      if (!fileType.startsWith("image/") && fileType !== "application/pdf") {
        isValid = false;
        notify("โปรดเลือกเฉพาะไฟล์รูปภาพหรือ PDF เท่านั้น", "error");
        break;
      }
    }

    if (isValid) {
      setSelectedFile(files);
    } else {
      e.target.value = null;
    }
  };

  const saveField = async (fieldName) => {
    if (fieldName === "open_days") {
      if (!selectedDays?.length) {
        notify("กรุณาเลือกอย่างน้อย 1 วัน", "error");
        return;
      }
      SetstartProcessLoad(true);
      try {
        const response = await fetch(`${API_URL}/field/update/${fieldId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ open_days: selectedDays }),
        });
        if (response.ok) {
          setField({ ...field, open_days: [...selectedDays] });
          setEditingField(null);
          notify("อัปเดตสำเร็จ", "success");
        }
      } catch (error) {
        notify("ไม่สามารถเชื่อมต่อได้", "error");
      } finally {
        SetstartProcessLoad(false);
      }
      return;
    }
    if (!updatedValue && fieldName !== "field_description") {
      notify("ห้ามปล่อยค่าว่าง", "error");
      return;
    }
    SetstartProcessLoad(true);
    try {
      const response = await fetch(`${API_URL}/field/update/${fieldId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ [fieldName]: updatedValue }),
      });
      if (response.ok) {
        setField({ ...field, [fieldName]: updatedValue });
        setEditingField(null);
        notify("อัปเดตสำเร็จ", "success");
      }
    } catch (error) {
      notify("ไม่สามารถเชื่อมต่อได้", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const saveSubField = async (sub_field_id) => {
    SetstartProcessLoad(true);
    try {
      const response = await fetch(
        `${API_URL}/field/supfiled/${sub_field_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            sub_field_name: updatedSubFieldName,
            players_per_team: updatedSubFieldPlayer,
            wid_field: updatedSubFieldWid,
            length_field: updatedSubFieldLength,
            field_surface: updatedSubFieldFieldSurface,
            price: updatedPrice,
            sport_id: updatedSportId,
          }),
        },
      );
      if (response.ok) {
        notify("อัปเดตสนามย่อยสำเร็จ", "success");
        setSubFields((prev) =>
          prev.map((s) =>
            s.sub_field_id === sub_field_id
              ? {
                  ...s,
                  sub_field_name: updatedSubFieldName,
                  players_per_team: updatedSubFieldPlayer,
                  wid_field: updatedSubFieldWid,
                  length_field: updatedSubFieldLength,
                  field_surface: updatedSubFieldFieldSurface,
                  price: updatedPrice,
                  sport_id: updatedSportId,
                }
              : s,
          ),
        );
        cancelEditing();
      }
    } catch (error) {
      notify("ไม่สามารถเชื่อมต่อได้", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const addSubField = async (userId) => {
    if (!newSportId) {
      notify("กรุณาเลือกประเภทกีฬาก่อน", "error");
      return;
    }
    SetstartProcessLoad(true);
    try {
      const response = await fetch(`${API_URL}/field/subfield/${fieldId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...newSubField,
          user_id: userId,
          sport_id: newSportId,
        }),
      });
      if (response.ok) {
        const newField = await response.json();
        const sport = sportsCategories.find(
          (s) => s.sport_id === parseInt(newSportId),
        );
        setSubFields([
          ...subFields,
          { ...newField, sport_name: sport?.sport_name || "ไม่ระบุ" },
        ]);
        notify("เพิ่มสำเร็จ", "success");
        setShowAddSubFieldForm(false);
        setNewSubField({
          sub_field_name: "",
          price: "",
          sport_id: "",
          players_per_team: "",
          wid_field: "",
          length_field: "",
          field_surface: "",
        });
      }
    } catch (error) {
      notify("ไม่สามารถเชื่อมต่อได้", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const handleImgChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const saveImageField = async () => {
    SetstartProcessLoad(true);
    try {
      const formData = new FormData();
      formData.append("img_field", selectedFile);
      const response = await fetch(`${API_URL}/field/${fieldId}/upload-image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const result = await response.json();
      if (response.ok) {
        setField({ ...field, img_field: result.path });
        setEditingField(null);
        setSelectedFile(null);
        notify("อัปเดตสำเร็จ", "success");
      }
    } catch (error) {
      notify("เกิดข้อผิดพลาด", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const saveDocumentField = async () => {
    SetstartProcessLoad(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < selectedFile.length; i++) {
        formData.append("documents", selectedFile[i]);
      }
      const response = await fetch(
        `${API_URL}/field/${fieldId}/upload-document`,
        { method: "POST", credentials: "include", body: formData },
      );
      const result = await response.json();
      if (response.ok) {
        setField({ ...field, documents: result.all_documents.join(",") });
        setEditingField(null);
        setSelectedFile(null);
        notify("อัปเดตสำเร็จ", "success");
      }
    } catch (error) {
      notify("เกิดข้อผิดพลาด", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const handleDeleteDocument = (docUrl, index) => {
    setSelectedDocument({ docUrl, index });
    setShowDeleteDocModal(true);
  };

  const confirmDeleteDocument = async () => {
    if (!selectedDocument) return;
    const { docUrl, index } = selectedDocument;
    SetstartProcessLoad(true);
    try {
      const response = await fetch(
        `${API_URL}/field/${fieldId}/delete-document`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ document_url: docUrl }),
        },
      );
      if (response.ok) {
        const docs = field.documents.split(",").filter((_, i) => i !== index);
        setField({ ...field, documents: docs.join(",") });
        notify("ลบเอกสารสำเร็จ", "success");
        setShowDeleteDocModal(false);
        setSelectedDocument(null);
      }
    } catch (error) {
      notify("เกิดข้อผิดพลาด", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const handleEditSingleDocument = (index, docUrl) => {
    setEditingSingleDoc({ index, docUrl });
  };

  const saveSingleDocument = async () => {
    SetstartProcessLoad(true);
    try {
      const formData = new FormData();
      formData.append("document", singleDocFile);
      formData.append("document_index", editingSingleDoc.index);
      formData.append("old_document_url", editingSingleDoc.docUrl);
      const response = await fetch(
        `${API_URL}/field/${fieldId}/replace-single-document`,
        { method: "POST", credentials: "include", body: formData },
      );
      const result = await response.json();
      if (response.ok) {
        const docs = field.documents.split(",");
        docs[editingSingleDoc.index] = result.new_document_url;
        setField({ ...field, documents: docs.join(",") });
        setEditingSingleDoc(null);
        setSingleDocFile(null);
        notify("แก้ไขสำเร็จ", "success");
      }
    } catch (error) {
      notify("เกิดข้อผิดพลาด", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const handleOpenEditGeneral = () => {
    setEditGeneralData({
      field_name: field?.field_name || "",
      address: field?.address || "",
      open_days: field?.open_days ? [...field.open_days] : [],
      open_hours: field?.open_hours || "",
      close_hours: field?.close_hours || "",
      slot_duration: field?.slot_duration || "60",
    });
    setShowEditGeneralModal(true);
  };

  const saveGeneralInfo = async () => {
    if (!editGeneralData.field_name?.trim()) {
      notify("กรุณาระบุชื่อสนาม", "error");
      return;
    }
    if (!editGeneralData.address?.trim()) {
      notify("กรุณาระบุที่อยู่", "error");
      return;
    }
    if (!editGeneralData.open_days || editGeneralData.open_days.length === 0) {
      notify("กรุณาเลือกวันเปิดทำการอย่างน้อย 1 วัน", "error");
      return;
    }
    if (!editGeneralData.open_hours || !editGeneralData.close_hours) {
      notify("กรุณาระบุเวลาเปิด-ปิดทำการ", "error");
      return;
    }
    SetstartProcessLoad(true);
    try {
      const response = await fetch(`${API_URL}/field/update/${fieldId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editGeneralData),
      });
      if (response.ok) {
        setField({ ...field, ...editGeneralData });
        setShowEditGeneralModal(false);
        notify("แก้ไขข้อมูลทั่วไปสำเร็จ", "success");
      } else {
        notify("เกิดข้อผิดพลาดในการแก้ไขข้อมูล", "error");
      }
    } catch (error) {
      notify("ไม่สามารถเชื่อมต่อได้", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const handleOpenEditFinancial = () => {
    setEditFinancialData({
      price_deposit: field?.price_deposit || "0",
      name_bank: field?.name_bank || "",
      account_holder: field?.account_holder || "",
      number_bank: field?.number_bank || "",
      cancel_hours: field?.cancel_hours || "0",
    });
    setShowEditFinancialModal(true);
  };

  const saveFinancialInfo = async () => {
    SetstartProcessLoad(true);
    try {
      const response = await fetch(`${API_URL}/field/update/${fieldId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editFinancialData),
      });
      if (response.ok) {
        setField({ ...field, ...editFinancialData });
        setShowEditFinancialModal(false);
        notify("แก้ไขข้อมูลการเงินสำเร็จ", "success");
      } else {
        notify("เกิดข้อผิดพลาดในการแก้ไขข้อมูล", "error");
      }
    } catch (error) {
      notify("ไม่สามารถเชื่อมต่อได้", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const addAddOn = async (subFieldId, content, price) => {
    SetstartProcessLoad(true);
    try {
      const res = await fetch(`${API_URL}/field/addon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sub_field_id: subFieldId, content, price }),
      });
      const result = await res.json();
      if (res.ok) {
        setSubFields((prev) =>
          prev.map((s) =>
            s.sub_field_id === subFieldId
              ? { ...s, add_ons: [...(s.add_ons || []), result] }
              : s,
          ),
        );
        notify("เพิ่มสำเร็จ", "success");
      }
    } catch (err) {
      notify("เกิดข้อผิดพลาด", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const saveAddon = async () => {
    SetstartProcessLoad(true);
    try {
      const response = await fetch(
        `${API_URL}/field/add_on/${editingAddon.addOnId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            content: editingAddon.content,
            price: editingAddon.price,
          }),
        },
      );
      if (response.ok) {
        setSubFields((prev) =>
          prev.map((s) => ({
            ...s,
            add_ons: (s.add_ons || []).map((a) =>
              a.add_on_id === editingAddon.addOnId
                ? {
                    ...a,
                    content: editingAddon.content,
                    price: editingAddon.price,
                  }
                : a,
            ),
          })),
        );
        setEditingAddon({ addOnId: null, content: "", price: "" });
        notify("แก้ไขสำเร็จ", "success");
      }
    } catch (error) {
      notify("เกิดข้อผิดพลาด", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const deleteAddOn = async (id) => {
    SetstartProcessLoad(true);
    try {
      const res = await fetch(`${API_URL}/field/delete/addon/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setSubFields((prev) =>
          prev.map((s) => ({
            ...s,
            add_ons: (s.add_ons || []).filter((a) => a.add_on_id !== id),
          })),
        );
        notify("ลบสำเร็จ", "success");
      }
    } catch (err) {
      notify("เกิดข้อผิดพลาด", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const confirmDeleteSubField = async () => {
    SetstartProcessLoad(true);
    try {
      const res = await fetch(
        `${API_URL}/field/delete/subfield/${selectedSubField.sub_field_id}`,
        { method: "DELETE", credentials: "include" },
      );
      if (res.ok) {
        setSubFields((prev) =>
          prev.filter((s) => s.sub_field_id !== selectedSubField.sub_field_id),
        );
        setShowDeleteModal(false);
        notify("ลบสำเร็จ", "success");
      }
    } catch (error) {
      notify("เกิดข้อผิดพลาด", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const upDateStatus = async () => {
    SetstartProcessLoad(true);
    try {
      const res = await fetch(`${API_URL}/field/appeal/${field.field_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "รอตรวจสอบ" }),
      });
      if (res.ok) {
        notify("ส่งคำขอสำเร็จ", "success");
        setTimeout(() => router.push("/my-field"), 2000);
      }
    } catch (err) {
      notify("เกิดข้อผิดพลาด", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const handleDayToggle = (dayCode) => {
    setSelectedDays((prev) =>
      prev.includes(dayCode)
        ? prev.filter((d) => d !== dayCode)
        : [...prev, dayCode],
    );
  };

  const daysInThai = {
    Mon: "จันทร์",
    Tue: "อังคาร",
    Wed: "พุธ",
    Thu: "พฤหัสบดี",
    Fri: "ศุกร์",
    Sat: "เสาร์",
    Sun: "อาทิตย์",
  };
  const dayCodes = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  if (isLoading || dataLoading)
    return (
      <div className="load">
        <span className="spinner"></span>
      </div>
    );
  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <>
      {selectedImage && (
        <div className="lightbox-overlay" onClick={handleCloseLightbox}>
          <img src={selectedImage} alt="Zoomed" className="lightbox-image" />
        </div>
      )}

      <FieldHeader
        fieldData={field}
        onImageClick={setSelectedImage}
        onEditImage={() => startEditing("img_field", field?.img_field)}
        previewUrl={previewUrl}
      />

      <div className="check-field-detail-container editfield-container">
        <h1>จัดการข้อมูลสนามกีฬา</h1>

        <EditVenueProfileImage
          field={field}
          startProcessLoad={startProcessLoad}
          saveImageField={saveImageField}
          handleImgChange={handleImgChange}
          cancelEditing={cancelEditing}
          editingField={editingField}
          startEditing={startEditing}
          previewUrl={previewUrl}
        />

        <FieldManagementLayout
          field={field}
          isEditMode={true}
          facilities={facilities}
          subFields={subFields}
          editingField={editingField}
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
          updatedValue={updatedValue}
          setUpdatedValue={setUpdatedValue}
          selectedDays={selectedDays}
          dayCodes={dayCodes}
          daysInThai={daysInThai}
          startProcessLoad={startProcessLoad}
          editorContent={editorContent}
          setEditorContent={setEditorContent}
          previewUrl={previewUrl}
          sportsCategories={sportsCategories}
          saveField={saveField}
          cancelEditing={cancelEditing}
          startEditing={startEditing}
          handleDayToggle={handleDayToggle}
          getGoogleMapsLink={(gps) =>
            gps ? `https://www.google.com/maps/search/?api=1&query=${gps}` : "#"
          }
          formatPrice={(v) => new Intl.NumberFormat("th-TH").format(v)}
          notify={notify}
          router={router}
          handleFileChange={handleFileChange}
          saveDocumentField={saveDocumentField}
          handleDeleteDocument={handleDeleteDocument}
          handleEditSingleDocument={handleEditSingleDocument}
          editingFieldProp={editingField}
          editingSingleDoc={editingSingleDoc}
          singleDocFile={singleDocFile}
          handleSingleDocFileChange={(e) => setSingleDocFile(e.target.files[0])}
          saveSingleDocument={saveSingleDocument}
          cancelSingleDocEdit={() => {
            setEditingSingleDoc(null);
            setSingleDocFile(null);
          }}
          handleEditFacility={handleEditFacility}
          handleCancelEditFac={handleCancelEditFac}
          handleSaveEditFacility={handleSaveEditFacility}
          handleEditInputChange={handleEditInputChange}
          handleEditImageChange={handleEditImageChange}
          handleConfirmDeleteFac={handleConfirmDeleteFac}
          showNewFacilityInput={showNewFacilityInput}
          handleToggleNewFacility={handleToggleNewFacility}
          newFac={newFac}
          setNewFac={setNewFac}
          handleNewFacChange={handleNewFacChange}
          onSaveNewFac={onSaveNewFac}
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
          handleDeleteSubFieldClick={(s) => {
            setSelectedSubField(s);
            setShowDeleteModal(true);
          }}
          showAddSubFieldForm={showAddSubFieldForm}
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
          handleAddOnInputChange={(id, key, val) =>
            setAddOnInputs((prev) => ({
              ...prev,
              [id]: { ...prev[id], [key]: val },
            }))
          }
          addAddOn={addAddOn}
          editingAddon={editingAddon}
          setEditingAddon={setEditingAddon}
          saveAddon={saveAddon}
          setSelectedAddOn={setSelectedAddOn}
          setShowDeleteAddOnModal={setShowDeleteAddOnModal}
          startEditingAddon={startEditingAddon}
          onDeleteAddon={(a) => {
            setSelectedAddOn(a);
            setShowDeleteAddOnModal(true);
          }}
          editFacilityData={editFacilityData}
          editingFacility={editingFacility}
          selectedFiles={selectedFile}
        />

      {field?.status == FIELD_STATUS.REJECTED && (
        <div className="editbtn-editfield-request">
          <button
            onClick={upDateStatus}
            disabled={startProcessLoad}
            className="editbtn-editfield"
          >
            {startProcessLoad ? "กำลังส่ง..." : "ส่งคำขอลงทะเบียนสนามอีกครั้ง"}
          </button>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay-editfield">
          <div className="modal-editfield">
            <h2>ยืนยันการลบสนามย่อย</h2>
            <p>คุณต้องการลบสนามย่อยนี้และกิจกรรมพิเศษทั้งหมดหรือไม่?</p>
            <div className="modal-actions-editfield">
              <button
                disabled={startProcessLoad}
                className="savebtn-editfield"
                onClick={confirmDeleteSubField}
              >
                {startProcessLoad ? "กำลังลบ..." : "ยืนยัน"}
              </button>
              <button
                disabled={startProcessLoad}
                className="canbtn-editfield"
                onClick={() => setShowDeleteModal(false)}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAddOnModal && (
        <div className="modal-overlay-editfield">
          <div className="modal-editfield">
            <h2>ยืนยันการลบกิจกรรมพิเศษ</h2>
            <p>คุณต้องการลบกิจกรรม "{selectedAddOn?.content}" หรือไม่?</p>
            <div className="modal-actions-editfield">
              <button
                disabled={startProcessLoad}
                className="savebtn-editfield"
                onClick={() =>
                  deleteAddOn(selectedAddOn.add_on_id).then(() =>
                    setShowDeleteAddOnModal(false),
                  )
                }
              >
                ยืนยัน
              </button>
              <button
                disabled={startProcessLoad}
                className="canbtn-editfield"
                onClick={() => setShowDeleteAddOnModal(false)}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay-editfield">
          <div className="modal-editfield">
            <h2>ยืนยันการลบ</h2>
            <p style={{ color: "#dc3545", fontWeight: "bold" }}>
              หมายเหตุ: การลบสิ่งอำนวยความสะดวกจะลบข้อมูลการจองที่เกี่ยวข้องด้วย
            </p>
            <div className="modal-actions-editfield">
              <button
                disabled={startProcessLoad}
                className="savebtn-editfield"
                onClick={handleDeleteFacility}
              >
                ลบ
              </button>
              <button
                disabled={startProcessLoad}
                className="canbtn-editfield"
                onClick={() => setShowModal(false)}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteDocModal && (
        <div className="modal-overlay-editfield">
          <div className="modal-editfield">
            <h2>ยืนยันการลบเอกสาร</h2>
            <p>คุณต้องการลบเอกสารที่ {(selectedDocument?.index ?? 0) + 1} หรือไม่?</p>
            <div className="modal-actions-editfield">
              <button
                disabled={startProcessLoad}
                className="savebtn-editfield"
                onClick={confirmDeleteDocument}
              >
                {startProcessLoad ? "กำลังลบ..." : "ยืนยันลบ"}
              </button>
              <button
                disabled={startProcessLoad}
                className="canbtn-editfield"
                onClick={() => {
                  setShowDeleteDocModal(false);
                  setSelectedDocument(null);
                }}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
