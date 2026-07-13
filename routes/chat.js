import express from "express";
import { GoogleGenAI } from "@google/genai";

const router = express.Router();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

router.post("/", async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                reply: "Please enter a message."
            });
        }

        const prompt = `
You are Forma.IT Group's official AI Customer Care Assistant.

About Forma.IT:
- Software Engineering
- Cloud Architecture
- CRM Development
- Web Applications
- Mobile Applications
- AI Solutions
- UI/UX Design
- Technical Support

Rules:
- Be professional.
- Keep answers clear.
- Answer like a customer support assistant.
- If asked about pricing, explain that pricing depends on project requirements.
- Never invent company information.
- If you don't know something, say so honestly.

Customer:
${message}
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });

        res.json({
            reply: response.text
        });

    } catch (err) {
        console.error("Gemini Error:", err);

        res.status(500).json({
            reply: "I'm sorry, I'm having trouble responding right now. Please try again shortly."
        });
    }
});

export default router;