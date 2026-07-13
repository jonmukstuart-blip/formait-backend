import Lead from "../models/Lead.js";

// CREATE LEAD
export const createLead = async (req, res) => {
    try {
        const lead = await Lead.create(req.body);

        const io = req.app.get("io");
        if (io) {
            io.emit("globalWorkspaceSyncRequest", {
                action: "NEW_LEAD"
            });
        }

        return res.status(201).json(lead);

    } catch (err) {
        console.error("Create lead failed:", err);

        return res.status(400).json({
            error: err.message
        });
    }
};

// GET ALL LEADS
export const getLeads = async (req, res) => {
    try {
        const leads = await Lead.find().populate("assignedTo");
        res.json(leads);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE LEAD
export const updateLead = async (req, res) => {
    try {
        const lead = await Lead.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (req.app.get("io")) {
            req.app.get("io").emit("globalWorkspaceSyncRequest", {
                action: "LEAD_UPDATED"
            });
        }

        res.json(lead);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};