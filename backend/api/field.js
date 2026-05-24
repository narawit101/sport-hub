const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
require("dotenv").config();
const { createUploader } = require("../utils/upload");
const fieldController = require("../controllers/fieldController");

const upload = createUploader(
  {
    documents: "documents",
    img_field: "field-profile",
    facility_image: "field-facility-images",
  },
  { maxFiles: 30 }
);

router.post("/register", upload.any(), authMiddleware, (req, res) => fieldController.registerField(req, res));
router.post("/appeal/:field_id", authMiddleware, (req, res) => fieldController.appealField(req, res));
router.get("/:field_id", authMiddleware, (req, res) => fieldController.getFieldById(req, res));
router.put("/update-status/:field_id", authMiddleware, (req, res) => fieldController.updateFieldStatus(req, res));
router.delete("/:id", authMiddleware, (req, res) => fieldController.deleteField(req, res));
router.put("/update/:field_id", authMiddleware, (req, res) => fieldController.updateField(req, res));

router.post("/:field_id/upload-image", upload.single("img_field"), authMiddleware, (req, res) => fieldController.uploadFieldImage(req, res));
router.post("/:field_id/upload-document", upload.array("documents", 10), authMiddleware, (req, res) => fieldController.uploadFieldDocuments(req, res));
router.delete("/:field_id/delete-document", authMiddleware, (req, res) => fieldController.deleteFieldDocument(req, res));
router.post("/:field_id/replace-single-document", upload.single("document"), authMiddleware, (req, res) => fieldController.replaceSingleDocument(req, res));

router.post("/subfield/:field_id", authMiddleware, (req, res) => fieldController.addSubField(req, res));
router.post("/addon", authMiddleware, (req, res) => fieldController.addAddOn(req, res));
router.delete("/delete/addon/:id", authMiddleware, (req, res) => fieldController.deleteAddOn(req, res));
router.put("/supfiled/:sub_field_id", authMiddleware, (req, res) => fieldController.updateSubField(req, res));
router.put("/add_on/:add_on_id", authMiddleware, (req, res) => fieldController.updateAddOn(req, res));
router.delete("/delete/subfield/:id", authMiddleware, (req, res) => fieldController.deleteSubField(req, res));

router.post("/facilities/:field_id", authMiddleware, (req, res) => fieldController.saveFacilities(req, res));
router.delete("/facilities/:field_id/:field_fac_id", authMiddleware, (req, res) => fieldController.deleteFacility(req, res));
router.get("/field-data/:sub_field_id", authMiddleware, (req, res) => fieldController.getFieldData(req, res));
router.get("/field-fac/:field_id", authMiddleware, (req, res) => fieldController.getFieldFacilities(req, res));
router.put("/facility/:field_fac_id", upload.single("facility_image"), authMiddleware, (req, res) => fieldController.updateFacility(req, res));
router.put("/edit-location/:field_id", authMiddleware, (req, res) => fieldController.updateFieldLocation(req, res));

module.exports = router;
