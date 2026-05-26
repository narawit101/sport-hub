import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { USER_STATUS, ACCOUNT_TYPE } from "@/constants/status";

export function useFieldRegistration(user, notify) {
  const router = useRouter();
  const [sports, setSports] = useState([]);
  const [subFields, setSubFields] = useState([]);
  const [otherChecked, setOtherChecked] = useState(false);
  const [otherFacility, setOtherFacility] = useState({ name: "", price: "", quantity: "" });
  const [dataLoading, setDataLoading] = useState(true);
  const [startProcessLoad, setStartProcessLoad] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const AVAILABLE_FACILITIES = [
    { fac_name: "ห้องน้ำ" }, { fac_name: "ห้องแต่งตัว" }, { fac_name: "ตู้ล็อคเกอร์" },
    { fac_name: "ห้องอาบน้ำ" }, { fac_name: "ที่จอดรถ" }, { fac_name: "Wi-Fi" },
    { fac_name: "รองเท้า" }, { fac_name: "ร้านค้า" }, { fac_name: "ตู้แช่" },
    { fac_name: "พัดลม" }, { fac_name: "แอร์" }, { fac_name: "ลำโพง" },
  ];
  const [facilities, setFacilities] = useState(AVAILABLE_FACILITIES);
  const [selectedFacilities, setSelectedFacilities] = useState({});

  const getDefaultBanks = () => [
    { code: "bbl", name: "ธนาคารกรุงเทพ" }, { code: "kbank", name: "ธนาคารกสิกรไทย" },
    { code: "scb", name: "ธนาคารไทยพาณิชย์" }, { code: "ktb", name: "ธนาคารกรุงไทย" },
    { code: "tmb", name: "ธนาคารทหารไทย" }, { code: "bay", name: "ธนาคารกรุงศรีอยุธยา" },
    { code: "gsb", name: "ธนาคารออมสิน" }, { code: "uob", name: "ธนาคาร ยูโอบี" },
    { code: "lhfg", name: "ธนาคารแลนด์ แอนด์ เฮ้าส์" }, { code: "tisco", name: "ธนาคารทิสโก้" },
    { code: "kk", name: "ธนาคารเกียรตินาคิน" }, { code: "ttb", name: "ธนาคาร ทีทีบี" },
    { code: "baac", name: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร" },
  ];
  const [banks, setBanks] = useState(getDefaultBanks());
  const [loadingBanks, setLoadingBanks] = useState(false);

  const [fieldData, setFieldData] = useState({
    field_name: "", address: "", gps_location: "", documents: null,
    open_hours: "", close_hours: "", img_field: null, preview_img: null,
    number_bank: "", account_holder: "", price_deposit: "", name_bank: "",
    selectedSport: "", depositChecked: false, open_days: [],
    field_description: "", cancel_hours: "", slot_duration: "",
    account_type: ""
  });

  const fetchSports = useCallback(async () => {
    try {
      const data = await apiClient.get("/sports_types");
      setSports(data);
    } catch (error) {
      console.error("โหลดไม่สำเร็จ:", error.message);
      notify("ไม่สามารถโหลดข้อมูลกีฬาได้", "error");
    } finally {
      setDataLoading(false);
    }
  }, [notify]);

  const fetchBanks = useCallback(async () => {
    setLoadingBanks(true);
    try {
      const response = await fetch("https://api.omise.co/capability", {
        headers: {
          Authorization: `Basic ${btoa(process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY + ":")}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.banks && Array.isArray(data.banks)) {
          const bankList = data.banks.filter(b => b !== "test").map(b => ({
            code: b,
            name: getBankName(b)
          }));
          setBanks(bankList);
        }
      }
    } catch (error) {
      console.warn("Omise API error:", error.message);
    } finally {
      setLoadingBanks(false);
    }
  }, []);

  const getBankName = (code) => {
    const bankNames = {
        bbl: "ธนาคารกรุงเทพ", kbank: "ธนาคารกสิกรไทย", scb: "ธนาคารไทยพาณิชย์", ktb: "ธนาคารกรุงไทย",
        tmb: "ธนาคารทหารไทย", bay: "ธนาคารกรุงศรีอยุธยา", gsb: "ธนาคารออมสิน", uob: "ธนาคาร ยูโอบี",
        tisco: "ธนาคารทิสโก้", kk: "ธนาคารเกียรตินาคิน", ttb: "ธนาคาร ทีทีบี",
        baac: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร",
    };
    return bankNames[code] || `ธนาคาร ${code.toUpperCase()}`;
  };

  useEffect(() => {
    fetchSports();
    fetchBanks();
  }, [fetchSports, fetchBanks]);

  useEffect(() => {
    if (user && subFields.length === 0) {
      setSubFields([{
        name: "", price: "", sport_id: "", user_id: user.user_id,
        addOns: [], wid_field: "", length_field: "", players_per_team: "", field_surface: ""
      }]);
    }
  }, [user, subFields.length]);

  const handleFieldChange = (e) => {
    setFieldData({ ...fieldData, [e.target.name]: e.target.value });
  };

  const handleEditorChange = (content) => {
    setFieldData({ ...fieldData, field_description: content });
  };

  const handleCheckboxChange = (e) => {
    const { checked } = e.target;
    setFieldData({
      ...fieldData,
      depositChecked: checked,
      price_deposit: checked ? fieldData.price_deposit : "",
    });
  };

  const handlePriceChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length >= 7) {
      notify("ใส่ได้ไม่เกิน 6 หลัก", "error");
      return;
    }
    setFieldData({ ...fieldData, price_deposit: value });
  };

  const handleimgChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      notify("ไฟล์รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 5MB)", "error");
      return;
    }
    setFieldData({ ...fieldData, img_field: file, imgPreview: URL.createObjectURL(file) });
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 10) {
      notify("คุณสามารถอัพโหลดได้สูงสุด 10 ไฟล์", "error");
      return;
    }
    setFieldData({ ...fieldData, documents: files });
  };

  const handleOtherFacilityConfirm = () => {
    const name = otherFacility.name.trim();
    if (!name) { notify("กรุณากรอกชื่อสิ่งอำนวยความสะดวก", "error"); return; }
    if (!facilities.some((f) => f.fac_name === name)) setFacilities((prev) => [...prev, { fac_name: name }]);
    setSelectedFacilities((prev) => ({ ...prev, [name]: { price: otherFacility.price, quantity: otherFacility.quantity, imageFile: null, preview: null } }));
    setOtherFacility({ name: "", price: "", quantity: "" });
    setOtherChecked(false);
  };

  const handleFacilityChange = (facId) => {
    setSelectedFacilities((prev) => {
      const copy = { ...prev };
      if (copy[facId]) {
        if (copy[facId].preview) URL.revokeObjectURL(copy[facId].preview);
        delete copy[facId];
      } else {
        copy[facId] = { price: "", quantity: "", description: "", imageFile: null, preview: null };
      }
      return copy;
    });
  };

  const handleFacilityImageChange = (facId, file) => {
    if (!file) return;
    setSelectedFacilities((prev) => {
      const cur = prev[facId] || { price: "", quantity: "", imageFile: null, preview: null };
      if (cur.preview) URL.revokeObjectURL(cur.preview);
      return { ...prev, [facId]: { ...cur, imageFile: file, preview: URL.createObjectURL(file) } };
    });
  };

  const handleRemoveFacilityImage = (facId) => {
    setSelectedFacilities((prev) => {
      const cur = prev[facId];
      if (!cur) return prev;
      if (cur.preview) URL.revokeObjectURL(cur.preview);
      return { ...prev, [facId]: { ...cur, imageFile: null, preview: null } };
    });
  };

  const handleFacilityPriceChange = (facId, value) => {
    setSelectedFacilities((prev) => ({ ...prev, [facId]: { ...(prev[facId] || {}), price: value } }));
  };

  const handleFacilityQuantityChange = (facId, value) => {
    setSelectedFacilities((prev) => ({ ...prev, [facId]: { ...(prev[facId] || {}), quantity: value } }));
  };

  const handleFacilityDescription = (facId, value) => {
    setSelectedFacilities((prev) => ({ ...prev, [facId]: { ...(prev[facId] || {}), description: value } }));
  };

  const addSubField = () => {
    setSubFields([...subFields, { name: "", price: "", sport_id: "", user_id: user?.user_id, addOns: [], wid_field: "", length_field: "", players_per_team: "", field_surface: "" }]);
  };

  const removeSubField = (index) => setSubFields(subFields.filter((_, i) => i !== index));

  const updateSubField = (index, key, value) => {
    const updated = [...subFields];
    updated[index][key] = value;
    setSubFields(updated);
  };

  const addAddOn = (subIndex) => {
    const updated = [...subFields];
    updated[subIndex].addOns.push({ content: "", price: "" });
    setSubFields(updated);
  };

  const updateAddOn = (subIndex, addOnIndex, key, value) => {
    const updated = [...subFields];
    updated[subIndex].addOns[addOnIndex][key] = value;
    setSubFields(updated);
  };

  const removeAddOn = (subIndex, addOnIndex) => {
    const updated = [...subFields];
    updated[subIndex].addOns.splice(addOnIndex, 1);
    setSubFields(updated);
  };

  const handleAccountTypeChange = (e) => {
    const value = e.target.value;
    setFieldData({ ...fieldData, account_type: value, name_bank: value === ACCOUNT_TYPE.PROMPTPAY ? ACCOUNT_TYPE.PROMPTPAY : fieldData.name_bank });
  };

  const validateForm = () => {
    if (!user) { notify("กรุณาเข้าสู่ระบบก่อน!", "error"); return false; }
    if (!fieldData.field_name || !fieldData.address || !fieldData.gps_location || !fieldData.open_hours || !fieldData.close_hours || !fieldData.slot_duration || !fieldData.account_type || !fieldData.number_bank || !fieldData.account_holder || !fieldData.name_bank || !fieldData.field_description || !fieldData.cancel_hours || fieldData.open_days.length === 0) {
      notify("กรุณากรอกข้อมูลให้ครบถ้วน", "error"); return false;
    }
    for (let i = 0; i < subFields.length; i++) {
        if (!subFields[i].name || !subFields[i].sport_id || !subFields[i].players_per_team) {
            notify(`กรุณากรอกข้อมูลสนามย่อยที่ ${i + 1} ให้ครบ`, "error"); return false;
        }
    }
    if (!fieldData.documents) { notify("กรุณาอัพโหลดเอกสารประกอบ", "error"); return false; }
    if (!fieldData.img_field) { notify("กรุณาอัพโหลดรูปสนาม", "error"); return false; }
    return true;
  };

  const handlePreview = (e) => { e.preventDefault(); if (validateForm()) setShowPreview(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setStartProcessLoad(true);
    const formData = new FormData();
    if (fieldData.documents) {
        for (let i = 0; i < fieldData.documents.length; i++) formData.append("documents", fieldData.documents[i]);
    }
    formData.append("img_field", fieldData.img_field);

    const facilitiesPayload = {};
    Object.keys(selectedFacilities).forEach((id, idx) => {
      const { price, quantity, description, imageFile } = selectedFacilities[id];
      const safeKey = id.replace(/\s+/g, '-').toLowerCase() + idx;
      facilitiesPayload[id] = { price: String(price), quantity_total: String(quantity), description: String(description), _key: safeKey };
      if (imageFile) formData.append(`facility_image_${safeKey}`, imageFile);
    });

    formData.append("data", JSON.stringify({
      user_id: user.user_id, ...fieldData, selectedFacilities: facilitiesPayload, subFields,
      price_deposit: fieldData.depositChecked ? fieldData.price_deposit : "0",
      cancel_hours: parseInt(fieldData.cancel_hours, 10) || 0,
      slot_duration: parseInt(fieldData.slot_duration, 10) || 0,
    }));

    try {
      await apiClient.postForm("/field/register", formData);
      notify("ลงทะเบียนสนามเรียบร้อยรอผู้ดูแลระบบตรวจสอบ", "success");
      router.replace("/");
    } catch (error) {
      notify(error.message || "เกิดข้อผิดพลาดในการส่งข้อมูล", "error");
    } finally {
      setShowPreview(false);
      setStartProcessLoad(false);
    }
  };

  return {
    sports, subFields, otherChecked, setOtherChecked, otherFacility, setOtherFacility,
    dataLoading, startProcessLoad, showPreview, setShowPreview, facilities, selectedFacilities,
    banks, loadingBanks, fieldData, setFieldData, handleFieldChange, handleEditorChange,
    handleCheckboxChange, handlePriceChange, handleimgChange, handleFileChange,
    handleOtherFacilityConfirm, handleFacilityChange, handleFacilityImageChange,
    handleRemoveFacilityImage, handleFacilityPriceChange, handleFacilityQuantityChange,
    handleFacilityDescription, addSubField, removeSubField, updateSubField,
    addAddOn, updateAddOn, removeAddOn, handleAccountTypeChange, handlePreview, handleSubmit
  };
}
