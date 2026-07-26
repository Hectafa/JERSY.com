import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const fileName = fileURLToPath(import.meta.url);
const dirName = path.dirname(fileName);

export const PRODUCTS_DIR = path.join(dirName, "../../public/uploads/products");

if (!fs.existsSync(PRODUCTS_DIR)) {
    fs.mkdirSync(PRODUCTS_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, PRODUCTS_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error("Invalid file"));
    }
    cb(null, true);
};

const singleProductImageUpload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, //5MB
}).single("image");

const ERROR_MESSAGES = {
    INVALID_FILE: "El archivo debe ser una imagen JPG, PNG O WEBP",
    LIMIT_FILE_SIZE: "La imagen no debe pesar más de 5MB",
};

export default function uploadProductImage(req, res, next) {
    singleProductImageUpload(req, res, (err) => {
        if (!err) return next();
        const message = ERROR_MESSAGES[err.code] || ERROR_MESSAGES[err.message] || "No se pudo procesar el archivo";
        res.status(400).json({ message });
    });
}