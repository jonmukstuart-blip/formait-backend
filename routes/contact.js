import express from "express";
import Message from "../models/Message.js";
import { sendMail } from "../../services/mailer.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false });
    }

    // SAVE TO DB
    const newMessage = await Message.create({
      name,
      email,
      message
    });

    // SEND EMAIL
    await sendMail({ name, email, message });

    res.json({
      success: true,
      data: newMessage
    });

  } catch (err) {
    res.status(500).json({ success: false });
  }
});

export default router;