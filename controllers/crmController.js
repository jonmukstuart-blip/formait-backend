import Lead from "../models/Lead.js";

// CREATE LEAD
export const createLead = async (req, res) => {
    const lead = await Lead.create(req.body);
    res.json(lead);
};

// GET ALL LEADS
export const getLeads = async (req, res) => {
    const leads = await Lead.find().populate("assignedTo");
    res.json(leads);
};

// UPDATE LEAD STATUS
export const updateLead = async (req, res) => {
    const lead = await Lead.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    res.json(lead);
};