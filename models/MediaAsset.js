import express from "express";
import MediaAsset from "../models/MediaAsset.js";
import { protect } from "../middleware/auth.js"; // Ensures uploads require a valid JWT

const router = express.Router();

/**
 * @route   POST /api/media
 * @desc    Commit a newly uploaded asset's metadata tracking record to MongoDB
 * @access  Protected
 */
router.post("/", protect, async (req, res) => {
    try {
        const { fileName, fileMimeType, fileSizeBytes, storageUrl } = req.body;
        
        // Pass payload through schema level constraints and validations
        const newAsset = new MediaAsset({
            fileName,
            fileMimeType,
            fileSizeBytes,
            storageUrl,
            uploadedBy: req.user?.email || "System Vault Automator"
        });

        const savedAsset = await newAsset.save();

        // Broadcast real-time workspace sync notification if Socket.io is bound
        const io = req.app.get("io");
        if (io) {
            io.emit("globalWorkspaceSyncRequest", { 
                action: "MEDIA_VAULT_UPLOAD_SYNC",
                assetId: savedAsset._id 
            });
        }

        res.status(201).json({ success: true, data: savedAsset });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

/**
 * @route   GET /api/media
 * @desc    Retrieve historical asset timeline records optimized via compound indexing
 * @access  Protected
 */
router.get("/", protect, async (req, res) => {
    try {
        const assets = await MediaAsset.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: assets.length, data: assets });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
