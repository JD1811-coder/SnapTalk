const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ✅ Function to generate upload config for a given folder
const upload = (folderPath, allowedMimeTypes = [], maxSizeMB = 100) => {
  // Absolute path to uploads folder (e.g., /uploads/)
  const fullFolderPath = path.join(__dirname, "..", folderPath);

  // Create folder if not exists
  if (!fs.existsSync(fullFolderPath)) {
    fs.mkdirSync(fullFolderPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, fullFolderPath); // ✅ fixed from 'destination' to 'fullFolderPath'
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const base = path
        .basename(file.originalname, ext)
        .replace(/\s+/g, "-")
        .replace(/[^\p{L}\p{N}\-_]/gu, ""); // Keep letters, numbers, hyphen, underscore only

      const timestamp = Date.now();
      cb(null, `${base}-${timestamp}${ext}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (
      allowedMimeTypes.length === 0 || 
      allowedMimeTypes.includes(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"), false);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: maxSizeMB * 1024 * 1024 }, // in bytes
  });
};

module.exports = upload;
