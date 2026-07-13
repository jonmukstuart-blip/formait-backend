import express from "express";
import { createLead, getLeads, updateLead } from "../controllers/crmController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================================================
// 👥 CRM PIPELINE STREAM REPOSITORIES
// ==========================================================================
router.post("/leads", protect, createLead);
router.get("/leads", protect, getLeads);
router.put("/leads/:id", protect, updateLead);

// ==========================================================================
// 🤖 COGNITIVE ENGINE AI CHAT PATHWAY
// ==========================================================================
router.post("/ai-execute", protect, async (req, res) => {
    try {
        const { prompt } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: "Prompt string payload field parameter missing." });
        }

        let structuredReply = `Forma.IT Automation Sequence Complete. Received: "${prompt}". Your request parameters have been compiled safely.`;
        const lowerPrompt = prompt.toLowerCase();
        
        if (lowerPrompt.includes("blog") || lowerPrompt.includes("write")) {
            structuredReply = `### Draft Article: Enterprise Scaling Blueprint\n\nIn today's digital architecture, managing data continuity with zero-refresh interfaces is a core requirement for multi-tenant CRM environments...`;
        } else if (lowerPrompt.includes("seo") || lowerPrompt.includes("tags")) {
            structuredReply = `{\n  "meta_title": "Forma.IT Group | Enterprise Software and Custom IT Automations",\n  "meta_description": "Scale up your production frameworks defensively with our cluster data mirrors.",\n  "keywords": "CRM, Web Sockets, Node, Mongoose"\n}`;
        }

        res.status(200).json({ success: true, reply: structuredReply });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/activity", protect, async (req, res) => {
    try {
        const activities = [
            {
                type: "SYSTEM",
                message: "CRM activity stream online",
                createdAt: new Date()
            }
        ];

        res.status(200).json(activities);
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});
export default router;
