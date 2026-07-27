import express from "express";
import { resolveTenantFromWhatsAppPayload } from "../services/tenantResolver.js";
import { processIncomingWhatsAppMessage } from "../services/chatbotEngine.js";

const router = express.Router();

// Meta webhook verification
router.get("/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (
        mode === "subscribe" &&
        token === process.env.WHATSAPP_VERIFY_TOKEN
    ) {
        console.log("[WHATSAPP] Webhook verified");
        return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
});

// Incoming WhatsApp messages
router.post("/webhook", (req, res) => {
    // Reply to Meta immediately
    res.sendStatus(200);

    void handleWebhook(req.body);
});

async function handleWebhook(payload) {
    try {
        const tenant =
            await resolveTenantFromWhatsAppPayload(payload);

        console.log(
            `[WHATSAPP] Message received for ${tenant.businessName}`
        );

        await processIncomingWhatsAppMessage({
            payload,
            tenant
        });

    } catch (error) {
        console.error(
            "[WHATSAPP WEBHOOK ERROR]",
            error.message
        );
    }
}

export default router;