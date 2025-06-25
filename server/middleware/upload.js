const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ✅ Function to generate upload config for different folders
const upload = (folderPath, allowedMimeTypes = [], maxSizeMB = 100) => {
  // Ensure the folder exists
  const fullFolderPath = path.join(__dirname, "..", folderPath);
  if (!fs.existsSync(fullFolderPath)) {
    fs.mkdirSync(fullFolderPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, fullFolderPath);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext).replace(/\s+/g, "-");
      const timestamp = Date.now();
      cb(null, `${base}-${timestamp}${ext}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.length === 0 || allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"), false);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
  });
};

module.exports = upload;
