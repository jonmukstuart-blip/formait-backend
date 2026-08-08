import express from "express";
import AdminPushSubscription from
    "../models/AdminPushSubscription.js";
import { protect } from
    "../middleware/auth.js";

const router = express.Router();

router.use(protect);

// Return the safe public VAPID key
router.get("/public-key", (req, res) => {
    if (!process.env.VAPID_PUBLIC_KEY) {
        return res.status(503).json({
            message:
                "Push notifications are not configured"
        });
    }

    res.json({
        publicKey:
            process.env.VAPID_PUBLIC_KEY
    });
});

// Save this administrator's device
router.post("/subscribe", async (req, res) => {
    try {
        const subscription =
            req.body?.subscription;

        if (
            !subscription?.endpoint ||
            !subscription?.keys?.p256dh ||
            !subscription?.keys?.auth
        ) {
            return res.status(400).json({
                message:
                    "Invalid push subscription"
            });
        }

        const savedSubscription =
            await AdminPushSubscription.findOneAndUpdate(
                {
                    endpoint:
                        subscription.endpoint
                },
                {
                    $set: {
                        tenantId: req.tenantId,
                        userId: req.user._id,

                        keys: {
                            p256dh:
                                subscription.keys.p256dh,

                            auth:
                                subscription.keys.auth
                        },

                        userAgent:
                            req.headers["user-agent"] || "",

                        active: true,
                        lastUsedAt: new Date()
                    }
                },
                {
                    new: true,
                    upsert: true,
                    setDefaultsOnInsert: true
                }
            );

        res.status(201).json({
            success: true,
            subscriptionId:
                savedSubscription._id
        });

    } catch (error) {
        console.error(
            "[PUSH SUBSCRIBE ERROR]",
            error
        );

        res.status(500).json({
            message:
                "Unable to enable push notifications"
        });
    }
});

// Remove this administrator's device
router.delete("/unsubscribe", async (req, res) => {
    try {
        const endpoint =
            String(req.body?.endpoint || "");

        if (!endpoint) {
            return res.status(400).json({
                message:
                    "Subscription endpoint is required"
            });
        }

        await AdminPushSubscription.deleteOne({
            endpoint,
            tenantId: req.tenantId,
            userId: req.user._id
        });

        res.json({
            success: true
        });

    } catch (error) {
        res.status(500).json({
            message:
                "Unable to disable push notifications"
        });
    }
});

export default router;