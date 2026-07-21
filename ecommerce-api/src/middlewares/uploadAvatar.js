import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const fileName = fileURLToPath(import.meta.url);
const dirName = path.dirname(fileName);

export const AVATARS_DIR = path.join(dirName, "../../public/uploads/avatars");

if (!fs.existsSync(AVATARS_DIR)) {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATARS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.params.id}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error("Invalid file"));
  }
  cb(null, true);
};

const singleAvatarUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
}).single("avatar");

const ERROR_MESSAGES = {
  INVALID_FILE: "El archivo debe ser una imagen JPG, PNG o WEBP",
  LIMIT_FILE_SIZE: "La imagen no debe pesar más de 2MB",
};

export default function uploadAvatar(req, res, next) {
  singleAvatarUpload(req, res, (err) => {
    if (!err) return next();
    const message = ERROR_MESSAGES[err.code] || ERROR_MESSAGES[err.message] || "No se pudo procesar el archivo";
    res.status(400).json({ message });
  });
}
