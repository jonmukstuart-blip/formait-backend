import express from "express";
import { createLead, getLeads, updateLead } from "../controllers/crmController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/leads", protect, createLead);
router.get("/leads", protect, getLeads);
router.put("/leads/:id", protect, updateLead);

export default router;