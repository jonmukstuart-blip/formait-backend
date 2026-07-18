import multer from "multer";
import fs from "fs";
import path from "path";

const uploadDir = path.resolve("uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
        recursive: true
    });
}

const storage = multer.diskStorage({
    destination(req, file, callback) {
        callback(null, uploadDir);
    },

    filename(req, file, callback) {
        const safeOriginalName = file.originalname
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9._-]/g, "");

        const uniqueFilename =
            `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeOriginalName}`;

        callback(null, uniqueFilename);
    }
});

const fileFilter = (req, file, callback) => {
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "application/pdf",
        "video/mp4",
        "video/webm"
    ];

    if (!allowedTypes.includes(file.mimetype)) {
        return callback(
            new Error("This attachment file type is not allowed."),
            false
        );
    }

    callback(null, true);
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 45 * 1024 * 1024
    }
});