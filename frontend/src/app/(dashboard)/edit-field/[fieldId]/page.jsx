"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import "@/app/css/edit-field.css";
import { useAuth } from "@/app/contexts/AuthContext";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";
import { useNotification } from "@/app/contexts/NotificationContext";
import { USER_STATUS, USER_ROLE, FIELD_STATUS } from "@/constants/status";

// Import refactored components
import EditVenueProfileImage from "@/components/field/edit/EditVenueProfileImage";
import EditVenueBasicInfo from "@/components/field/edit/EditVenueBasicInfo";
import EditVenueDescription from "@/components/field/edit/EditVenueDescription";
import ManageFieldDocuments from "@/components/field/edit/ManageFieldDocuments";
import ManageFacilities from "@/components/field/edit/ManageFacilities";
import ManageSubFields from "@/components/field/edit/ManageSubFields";

export default function CheckFieldDetail() {
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
  const { user, isLoading } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  usePreventLeave(startProcessLoad);

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

  const handleCancelEdit = () => {
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
    if (
      !editFacilityData.facility_name ||
      !editFacilityData.facility_name.trim()
    ) {
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
        }
      );

      const data = await response.json();

      if (response.ok) {
        notify("แก้ไขสิ่งอำนวยความสะดวกสำเร็จ", "success");
        setFacilities((prevFacilities) =>
          prevFacilities.map((facility) =>
            facility.field_fac_id === editingFacility
              ? {
                  ...facility,
                  fac_name: data.facility.fac_name,
                  fac_price: data.facility.fac_price,
                  quantity_total: data.facility.quantity_total,
                  description: data.facility.description,
                  image_path: data.facility.image_path || facility.image_path,
                }
              : facility
          )
        );

        handleCancelEdit();
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
    setEditFacilityData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditFacilityData((prev) => ({
        ...prev,
        facility_image: file,
      }));
    }
  };

  useEffect(() => {
    if (user) {
      if (isLoading) return;
      setUserId(user?.user_id);
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (!fieldId) return;
    const fetchFieldData = async () => {
      try {
        const res = await fetch(`${API_URL}/field/${fieldId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
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
        notify("เกิดข้อผิดพลาดในการโหลดข้อมูลสนามกีฬา", "error");
      } finally {
        setDataLoading(false);
      }
    };

    fetchFieldData();
  }, [fieldId, router, API_URL]);

  useEffect(() => {
    const fetchSportsCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/sports_types/preview/type`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        const data = await response.json();
        if (response.ok) {
          setSportsCategories(data);
        } else {
          console.error("Error fetching sports categories:", data.error);
          notify(data.error, "error");
        }
      } catch (error) {
        console.error("Error fetching sports categories:", error);
        notify("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
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
        notify("ไม่สามารถโหลดสิ่งอำนวยความสะดวกได้", "error");
      }
    };
    fetchFieldFacilities();
  }, [fieldId, API_URL]);

  const handleConfirmDelete = (field_id, field_fac_id) => {
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
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const result = await res.json();

      if (res.ok) {
        setFacilities((prev) =>
          prev.filter((f) => f.field_fac_id !== field_fac_id)
        );
        const message =
          result.relatedRecordsDeleted > 0
            ? `ลบสิ่งอำนวยความสะดวกสำเร็จ (ลบข้อมูลการจองที่เกี่ยวข้อง ${result.relatedRecordsDeleted} รายการ)`
            : result.message || "ลบสิ่งอำนวยความสะดวกสำเร็จ";
        notify(message, "success");
        setShowModal(false);
      } else {
        notify(result.message || "เกิดข้อผิดพลาด", "error");
      }
    } catch (err) {
      notify("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const handleChange = (index, field, value) => {
    if (field === "image_path") {
      const file = value;
      const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

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

      if (file.size > MAX_IMAGE_SIZE) {
        notify("ไฟล์รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 5MB)", "error");
        return;
      }

      if (!file.type || !file.type.startsWith("image/")) {
        notify("โปรดเลือกเฉพาะไฟล์รูปภาพเท่านั้น", "error");
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

  const addNewFacility = () => {
    setNewFac((prev) => [
      ...prev,
      {
        fac_name: "",
        fac_price: "",
        quantity_total: "",
        description: "",
        image_path: null,
      },
    ]);
  };

  const handleToggleNewFacility = () => {
    if (!showNewFacilityInput) {
      setShowNewFacilityInput(true);
      addNewFacility();
    } else {
      if (Array.isArray(newFac)) {
        newFac.forEach((f) => {
          if (f?.image_preview) {
            try {
              URL.revokeObjectURL(f.image_preview);
            } catch (e) {}
          }
        });
      }
      setNewFac([]);
      setShowNewFacilityInput(false);
    }
  };

  const onSaveNewFac = async (index) => {
    const fac = newFac[index];

    if (!fac) {
      notify("กรุณาลองใส่ข้อมูลสิ่งอำนวยความสะดวกให้ครบถ้วน", "error");
      return;
    }

    if (!fac.fac_name || fac.fac_name.trim() === "") {
      notify("กรุณาใส่ชื่อสิ่งอำนวยความสะดวก", "error");
      return;
    }

    if (!fac.fac_price || fac.fac_price.toString().trim() === "") {
      notify("กรุณาใส่ราคาสิ่งอำนวยความสะดวก", "error");
      return;
    }

    if (!fac.quantity_total || fac.quantity_total.toString().trim() === "") {
      notify("กรุณาใส่จำนวนทั้งหมด", "error");
      return;
    }

    const price = parseInt(fac.fac_price);
    const quantity = parseInt(fac.quantity_total);

    if (isNaN(price) || price < 0) {
      notify("ราคาต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0", "error");
      return;
    }

    if (isNaN(quantity) || quantity <= 0) {
      notify("จำนวนต้องเป็นตัวเลขที่มากกว่า 0", "error");
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
        fac_price: price,
        quantity_total: quantity,
        description: fac.description.trim(),
      })
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

        setNewFac((prev) => {
          const remaining = prev.filter((_, i) => i !== index);
          if (remaining.length === 0) {
            setShowNewFacilityInput(false);
          }
          return remaining;
        });
      } else {
        notify("เกิดข้อผิดพลาด: " + (data.error || data.message || "ไม่ทราบสาเหตุ"), "error");
      }
    } catch (err) {
      console.error("Save facility error:", err);
      notify("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const startEditing = (fieldName, currentValue) => {
    setEditingField(fieldName);
    setUpdatedValue(currentValue);
    if (fieldName === "open_days") {
      if (field && Array.isArray(field.open_days)) {
        setSelectedDays(field.open_days);
      }
    }
    if (fieldName === "field_description") {
      setEditorContent(currentValue || "");
    }
  };

  const handleEditorChange = (content) => {
    setEditorContent(content);
    setUpdatedValue(content);
  };

  const saveSubField = async (sub_field_id) => {
    if (!updatedSportId) {
      notify("กรุณาเลือกประเภทกีฬาก่อนบันทึก", "error");
      return;
    }

    if (field && field.price_deposit != null) {
      const deposit = Number(field.price_deposit) || 0;
      if (!isNaN(deposit) && deposit > 0) {
        const prospectivePrices = (subFields || [])
          .map((s) =>
            Number(s.sub_field_id === sub_field_id ? updatedPrice : s.price)
          )
          .filter((p) => !isNaN(p) && p >= 0);
        if (prospectivePrices.length > 0) {
          const newMin = Math.min(...prospectivePrices);
          if (deposit > newMin) {
            notify(`ไม่สามารถตั้งราคานี้ได้ เพราะค่ามัดจำปัจจุบัน (${deposit} บาท) ต้องไม่มากกว่าราคาสนามย่อยที่ถูกที่สุดหลังแก้ไข (${newMin} บาท)`, "error");
            return;
          }
        }
      }
    }
    if (!updatedSubFieldName || updatedSubFieldName.trim() === "") {
      notify("กรุณาระบุชื่อสนามย่อย", "error");
      return;
    }
    if (!updatedSubFieldPlayer || isNaN(updatedSubFieldPlayer)) {
      notify("กรุณาระบุจำนวนผู้เล่นต่อทีมเป็นตัวเลข", "error");
      return;
    }
    if (!updatedSubFieldWid || isNaN(updatedSubFieldWid)) {
      notify("กรุณาระบุความกว้างของสนามเป็นตัวเลข", "error");
      return;
    }
    if (!updatedSubFieldLength || isNaN(updatedSubFieldLength)) {
      notify("กรุณาระบุความยาวของสนามเป็นตัวเลข", "error");
      return;
    }
    SetstartProcessLoad(true);
    try {
      const response = await fetch(
        `${API_URL}/field/supfiled/${sub_field_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
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
        }
      );

      const result = await response.json();
      if (response.ok) {
        notify("อัปเดตสนามย่อยสำเร็จ", "success");
        setSubFields((prevSubFields) =>
          prevSubFields.map((sub) =>
            sub.sub_field_id === sub_field_id
              ? {
                  ...sub,
                  sub_field_name: updatedSubFieldName,
                  players_per_team: updatedSubFieldPlayer,
                  wid_field: updatedSubFieldWid,
                  length_field: updatedSubFieldLength,
                  field_surface: updatedSubFieldFieldSurface,
                  price: updatedPrice,
                  sport_id: updatedSportId,
                }
              : sub
          )
        );
        cancelEditing();
      } else {
        notify("เกิดข้อผิดพลาดในการอัปเดตข้อมูลสนาม", "error");
      }
    } catch (error) {
      console.error("Error saving sub-field:", error);
      notify("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      SetstartProcessLoad(false);
    }
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
  };

  const handleImgChange = (e) => {
    const file = e.target.files[0];
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      notify("ไฟล์รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 5MB)", "error");
      e.target.value = null;
      return;
    }

    if (file.type.startsWith("image/")) {
      setSelectedFile(file);
      setUpdatedValue(file.name);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      e.target.value = null;
      notify("โปรดเลือกเฉพาะไฟล์รูปภาพเท่านั้น", "error");
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    const MAX_FILES = 10;
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    let isValid = true;

    if (files.length > MAX_FILES) {
      notify(`คุณสามารถอัพโหลดได้สูงสุด ${MAX_FILES} ไฟล์`, "error");
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

  const saveImageField = async () => {
    SetstartProcessLoad(true);
    try {
      if (!selectedFile) {
        notify("กรุณาเลือกไฟล์ก่อนอัปโหลด", "error");
        return;
      }

      const formData = new FormData();
      formData.append("img_field", selectedFile);
      const response = await fetch(`${API_URL}/field/${fieldId}/upload-image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      let result = await response.json();

      if (response.ok) {
        notify("อัปโหลดรูปสำเร็จ", "success");
        setField({ ...field, img_field: result.path });
        setEditingField(null);
        setSelectedFile(null);
      } else {
        notify("เกิดข้อผิดพลาด: " + (result.error || "ไม่ทราบสาเหตุ"), "error");
      }
    } catch (error) {
      console.error("Error saving image field:", error);
      notify("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const saveDocumentField = async () => {
    SetstartProcessLoad(true);
    try {
      if (!selectedFile || selectedFile.length === 0) {
        notify("กรุณาเลือกไฟล์เอกสารก่อนอัปโหลด", "error");
        return;
      }
      const formData = new FormData();
      for (let i = 0; i < selectedFile.length; i++) {
        formData.append("documents", selectedFile[i]);
      }

      if (field?.documents) {
        formData.append("existing_documents", field.documents);
      }

      const response = await fetch(
        `${API_URL}/field/${fieldId}/upload-document`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      let result = await response.json();

      if (response.ok) {
        notify("อัปโหลดเอกสารสำเร็จ", "success");

        const allDocuments = result.all_documents || result.paths || [];

        setField({
          ...field,
          documents: Array.isArray(allDocuments)
            ? allDocuments.join(",")
            : allDocuments,
        });
        setEditingField(null);
        setSelectedFile(null);
      } else {
        notify("เกิดข้อผิดพลาด: " + (result.error || "ไม่ทราบสาเหตุ"), "error");
      }
    } catch (error) {
      console.error("Error saving document field:", error);
      notify("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const handleDeleteDocument = async (docUrl, index) => {
    if (!window.confirm("ต้องการลบเอกสารนี้หรือไม่?")) {
      return;
    }

    SetstartProcessLoad(true);
    try {
      const response = await fetch(
        `${API_URL}/field/${fieldId}/delete-document`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ document_url: docUrl }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        notify("ลบเอกสารสำเร็จ", "success");

        const currentDocs = Array.isArray(field.documents)
          ? field.documents
          : field.documents.split(",");

        const updatedDocs = currentDocs.filter((doc, i) => i !== index);

        setField({
          ...field,
          documents: updatedDocs.join(","),
        });
      } else {
        notify("เกิดข้อผิดพลาด: " + (result.error || "ไม่สามารถลบเอกสารได้"), "error");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      notify("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const handleEditSingleDocument = (index, docUrl) => {
    setEditingSingleDoc({ index, docUrl });
  };

  const handleSingleDocFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      notify("ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5MB)", "error");
      return;
    }
    const fileType = file.type;
    if (!fileType.startsWith("image/") && fileType !== "application/pdf") {
      notify("โปรดเลือกเฉพาะไฟล์รูปภาพหรือ PDF เท่านั้น", "error");
      return;
    }

    setSingleDocFile(file);
  };

  const saveSingleDocument = async () => {
    if (!singleDocFile || !editingSingleDoc) {
      notify("กรุณาเลือกไฟล์ก่อนบันทึก", "error");
      return;
    }

    SetstartProcessLoad(true);
    try {
      const formData = new FormData();
      formData.append("document", singleDocFile);
      formData.append("document_index", editingSingleDoc.index);
      formData.append("old_document_url", editingSingleDoc.docUrl);

      const response = await fetch(
        `${API_URL}/field/${fieldId}/replace-single-document`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const result = await response.json();

      if (response.ok) {
        notify("แก้ไขเอกสารสำเร็จ", "success");

        const currentDocs = Array.isArray(field.documents)
          ? field.documents
          : field.documents.split(",");

        currentDocs[editingSingleDoc.index] = result.new_document_url;

        setField({
          ...field,
          documents: currentDocs.join(","),
        });

        setEditingSingleDoc(null);
        setSingleDocFile(null);
      } else {
        notify("เกิดข้อผิดพลาด: " + (result.error || "ไม่สามารถแก้ไขเอกสารได้"), "error");
      }
    } catch (error) {
      console.error("Error replacing document:", error);
      notify("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const cancelSingleDocEdit = () => {
    setEditingSingleDoc(null);
    setSingleDocFile(null);
  };

  const isEmptyValue = (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === "string") return value.trim() === "";
    if (typeof value === "number") return false;
    if (value instanceof File) return value.size === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "object") return Object.keys(value).length === 0;
    return false;
  };

  const saveField = async (fieldName) => {
    if (fieldName === "open_days") {
      if (!selectedDays || selectedDays.length === 0) {
        notify("กรุณาเลือกอย่างน้อย 1 วัน", "error");
        return;
      }
      SetstartProcessLoad(true);
      try {
        const response = await fetch(`${API_URL}/field/update/${fieldId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ open_days: selectedDays }),
        });

        const result = await response.json();

        if (response.ok) {
          setField({ ...field, open_days: [...selectedDays] });
          setEditingField(null);
          notify("อัปเดตข้อมูลสำเร็จ", "success");
        } else {
          notify("เกิดข้อผิดพลาด: " + (result.error || "ไม่ทราบสาเหตุ"), "error");
        }
      } catch (error) {
        console.error("Error saving field:", error);
        notify("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
      } finally {
        SetstartProcessLoad(false);
      }
      return;
    }

    if (isEmptyValue(updatedValue)) {
      notify("ห้ามปล่อยค่าว่าง หรือ ลบออกทั้งหมด", "error");
      return;
    }

    if (fieldName === "price_deposit") {
      const deposit = Number(updatedValue);
      if (isNaN(deposit) || deposit < 0) {
        notify("ค่ามัดจำไม่ถูกต้อง", "error");
        return;
      }
      const prices = (subFields || [])
        .map((s) => Number(s.price))
        .filter((p) => !isNaN(p) && p >= 0);
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        if (deposit > minPrice) {
          notify(`ค่ามัดจำต้องไม่มากกว่าราคาสนามย่อยที่ถูกที่สุด (${minPrice} บาท)`, "error");
          return;
        }
      }
    }
    SetstartProcessLoad(true);
    try {
      const response = await fetch(`${API_URL}/field/update/${fieldId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ [fieldName]: updatedValue }),
      });

      const result = await response.json();

      if (response.ok) {
        setField({ ...field, [fieldName]: updatedValue });
        setEditingField(null);
        notify("อัปเดตข้อมูลสำเร็จ", "success");
      } else {
        notify("เกิดข้อผิดพลาด: " + (result.error || "ไม่ทราบสาเหตุ"), "error");
      }
    } catch (error) {
      console.error("Error saving field:", error);
      notify("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const addSubField = async (userId) => {
    if (!newSportId) {
      notify("กรุณาเลือกประเภทกีฬาก่อนเพิ่มสนาม", "error");
      return;
    }

    if (field && field.price_deposit != null) {
      const deposit = Number(field.price_deposit) || 0;
      if (!isNaN(deposit) && deposit > 0) {
        const candidatePrice = Number(newSubField.price);
        const prices = [
          ...(subFields || []).map((s) => Number(s.price)),
          candidatePrice,
        ].filter((p) => !isNaN(p) && p >= 0);
        if (prices.length > 0) {
          const newMin = Math.min(...prices);
          if (deposit > newMin) {
            notify(`ค่ามัดจำปัจจุบัน (${deposit} บาท) มากกว่าราคาสนามย่อยที่ถูกที่สุดหลังเพิ่ม (${newMin} บาท) กรุณาปรับราคาหรือแก้ไขค่ามัดจำ`, "error");
            return;
          }
        }
      }
    }

    SetstartProcessLoad(true);
    try {
      const response = await fetch(`${API_URL}/field/subfield/${fieldId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          sub_field_name: newSubField.sub_field_name,
          players_per_team: newSubField.players_per_team,
          wid_field: newSubField.wid_field,
          length_field: newSubField.length_field,
          field_surface: newSubField.field_surface,
          price: newSubField.price,
          user_id: userId,
          sport_id: newSportId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        notify(errorData.message || "ไม่สามารถเพิ่มสนามย่อยได้", "error");
        return;
      }
      const newField = await response.json();

      const selectedSport = sportsCategories.find(
        (sport) => sport.sport_id === parseInt(newSportId)
      );

      const newFieldWithSportName = {
        ...newField,
        sport_name: selectedSport
          ? selectedSport.sport_name
          : "ไม่ระบุประเภทกีฬา",
      };

      setSubFields([...subFields, newFieldWithSportName]);
      notify("เพิ่มสนามย่อยสำเร็จ", "success");
    } catch (error) {
      console.error("Error: ", error);
      notify("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const handleDeleteClick = (subField) => {
    setSelectedSubField(subField);
    setShowDeleteModal(true);
  };

  const confirmDeleteSubField = async () => {
    if (selectedSubField) {
      if (selectedSubField.add_ons && selectedSubField.add_ons.length > 0) {
        for (const addon of selectedSubField.add_ons) {
          await deleteAddOn(addon.add_on_id);
        }
      }
      await deleteSubField(selectedSubField.sub_field_id);
      setShowDeleteModal(false);
      setSelectedSubField(null);
    }
  };

  const deleteSubField = async (sub_field_id) => {
    if (!sub_field_id || isNaN(sub_field_id)) {
      notify("Invalid sub-field ID", "error");
      return;
    }
    SetstartProcessLoad(true);
    try {
      const response = await fetch(
        `${API_URL}/field/delete/subfield/${sub_field_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (response.ok) {
        notify("ลบสนามย่อยสำเร็จ", "success");
        setSubFields((prevSubFields) =>
          prevSubFields.filter((sub) => sub.sub_field_id !== sub_field_id)
        );
      } else {
        const errorData = await response.json();
        notify(errorData.error || "เกิดข้อผิดพลาดในการลบสนาม", "error");
      }
    } catch (error) {
      console.error("Error deleting sub-field:", error);
      notify("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const addAddOn = async (subFieldId, content, price) => {
    SetstartProcessLoad(true);
    try {
      const res = await fetch(`${API_URL}/field/addon`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          sub_field_id: subFieldId,
          content,
          price,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        setSubFields((prevSubFields) =>
          prevSubFields.map((sub) =>
            sub.sub_field_id === subFieldId
              ? {
                  ...sub,
                  add_ons: [...(sub.add_ons || []), result],
                }
              : sub
          )
        );
        notify("เพิ่มสำเร็จ", "success");
      } else {
        notify(result.message || "เกิดข้อผิดพลาด", "error");
      }
    } catch (err) {
      console.error("ผิดพลาดขณะเพิ่ม Add-on:", err);
      notify("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const confirmDeleteAddOn = async () => {
    if (!selectedAddOn) return;
    await deleteAddOn(selectedAddOn.add_on_id);
    setShowDeleteAddOnModal(false);
    setSelectedAddOn(null);
  };

  const deleteAddOn = async (add_on_id) => {
    SetstartProcessLoad(true);
    try {
      const response = await fetch(
        `${API_URL}/field/delete/addon/${add_on_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (response.ok) {
        notify("ลบสำเร็จ", "success");
        setSubFields((prevSubFields) =>
          prevSubFields.map((sub) => ({
            ...sub,
            add_ons: (sub.add_ons || []).filter(
              (addon) => addon.add_on_id !== add_on_id
            ),
          }))
        );
      } else {
        notify("เกิดข้อผิดพลาดในการลบกิจกรรมพิเศษ", "error");
      }
    } catch (error) {
      console.error("Error deleting add-on:", error);
      notify("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
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
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            content: editingAddon.content,
            price: editingAddon.price,
          }),
        }
      );

      if (response.ok) {
        notify("แก้ไขสำเร็จ", "success");
        setSubFields((prevSubFields) =>
          prevSubFields.map((sub) => ({
            ...sub,
            add_ons: (sub.add_ons || []).map((addon) =>
              addon.add_on_id === editingAddon.addOnId
                ? {
                    ...addon,
                    content: editingAddon.content,
                    price: editingAddon.price,
                  }
                : addon
            ),
          }))
        );
        setEditingAddon({ addOnId: null, content: "", price: "" });
      } else {
        notify("เกิดข้อผิดพลาดในการอัปเดต", "error");
      }
    } catch (error) {
      console.error("Error saving add-on:", error);
      notify("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      SetstartProcessLoad(false);
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

  const handleAddOnInputChange = (subFieldId, key, value) => {
    setAddOnInputs((prev) => ({
      ...prev,
      [subFieldId]: {
        ...prev[subFieldId],
        [key]: value,
      },
    }));
  };

  const upDateStatus = async () => {
    SetstartProcessLoad(true);
    try {
      const res = await fetch(`${API_URL}/field/appeal/${field.field_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          status: "รอตรวจสอบ",
        }),
      });

      if (res.ok) {
        notify("ส่งคำขอสำเร็จ", "success");
        setTimeout(() => {
          router.push("/my-field");
        }, 2000);
      } else {
        notify("เกิดข้อผิดพลาดในการอัปเดต", "error");
      }
    } catch (err) {
      console.error("Error:", err);
      notify(err.message, "error");
    } finally {
      SetstartProcessLoad(false);
    }
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
  const dayCodes = Object.keys(daysInThai);
  const weekdayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const sortDays = (arr) =>
    arr
      .slice()
      .sort((a, b) => weekdayOrder.indexOf(a) - weekdayOrder.indexOf(b));

  const handleDayToggle = (dayCode) => {
    setSelectedDays((prev) => {
      let next = prev.includes(dayCode)
        ? prev.filter((d) => d !== dayCode)
        : [...prev, dayCode];
      return sortDays(next);
    });
  };

  const formatPrice = (value) => new Intl.NumberFormat("th-TH").format(value);

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

  if (user?.status !== USER_STATUS.VERIFIED) {
    router.push("/verification");
    return null;
  }

  if (user?.role !== USER_ROLE.ADMIN && user?.role !== USER_ROLE.FIELD_OWNER) {
    router.push("/");
    return null;
  }

  return (
    <div className="editfield-container">
      <h1>แก้ไขสนามกีฬา</h1>

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

      <EditVenueBasicInfo
        field={field}
        editingField={editingField}
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
      />

      <EditVenueDescription
        field={field}
        editingField={editingField}
        editorContent={editorContent}
        handleEditorChange={handleEditorChange}
        saveField={saveField}
        cancelEditing={cancelEditing}
        startEditing={startEditing}
        startProcessLoad={startProcessLoad}
      />

      <ManageFieldDocuments
        field={field}
        editingField={editingField}
        startProcessLoad={startProcessLoad}
        handleFileChange={handleFileChange}
        saveDocumentField={saveDocumentField}
        cancelEditing={cancelEditing}
        handleDeleteDocument={handleDeleteDocument}
        handleEditSingleDocument={handleEditSingleDocument}
        editingSingleDoc={editingSingleDoc}
        singleDocFile={singleDocFile}
        handleSingleDocFileChange={handleSingleDocFileChange}
        saveSingleDocument={saveSingleDocument}
        cancelSingleDocEdit={cancelSingleDocEdit}
      />

      <div className="check-field-info"></div>

      <ManageFacilities
        fieldId={fieldId}
        facilities={facilities}
        editingFacility={editingFacility}
        editFacilityData={editFacilityData}
        handleEditFacility={handleEditFacility}
        handleCancelEdit={handleCancelEdit}
        handleSaveEditFacility={handleSaveEditFacility}
        handleEditInputChange={handleEditInputChange}
        handleEditImageChange={handleEditImageChange}
        handleConfirmDelete={handleConfirmDelete}
        showNewFacilityInput={showNewFacilityInput}
        handleToggleNewFacility={handleToggleNewFacility}
        newFac={newFac}
        setNewFac={setNewFac}
        handleChange={handleChange}
        onSaveNewFac={onSaveNewFac}
        startProcessLoad={startProcessLoad}
        formatPrice={formatPrice}
        notify={notify}
      />

      <ManageSubFields
        field={field}
        subFields={subFields}
        sportsCategories={sportsCategories}
        editingField={editingField}
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
        handleDeleteClick={handleDeleteClick}
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
        handleAddOnInputChange={handleAddOnInputChange}
        addAddOn={addAddOn}
        editingAddon={editingAddon}
        setEditingAddon={setEditingAddon}
        saveAddon={saveAddon}
        setSelectedAddOn={setSelectedAddOn}
        setShowDeleteAddOnModal={setShowDeleteAddOnModal}
        startProcessLoad={startProcessLoad}
        formatPrice={formatPrice}
        notify={notify}
        startEditingAddon={startEditingAddon}
      />

      {field?.status == FIELD_STATUS.REJECTED && (
        <div className="editbtn-editfield-request">
          <button
            onClick={upDateStatus}
            style={{
              cursor: startProcessLoad ? "not-allowed" : "pointer",
            }}
            disabled={startProcessLoad}
            className="editbtn-editfield"
          >
            {startProcessLoad ? (
              <span className="dot-loading">
                <span className="dot one">●</span>
                <span className="dot two">●</span>
                <span className="dot three">●</span>
              </span>
            ) : (
              "ส่งคำขอลงทะเบียนสนามอีกครั้ง"
            )}
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
                style={{
                  cursor: startProcessLoad ? "not-allowed" : "pointer",
                }}
                disabled={startProcessLoad}
                className="savebtn-editfield"
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
                className="canbtn-editfield"
                style={{
                  cursor: startProcessLoad ? "not-allowed" : "pointer",
                }}
                disabled={startProcessLoad}
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
                style={{
                  cursor: startProcessLoad ? "not-allowed" : "pointer",
                }}
                disabled={startProcessLoad}
                className="savebtn-editfield"
                onClick={confirmDeleteAddOn}
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
                className="canbtn-editfield"
                onClick={() => {
                  setShowDeleteAddOnModal(false);
                  setSelectedAddOn(null);
                }}
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
            <p
              style={{
                color: "#dc3545",
                fontSize: "16px",
                marginTop: "10px",
                marginBottom: "10px",
                fontWeight: "bold",
              }}
            >
              หมายเหตุ: การลบสิ่งอำนวยความสะดวกจะลบข้อมูลการจองที่เกี่ยวข้องด้วย
            </p>
            <div className="modal-actions-editfield">
              <button
                style={{
                  cursor: startProcessLoad ? "not-allowed" : "pointer",
                }}
                disabled={startProcessLoad}
                className="savebtn-editfield"
                onClick={handleDeleteFacility}
              >
                {startProcessLoad ? (
                  <span className="dot-loading">
                    <span className="dot one">●</span>
                    <span className="dot two">●</span>
                    <span className="dot three">●</span>
                  </span>
                ) : (
                  "ลบ"
                )}
              </button>
              <button
                style={{
                  cursor: startProcessLoad ? "not-allowed" : "pointer",
                }}
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
    </div>
  );
}
