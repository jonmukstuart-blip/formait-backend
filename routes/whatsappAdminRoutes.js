import express from "express";
import Tenant from "../models/Tenant.js";
import WhatsAppConversation from "../models/WhatsAppConversation.js";
import WhatsAppMessage from "../models/WhatsAppMessage.js";
import {
    protect,
    authorizeRoles
} from "../middleware/auth.js";
import { sendWhatsAppText } from "../services/whatsappService.js";

const router = express.Router();

router.use(
    protect,
    authorizeRoles(
        "owner",
        "admin",
        "sales",
        "support"
    )
);

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
            })
            .lean();

        const conversationIds =
            conversations.map(
                conversation =>
                    conversation._id
            );

        const latestMessages =
            conversationIds.length
                ? await WhatsAppMessage.aggregate([
                    {
                        $match: {
                            tenantId:
                                req.tenantId,

                            conversationId: {
                                $in:
                                    conversationIds
                            }
                        }
                    },

                    {
                        $sort: {
                            createdAt: -1
                        }
                    },

                    {
                        $group: {
                            _id: "$conversationId",

                            text: {
                                $first: "$text"
                            },

                            direction: {
                                $first:
                                    "$direction"
                            },

                            createdAt: {
                                $first:
                                    "$createdAt"
                            }
                        }
                    }
                ])
                : [];

        const latestMessageMap =
            new Map(
                latestMessages.map(message => [
                    String(message._id),
                    message
                ])
            );

        const result =
            conversations.map(
                conversation => ({
                    ...conversation,

                    lastMessage:
                        latestMessageMap.get(
                            String(
                                conversation._id
                            )
                        ) || null
                })
            );

        res.json(result);

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

// CLOSE CONVERSATION
router.patch("/conversations/:id/close", async (req, res) => {
    try {
        const conversation =
            await WhatsAppConversation.findOneAndUpdate(
                {
                    _id: req.params.id,
                    tenantId: req.tenantId
                },
                {
                    $set: {
                        status: "closed",
                        humanHandover: true,
                        assignedTo: req.user._id
                    }
                },
                { new: true }
            );

        if (!conversation) {
            return res.status(404).json({
                error: "Conversation not found"
            });
        }

        req.app.get("io")?.emit("globalWorkspaceSyncRequest", {
            action: "DATABASE_WHATSAPP_SYNC",
            tab: "whatsapp inbox"
        });

        res.json({
            success: true,
            conversation
        });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// REOPEN CONVERSATION IN HUMAN MODE
router.patch("/conversations/:id/reopen", async (req, res) => {
    try {
        const conversation =
            await WhatsAppConversation.findOneAndUpdate(
                {
                    _id: req.params.id,
                    tenantId: req.tenantId
                },
                {
                    $set: {
                        status: "active",
                        humanHandover: true,
                        assignedTo: req.user._id
                    }
                },
                { new: true }
            );

        if (!conversation) {
            return res.status(404).json({
                error: "Conversation not found"
            });
        }

        req.app.get("io")?.emit("globalWorkspaceSyncRequest", {
            action: "DATABASE_WHATSAPP_SYNC",
            tab: "whatsapp inbox"
        });

        res.json({
            success: true,
            conversation
        });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

export default router;