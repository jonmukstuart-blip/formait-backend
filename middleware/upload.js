import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

const storage = new CloudinaryStorage({
    cloudinary,

    params: async (req, file) => {
        const safeName = file.originalname
            .replace(/\.[^/.]+$/, "")
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9_-]/g, "");

        return {
            folder: "formait/testimonials",
            resource_type: "auto",
            public_id:
                `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`
        };
    }
});

const fileFilter = (req, file, callback) => {
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "video/mp4",
        "video/webm"
    ];

    if (!allowedTypes.includes(file.mimetype)) {
        return callback(
            new Error("Only JPG, PNG, WebP, GIF, MP4 and WebM files are allowed."),
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

export { cloudinary };