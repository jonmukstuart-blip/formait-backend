import express from "express";
import Tenant from "../models/Tenant.js";
import WhatsAppConversation from "../models/WhatsAppConversation.js";
import WhatsAppMessage from "../models/WhatsAppMessage.js";
import {
    protect,
    authorizeRoles
} from "../middleware/auth.js";
import { sendWhatsAppText } from "../services/whatsappService.js";
import { buildSocialFollowUp } from "../services/chatbotEngine.js";
import { sendTenantPushNotification } from "../services/adminPushService.js";

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
// RETURN CONVERSATION TO CHATBOT
router.patch(
    "/conversations/:id/return-to-bot",
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

            const tenant = await Tenant.findOne({
                _id: req.tenantId,
                status: "active"
            }).select("+whatsapp.accessToken");

            if (!tenant) {
                return res.status(404).json({
                    error: "Business account not found"
                });
            }

            const collectedData = {
                ...(conversation.collectedData || {})
            };

            // Send closing message only once
            if (
                collectedData.socialFollowUpSent !== true
            ) {
                const closingMessage =
                    buildSocialFollowUp(tenant) ||
                    `Thank you for contacting ${tenant.businessName}. We appreciate your time.`;

                const result =
                    await sendWhatsAppText({
                        tenant,
                        recipient:
                            conversation.whatsappUserId,
                        text: closingMessage
                    });

                await WhatsAppMessage.create({
                    tenantId: tenant._id,
                    conversationId:
                        conversation._id,
                    whatsappMessageId:
                        result?.messages?.[0]?.id || "",
                    direction: "outgoing",
                    senderType: "assistant",
                    text: closingMessage,
                    status: "sent"
                });

                collectedData.socialFollowUpSent =
                    true;
            }

            // Return control to chatbot
            conversation.humanHandover = false;
            conversation.status = "active";
            conversation.assignedTo = null;
            conversation.state = "main_menu";
            conversation.collectedData =
                collectedData;
            conversation.lastMessageAt =
                new Date();

            conversation.markModified(
                "collectedData"
            );

            await conversation.save();

            res.json({
                success: true,
                conversation
            });

        } catch (error) {
            console.error(
                "[RETURN TO BOT ERROR]",
                error
            );

            res.status(500).json({
                error: error.message
            });
        }
    }
);

// SCHEDULE WHATSAPP FOLLOW-UP
router.patch(
    "/conversations/:id/schedule-follow-up",
    async (req, res) => {
        try {
            const {
                followUpAt,
                reason
            } = req.body;

            const followUpDate =
                new Date(followUpAt);

            if (
                !followUpAt ||
                Number.isNaN(followUpDate.getTime())
            ) {
                return res.status(400).json({
                    error: "A valid follow-up date is required"
                });
            }

            if (followUpDate <= new Date()) {
                return res.status(400).json({
                    error: "Follow-up time must be in the future"
                });
            }

            const conversation =
                await WhatsAppConversation.findOneAndUpdate(
                    {
                        _id: req.params.id,
                        tenantId: req.tenantId
                    },
                    {
                        $set: {
                            needsFollowUp: true,
                            status: "follow_up",
                            followUpAt: followUpDate,
                            followUpReason:
                                String(reason || "")
                                    .trim(),
                            followUpStatus: "pending",
                            followUpCreatedBy:
                                req.user._id,
                            followUpNotifiedAt: null,
                            followUpCompletedAt: null
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

            void sendTenantPushNotification({
    tenantId: req.tenantId,

    title: `📅 Follow-up scheduled — ${conversation.customerName}`,

    body:
        `${conversation.followUpReason || "Customer follow-up"} — ` +
        new Date(conversation.followUpAt).toLocaleString("en-UG", {
            timeZone: "Africa/Kampala",
            dateStyle: "medium",
            timeStyle: "short"
        }),

    url: "/admin.html",

    tag: `whatsapp-followup-scheduled-${conversation._id}`,

    urgent: true,

    data: {
        type: "follow_up_scheduled",
        conversationId:
            conversation._id.toString(),
        customerName:
            conversation.customerName,
        phone:
            conversation.whatsappUserId,
        followUpAt:
            conversation.followUpAt
    }
}).catch(error => {
    console.error(
        "[WHATSAPP SCHEDULE PUSH ERROR]",
        error.message
    );
});

            req.app
                .get("io")
                ?.to(
                    `tenant:${req.tenantId.toString()}`
                )
                .emit(
                    "globalWorkspaceSyncRequest",
                    {
                        action:
                            "WHATSAPP_FOLLOW_UP_SCHEDULED",
                        tab: "whatsapp inbox",
                        payload: {
                            name:
                                conversation.customerName,

                            message:
                                `Follow-up scheduled for ${followUpDate.toLocaleString()}`,

                            conversationId:
                                conversation._id
                        }
                    }
                );

            res.json({
                success: true,
                conversation
            });

        } catch (error) {
            console.error(
                "[WHATSAPP FOLLOW UP ERROR]",
                error
            );

            res.status(500).json({
                error: error.message
            });
        }
    }
);


// COMPLETE WHATSAPP FOLLOW-UP
router.patch(
    "/conversations/:id/complete-follow-up",
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
                            needsFollowUp: false,
                            followUpStatus: "completed",
                            followUpCompletedAt:
                                new Date(),
                            followUpAt: null,
                            followUpNotifiedAt: null,

                            status: "active"
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

            req.app
                .get("io")
                ?.to(
                    `tenant:${req.tenantId.toString()}`
                )
                .emit(
                    "globalWorkspaceSyncRequest",
                    {
                        action:
                            "WHATSAPP_FOLLOW_UP_COMPLETED",
                        tab: "whatsapp inbox"
                    }
                );

            res.json({
                success: true,
                conversation
            });

        } catch (error) {
            console.error(
                "[WHATSAPP FOLLOW UP COMPLETE ERROR]",
                error
            );

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