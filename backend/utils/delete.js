const cloudinary = require("../config/cloudinary");

/**
 * Delete a single file from Cloudinary by URL
 * @param {string} fileUrl - Cloudinary URL
 */
async function deleteCloudinaryFile(fileUrl) {
  if (!fileUrl) return;

  try {
    const urlParts = fileUrl.split("/");
    const uploadIndex = urlParts.findIndex((part) => part === "upload");
    if (uploadIndex === -1) return;

    let pathStartIndex = uploadIndex + 1;
    if (urlParts[pathStartIndex] && urlParts[pathStartIndex].startsWith("v")) {
      pathStartIndex++;
    }

    const pathParts = urlParts.slice(pathStartIndex);
    const fullPath = pathParts.join("/");
    const isRawFile = fileUrl.includes("/raw/upload/");

    let publicId, resourceType;

    if (isRawFile) {
      publicId = fullPath;
      resourceType = "raw";
    } else {
      const lastDotIndex = fullPath.lastIndexOf(".");
      publicId =
        lastDotIndex > 0 ? fullPath.substring(0, lastDotIndex) : fullPath;
      resourceType = "image";
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result === "ok") {
      console.log(`[Cloudinary] Deleted: ${publicId}`);
    } else if (result.result === "not found") {
      const alternativeType = resourceType === "raw" ? "image" : "raw";
      const retryResult = await cloudinary.uploader.destroy(publicId, {
        resource_type: alternativeType,
      });
      if (retryResult.result === "ok") {
        console.log(`[Cloudinary] Deleted (${alternativeType}): ${publicId}`);
      }
    }
  } catch (error) {
    console.error("[Cloudinary] Delete failed:", error.message);
  }
}

/**
 * Delete multiple files from Cloudinary
 * @param {string[]} fileUrls - Array of Cloudinary URLs
 */
async function deleteMultipleCloudinaryFiles(fileUrls) {
  if (!fileUrls || fileUrls.length === 0) return;

  for (const url of fileUrls) {
    if (url && url.trim()) {
      await deleteCloudinaryFile(url.trim());
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

module.exports = { deleteCloudinaryFile, deleteMultipleCloudinaryFiles };
