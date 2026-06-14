import express from "express";
import Lead from "../models/Lead.js";

// 1. Import your active authorization middleware
import { protect } from "../middleware/auth.js";

const router = express.Router();

// 2. Pass 'protect' into your GET route to validate incoming tokens safely
router.get("/", protect, async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE LEAD
router.post("/", protect, async (req, res) => {
  try {
    const lead = new Lead(req.body);
    const savedLead = await lead.save();
    res.status(201).json(savedLead);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UPDATE LEAD (status, notes, assignment, etc.)
router.put("/:id", protect, async (req, res) => {
  try {
    const updated = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE LEAD
router.delete("/:id", protect, async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ message: "Lead deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
