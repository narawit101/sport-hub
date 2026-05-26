const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

/**
 * Create a multer upload middleware with Cloudinary storage
 *
 * @param {Object} folderRules - Map of fieldname → folder name
 *   e.g. { "img_field": "field-profile", "documents": "documents" }
 *   Fields not in the map go to "uploads" by default
 * @param {Object} options
 * @param {number} [options.maxFiles=10] - Max number of files
 * @param {number} [options.maxFileSize=8388608] - Max file size in bytes (default 8MB)
 * @returns {multer.Multer} Configured multer instance
 */
function createUploader(folderRules = {}, options = {}) {
  const { maxFiles = 10, maxFileSize = 8 * 1024 * 1024 } = options;

  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      let folder = "uploads";
      let resourceType = "auto";
      let format = undefined;

      for (const [fieldname, folderName] of Object.entries(folderRules)) {
        if (
          file.fieldname === fieldname ||
          file.fieldname.startsWith(`${fieldname}_`)
        ) {
          folder = folderName;
          break;
        }
      }

      folder = `project/sport-hub/${folder}`;

      if (file.mimetype.startsWith("image/")) {
        resourceType = "image";
      } else if (file.mimetype === "application/pdf") {
        resourceType = "raw";
        format = "pdf";
      } else if (!file.mimetype.startsWith("image/")) {
        resourceType = "raw";
        format = file.mimetype.split("/")[1];
      }

      const config = {
        folder,
        resource_type: resourceType,
        public_id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      if (format) config.format = format;

      if (resourceType === "image") {
        config.transformation = [
          { quality: "auto:good" },
          { fetch_format: "auto" },
        ];
      }

      return config;
    },
  });

  return multer({ storage, limits: { files: maxFiles, fileSize: maxFileSize } });
}

module.exports = { createUploader };
