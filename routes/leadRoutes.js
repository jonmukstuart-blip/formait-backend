import express from "express";
import Lead from "../models/Lead.js";
import { protect } from "../middleware/auth.js";
import { sendMail } from "../services/mailer.js";

const router = express.Router();

// ==========================================================================
// GET ALL LEADS
// ==========================================================================
router.get("/", protect, async (req, res) => {
    try {
        const leads = await Lead.find().sort({ createdAt: -1 });
        res.json(leads);
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

// ==========================================================================
// GET SINGLE LEAD
// ==========================================================================
router.get("/:id", protect, async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);

        if (!lead) {
            return res.status(404).json({
                error: "Lead not found"
            });
        }

        res.json(lead);

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});
// ==========================================================================
// CREATE NEW LEAD
// ==========================================================================
router.post("/", async (req, res) => {
    try {

        const lead = new Lead({
            name: req.body.name || "Website Visitor",
            email: req.body.email || "",
            message: req.body.message || "",
            details: req.body.details || "",
            engineeringVector: req.body.engineeringVector || "Website Chat"
        });

        await lead.save();

        if (req.app.get("io")) {
            req.app.get("io").emit("globalWorkspaceSyncRequest", {
                action: "DATABASE_LEADS_SYNC",
                tab: "leads"
            });
        }

        res.status(201).json({
            success: true,
            data: lead
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });

    }
});

// ==========================================================================
// REPLY TO LEAD
// ==========================================================================
router.post("/:id/reply", protect, async (req, res) => {
    try {
        const replyText = req.body.replyText || req.body.reply;

        if (!replyText || !replyText.trim()) {
            return res.status(400).json({
                error: "Reply text is required"
            });
        }

        const lead = await Lead.findById(req.params.id);

        if (!lead) {
            return res.status(404).json({
                error: "Lead not found"
            });
        }

        if (!lead.email) {
            return res.status(400).json({
                error: "This lead does not have an email address"
            });
        }

        await sendMail({
            name: lead.name,
            email: lead.email,
            message: replyText.trim()
        });

        lead.reply = replyText.trim();
        lead.repliedAt = new Date();
        lead.status = "contacted";

        await lead.save();

        if (req.app.get("io")) {
            req.app.get("io").emit("globalWorkspaceSyncRequest", {
                action: "DATABASE_LEADS_SYNC",
                tab: "leads"
            });
        }

        res.status(200).json({
            success: true,
            data: lead
        });

    } catch (err) {
        console.error("[LEAD REPLY ERROR]", err);

        res.status(500).json({
            error: err.message
        });
    }
});

// ==========================================================================
// UPDATE LEAD
// ==========================================================================
router.put("/:id", protect, async (req, res) => {

    try {

        const updated = await Lead.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updated) {
            return res.status(404).json({
                error: "Lead not found"
            });
        }

        if (req.app.get("io")) {
            req.app.get("io").emit("globalWorkspaceSyncRequest", {
                action: "DATABASE_LEADS_SYNC",
                tab: "leads"
            });
        }

        res.json(updated);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});

// ==========================================================================
// DELETE LEAD
// ==========================================================================
router.delete("/:id", protect, async (req, res) => {
    try {
        const deletedLead = await Lead.findByIdAndDelete(req.params.id);

        if (!deletedLead) {
            return res.status(404).json({
                success: false,
                error: "Lead not found"
            });
        }

        req.app.get("io")?.emit("globalWorkspaceSyncRequest", {
            action: "DATABASE_LEADS_SYNC",
            tab: "leads"
        });

        res.status(200).json({
            success: true,
            message: "Lead deleted successfully"
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});
export default router;