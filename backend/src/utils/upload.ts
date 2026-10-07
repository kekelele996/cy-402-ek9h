import fs from "fs";
import path from "path";
import multer from "multer";
import { env } from "../config/env";

fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, env.UPLOAD_DIR),
  filename: (_req, file, callback) => {
    const safeName = file.originalname.replace(/[^\w.\-\u4e00-\u9fa5]/g, "_");
    callback(null, `${Date.now()}-${safeName}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".txt"];
    const ext = path.extname(file.originalname).toLowerCase();
    callback(null, allowed.includes(ext));
  }
});

