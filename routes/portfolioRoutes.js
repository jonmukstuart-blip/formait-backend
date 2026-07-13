import express from "express";
import Portfolio from "../models/Portfolio.js";

const router = express.Router();

// GET ALL PORTFOLIO ITEMS
router.get("/", async (req, res) => {
    try {
        const items = await Portfolio.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE PORTFOLIO ITEM
router.post("/", async (req, res) => {
    try {
        const item = await Portfolio.create(req.body);
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;