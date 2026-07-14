import express from "express";
import multer from "multer";
import Message from "../models/Message.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// ==========================================================================
// PUBLIC CONTACT MESSAGE INTAKE (POST /api/messages)
// ==========================================================================
router.post("/", async (req, res) => {
    try {

        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "All fields required"
            });
        }

        const newMessage = await Message.create({
            name,
            email,
            message
        });

        // realtime admin update
        if (req.app.get("io")) {
            req.app.get("io").emit("globalWorkspaceSyncRequest", {
                action: "NEW_MESSAGE"
            });
        }

        res.status(201).json({
            success: true,
            data: newMessage
        });

    } catch (err) {

        console.error("MESSAGE ERROR:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
});

// High-performance binary processing in memory preserves cloud filesystem security bounds
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 45 * 1024 * 1024 } // Strict 45MB validation payload max ceiling limit check
});

// ==========================================================================
// A. RETRIEVE ACTIVE SUPPORT INQUIRIES (GET /api/messages)
// ==========================================================================
router.get("/", protect, async (req, res) => {
    try {
        // Recovers absolutely all message documents sorted by newest entries first without dropping arrays data
        const messages = await Message.find().sort({ createdAt: -1 });
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================================================
// B. ADMINISTRATIVE REPLY + ATTACHMENT CHANNEL INTAKE (POST /api/messages/:id/reply)
// ==========================================================================
router.post("/:id/reply", protect, upload.single("file"), async (req, res) => {
    try {
        const { id } = req.params;
        const { replyText } = req.body;

        if (!replyText) {
            return res.status(400).json({ error: "Missing reply text" });
        }

        let dynamicAttachmentUrl = "";

        if (req.file) {
            dynamicAttachmentUrl = `https://formait-backend.onrender.com/uploads/${req.file.filename}`;
        }

        const updatePayload = {
            $push: {
                adminReplies: {
    text: replyText,
    createdAt: new Date(),
    repliedBy: req.user?.name || "Administrator",
    attachmentUrl: dynamicAttachmentUrl || null
}
            }
        };

        const updatedTicket = await Message.findByIdAndUpdate(
            id,
            updatePayload,
            { new: true }
        );

        if (!updatedTicket) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        await transporter.sendMail({
    from: `"FORMA.IT" <${process.env.EMAIL_USER}>`,
    to: updatedTicket.email,
    subject: "Response from FORMA.IT",

    text: `Hi ${updatedTicket.name},

Thank you for contacting FORMA.IT.

Our response:

${replyText}

Best regards,
FORMA.IT Team`
});

        console.log(`💾 Reply saved for ticket: ${id}`);

        if (req.app?.get("io")) {
            req.app.get("io").emit("globalWorkspaceSyncRequest", {
                action: "DATABASE_MESSAGES_SYNC",
                tab: "support center"
            });
        }

        res.status(200).json({
            success: true,
            data: updatedTicket
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ==========================================================================
// C. ADMINISTRATIVE CLOSE BUTTON ROUTE LAYER (DELETE /api/messages/:id)
// ==========================================================================
router.delete("/:id", protect, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Purge the explicit ticket item out of your MongoDB collection collection
        const deletedTicket = await Message.findByIdAndDelete(id);
        
        if (!deletedTicket) {
            return res.status(404).json({ error: "Target inquiry log verification failed." });
        }

        console.log(`❌ [DB MATRIX] Support Ticket ${id} cleared out of collection registry.`);

        // 🚀 LIVE WEBSOCKET BROADCAST: Force all open dashboards to clear this row instantly
        if (req.app && req.app.get("io")) {
            req.app.get("io").emit("globalWorkspaceSyncRequest", {
                action: "DATABASE_MESSAGES_SYNC",
                tab: "support center",
                reason: "Support Incident Record Closed",
                payload: { message: `Ticket for '${deletedTicket.name}' resolved.` }
            });
        }

        res.status(200).json({ success: true, message: "Ticket processed and archived safely." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/public/:email", async (req, res) => {
    try {
        const { email } = req.params;

        const messages = await Message.find({ email })
            .sort({ createdAt: -1 });

        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
