import express from "express";
import { askGemini } from "../services/gemini.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    const reply = await askGemini(message);

    res.json({ reply });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Gemini failed" });
  }
});

export default router;