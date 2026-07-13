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

    if (req.app.get("io")) {
    req.app.get("io").emit("globalWorkspaceSyncRequest", {
        action: "NEW_MESSAGE"
    });
}

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