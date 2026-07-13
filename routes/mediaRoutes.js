import express from "express";
import multer from "multer";
import { protect } from "../middleware/auth.js";
import MediaAsset from "../models/MediaAsset.js";

const router = express.Router();
const uploadConfiguration = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB file size ceiling
});

router.get("/", protect, async (req, res) => {
    try {
        const assets = await MediaAsset.find().sort({ createdAt: -1 });
        res.status(200).json(assets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/upload", protect, uploadConfiguration.single("file"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "Missing physical file packet binary." });

        const databaseAssetRecord = {
            filename: req.file.originalname,
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            fileUrl: `https://formait-group.com{Date.now()}_${req.file.originalname}`
        };

        const savedAsset = await MediaAsset.create(databaseAssetRecord); // Triggers change stream automatically
        res.status(201).json({ success: true, asset: savedAsset });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
