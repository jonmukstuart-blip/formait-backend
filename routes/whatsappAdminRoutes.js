import express from "express";
import Tenant from "../models/Tenant.js";
import WhatsAppConversation from "../models/WhatsAppConversation.js";
import WhatsAppMessage from "../models/WhatsAppMessage.js";
import { protect } from "../middleware/auth.js";
import { sendWhatsAppText } from "../services/whatsappService.js";

const router = express.Router();

router.use(protect);

// GET BUSINESS WHATSAPP CONVERSATIONS
router.get("/conversations", async (req, res) => {
    try {
        const conversations =
            await WhatsAppConversation.find({
                tenantId: req.tenantId
            })
            .sort({
                isPinned: -1,
                lastMessageAt: -1
            });

        res.json(conversations);

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// GET ONE CONVERSATION'S MESSAGES
router.get(
    "/conversations/:id/messages",
    async (req, res) => {
        try {
            const conversation =
                await WhatsAppConversation.findOne({
                    _id: req.params.id,
                    tenantId: req.tenantId
                });

            if (!conversation) {
                return res.status(404).json({
                    error: "Conversation not found"
                });
            }

            const messages =
                await WhatsAppMessage.find({
                    tenantId: req.tenantId,
                    conversationId: conversation._id
                })
                .sort({ createdAt: 1 });

            res.json({
                conversation,
                messages
            });

        } catch (error) {
            res.status(500).json({
                error: error.message
            });
        }
    }
);

// PIN OR UNPIN CONVERSATION
router.patch(
    "/conversations/:id/pin",
    async (req, res) => {
        try {
            const conversation =
                await WhatsAppConversation.findOneAndUpdate(
                    {
                        _id: req.params.id,
                        tenantId: req.tenantId
                    },
                    {
                        $set: {
                            isPinned: Boolean(req.body.isPinned)
                        }
                    },
                    {
                        new: true
                    }
                );

            if (!conversation) {
                return res.status(404).json({
                    error: "Conversation not found"
                });
            }

            res.json(conversation);

        } catch (error) {
            res.status(500).json({
                error: error.message
            });
        }
    }
);

// HUMAN REPLY THROUGH WHATSAPP
router.post(
    "/conversations/:id/reply",
    async (req, res) => {
        try {
            const replyText =
                String(req.body.replyText || "").trim();

            if (!replyText) {
                return res.status(400).json({
                    error: "Reply text is required"
                });
            }

            const conversation =
                await WhatsAppConversation.findOne({
                    _id: req.params.id,
                    tenantId: req.tenantId
                });

            if (!conversation) {
                return res.status(404).json({
                    error: "Conversation not found"
                });
            }

            const tenant = await Tenant.findOne({
                _id: req.tenantId,
                status: "active"
            }).select("+whatsapp.accessToken");

            if (!tenant) {
                return res.status(404).json({
                    error: "Business account not found"
                });
            }

            const result = await sendWhatsAppText({
                tenant,
                recipient: conversation.whatsappUserId,
                text: replyText
            });

            const message =
                await WhatsAppMessage.create({
                    tenantId: req.tenantId,
                    conversationId: conversation._id,

                    whatsappMessageId:
                        result?.messages?.[0]?.id || "",

                    direction: "outgoing",
                    senderType: "human",
                    text: replyText,
                    status: "sent"
                });

            conversation.humanHandover = true;
            conversation.status = "active";
            conversation.assignedTo = req.user._id;
            conversation.lastMessageAt = new Date();

            await conversation.save();

            res.status(201).json({
                success: true,
                message
            });

        } catch (error) {
            console.error(
                "[WHATSAPP HUMAN REPLY ERROR]",
                error
            );

            res.status(500).json({
                error: error.message
            });
        }
    }
);

// RETURN CONVERSATION TO CHATBOT
router.patch(
    "/conversations/:id/return-to-bot",
    async (req, res) => {
        try {
            const conversation =
                await WhatsAppConversation.findOneAndUpdate(
                    {
                        _id: req.params.id,
                        tenantId: req.tenantId
                    },
                    {
                        $set: {
                            humanHandover: false,
                            status: "active",
                            assignedTo: null,
                            state: "main_menu"
                        }
                    },
                    {
                        new: true
                    }
                );

            if (!conversation) {
                return res.status(404).json({
                    error: "Conversation not found"
                });
            }

            res.json({
                success: true,
                conversation
            });

        } catch (error) {
            res.status(500).json({
                error: error.message
            });
        }
    }
);

export default router;