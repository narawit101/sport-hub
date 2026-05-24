const fieldService = require("../services/fieldService");
const { FIELD_STATUS } = require("../utils/constants");

class FieldController {
  async registerField(req, res) {
    try {
      const data = JSON.parse(req.body.data || "{}");
      const result = await fieldService.registerField(data, req.files || [], req.io);
      res.status(200).json({ message: "ลงทะเบียนสนามเรียบร้อย!", ...result });
    } catch (error) {
      console.error("REGISTER ERROR:", error);
      res.status(500).json({ error: "เกิดข้อผิดพลาดในการลงทะเบียนสนาม", details: error.message });
    }
  }

  async appealField(req, res) {
    const { field_id } = req.params;
    const { status } = req.body;
    try {
      if (status !== FIELD_STATUS.PENDING) return res.status(400).json({ error: "สถานะที่ส่งมาไม่ถูกต้อง" });
      const result = await fieldService.appealField(field_id, status, req.user, req.io);
      res.status(200).json({ message: "อัปเดตสถานะสำเร็จและส่งคำขอแก้ไขไปยังผู้ดูแลระบบ", data: result });
    } catch (error) {
      console.error("APPEAL ERROR:", error);
      res.status(error.message === "Unauthorized" ? 403 : 500).json({ error: error.message });
    }
  }

  async getFieldById(req, res) {
    const { field_id } = req.params;
    try {
      const result = await fieldService.getFieldById(field_id, req.user);
      res.json(result);
    } catch (error) {
      console.error("GET FIELD ERROR:", error);
      res.status(error.message.includes("สิทธิ์") ? 403 : 404).json({ error: error.message });
    }
  }

  async updateFieldStatus(req, res) {
    const { field_id } = req.params;
    const { status, reasoning } = req.body;
    try {
      const result = await fieldService.updateFieldStatus(field_id, { status, reasoning }, req.io, req.user);
      res.status(200).json({ message: "อัปเดตสถานะสนามสำเร็จ", data: result });
    } catch (error) {
      console.error("UPDATE STATUS ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async deleteField(req, res) {
    const { id } = req.params;
    try {
      await fieldService.deleteField(id, req.user, req.io);
      res.status(200).json({ message: "Field, subfields, addons, posts, and images deleted successfully" });
    } catch (error) {
      console.error("DELETE FIELD ERROR:", error);
      res.status(error.message.includes(" Unauthorized") ? 403 : 400).json({ message: error.message });
    }
  }

  async updateField(req, res) {
    const { field_id } = req.params;
    try {
      const result = await fieldService.updateField(field_id, req.body, req.user);
      res.json({ message: "อัปเดตข้อมูลสำเร็จ", data: result });
    } catch (error) {
      console.error("UPDATE FIELD ERROR:", error);
      res.status(error.message === "Unauthorized" ? 403 : 500).json({ error: error.message });
    }
  }

  async uploadFieldImage(req, res) {
    const { field_id } = req.params;
    const filePath = req.file?.path;
    try {
      if (!filePath) return res.status(400).json({ error: "ไม่พบไฟล์รูปภาพ" });
      const path = await fieldService.uploadFieldImage(field_id, filePath);
      res.json({ message: "อัปโหลดรูปสำเร็จ", path });
    } catch (error) {
      console.error("UPLOAD IMAGE ERROR:", error);
      res.status(500).json({ error: "อัปโหลดรูปไม่สำเร็จ", details: error.message });
    }
  }

  async uploadFieldDocuments(req, res) {
    const { field_id } = req.params;
    const { existing_documents } = req.body;
    try {
      if (!req.files || req.files.length === 0) return res.status(400).json({ error: "ไม่พบไฟล์เอกสาร" });
      const result = await fieldService.uploadFieldDocuments(field_id, existing_documents, req.files.map(f => f.path));
      res.json({ message: "อัปโหลดเอกสารสำเร็จ", paths: result.newFilePaths, all_documents: result.allDocuments });
    } catch (error) {
      console.error("UPLOAD DOCUMENTS ERROR:", error);
      res.status(500).json({ error: "อัปโหลดเอกสารไม่สำเร็จ", details: error.message });
    }
  }

  async deleteFieldDocument(req, res) {
    const { field_id } = req.params;
    const { document_url } = req.body;
    try {
      if (!document_url) return res.status(400).json({ error: "ไม่พบ URL เอกสารที่ต้องการลบ" });
      const remaining = await fieldService.deleteFieldDocument(field_id, document_url);
      res.json({ message: "ลบเอกสารสำเร็จ", remaining_documents: remaining });
    } catch (error) {
      console.error("DELETE DOCUMENT ERROR:", error);
      res.status(500).json({ error: "ลบเอกสารไม่สำเร็จ", details: error.message });
    }
  }

  async replaceSingleDocument(req, res) {
    const { field_id } = req.params;
    const { document_index, old_document_url } = req.body;
    try {
      if (!req.file) return res.status(400).json({ error: "ไม่พบไฟล์เอกสารใหม่" });
      if (document_index === undefined || !old_document_url) return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน" });
      const result = await fieldService.replaceSingleDocument(field_id, document_index, old_document_url, req.file.path);
      res.json({ message: "แก้ไขเอกสารสำเร็จ", new_document_url: result.newFilePath, all_documents: result.allDocuments });
    } catch (error) {
      console.error("REPLACE DOCUMENT ERROR:", error);
      res.status(500).json({ error: "แก้ไขเอกสารไม่สำเร็จ", details: error.message });
    }
  }

  async addSubField(req, res) {
    const { field_id } = req.params;
    try {
      const result = await fieldService.addSubField(field_id, req.body);
      res.json(result);
    } catch (error) {
      console.error("ADD SUBFIELD ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async addAddOn(req, res) {
    try {
      const result = await fieldService.addAddOn(req.body);
      res.status(201).json(result);
    } catch (error) {
      console.error("ADD ADDON ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async deleteAddOn(req, res) {
    const { id } = req.params;
    try {
      await fieldService.deleteAddOn(id);
      res.status(200).json({ message: "ลบ Add-on สำเร็จ" });
    } catch (error) {
      console.error("DELETE ADDON ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async updateSubField(req, res) {
    const { sub_field_id } = req.params;
    try {
      await fieldService.updateSubField(sub_field_id, req.body);
      res.json({ message: "สำเร็จ" });
    } catch (error) {
      console.error("UPDATE SUBFIELD ERROR:", error);
      res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลสนามย่อย" });
    }
  }

  async updateAddOn(req, res) {
    const { add_on_id } = req.params;
    try {
      await fieldService.updateAddOn(add_on_id, req.body);
      res.json({ message: "สำเร็จ" });
    } catch (error) {
      console.error("UPDATE ADDON ERROR:", error);
      res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปเดต Add-on" });
    }
  }

  async deleteSubField(req, res) {
    const { id } = req.params;
    try {
      await fieldService.deleteSubField(id);
      res.status(200).json({ message: "Subfield deleted successfully" });
    } catch (error) {
      console.error("DELETE SUBFIELD ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async saveFacilities(req, res) {
    const { field_id } = req.params;
    try {
      await fieldService.saveFacilities(field_id, req.body.selectedFacilities);
      res.status(200).json({ message: "บันทึกสำเร็จ" });
    } catch (error) {
      console.error("SAVE FACILITIES ERROR:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดระหว่างบันทึก" });
    }
  }

  async deleteFacility(req, res) {
    const { field_id, field_fac_id } = req.params;
    try {
      const bookingFacDeletedCount = await fieldService.deleteFacility(field_id, field_fac_id);
      let message = "ลบสิ่งอำนวยความสะดวกสำเร็จ";
      if (bookingFacDeletedCount > 0) {
        message += ` (ลบข้อมูลการจองที่เกี่ยวข้อง ${bookingFacDeletedCount} รายการ)`;
      }
      res.status(200).json({ message });
    } catch (error) {
      console.error("DELETE FACILITY ERROR:", error);
      res.status(500).json({ message: error.message });
    }
  }

  async getFieldData(req, res) {
    const { sub_field_id } = req.params;
    try {
      const result = await fieldService.getFieldData(sub_field_id);
      res.status(200).json({ message: "get data successfully", data: result });
    } catch (error) {
      console.error("GET FIELD DATA ERROR:", error);
      res.status(404).json({ error: error.message });
    }
  }

  async getFieldFacilities(req, res) {
    const { field_id } = req.params;
    try {
      const result = await fieldService.getFieldFacilities(field_id);
      res.status(200).json({
        success: true,
        data: result,
        message: result.length === 0 ? "No facilities for this field." : null,
      });
    } catch (error) {
      console.error("GET FACILITIES ERROR:", error);
      res.status(500).json({ success: false, data: [], error: error.message });
    }
  }

  async updateFacility(req, res) {
    const { field_fac_id } = req.params;
    try {
      let parsedData = req.body.data ? JSON.parse(req.body.data) : req.body;
      const { fac_name, fac_price, quantity_total } = parsedData;

      if (!fac_name || fac_name.toString().trim() === "") return res.status(400).json({ message: "กรุณาระบุชื่อสิ่งอำนวยความสะดวก" });
      if (fac_price === undefined || fac_price === null || fac_price === "") return res.status(400).json({ message: "กรุณาระบุราคา" });
      if (quantity_total === undefined || quantity_total === null || quantity_total === "") return res.status(400).json({ message: "กรุณาระบุจำนวน" });

      if (isNaN(parseFloat(fac_price)) || parseFloat(fac_price) < 0) return res.status(400).json({ message: "ราคาต้องเป็นตัวเลขที่ไม่ติดลบ" });
      if (isNaN(parseInt(quantity_total)) || parseInt(quantity_total) < 1) return res.status(400).json({ message: "จำนวนต้องเป็นตัวเลขที่มากกว่า 0" });

      const result = await fieldService.updateFacility(field_fac_id, parsedData, req.file);
      res.status(200).json({ message: "แก้ไขสิ่งอำนวยความสะดวกสำเร็จ", facility: result });
    } catch (error) {
      console.error("UPDATE FACILITY ERROR:", error);
      if (req.file) await deleteCloudinaryFile(req.file.path).catch(() => {});
      res.status(500).json({ message: error.message });
    }
  }

  async updateFieldLocation(req, res) {
    const { field_id } = req.params;
    const { gps_location } = req.body;
    try {
      const result = await fieldService.updateFieldLocation(field_id, gps_location);
      res.status(200).json({ message: "อัปเดตตำแหน่งสนามเรียบร้อย", field: result });
    } catch (error) {
      console.error("UPDATE LOCATION ERROR:", error);
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new FieldController();
