import mongoose from "mongoose";

const adminPushSubscriptionSchema =
    new mongoose.Schema(
        {
            tenantId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Tenant",
                required: true,
                index: true
            },

            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
                index: true
            },

            endpoint: {
                type: String,
                required: true,
                unique: true
            },

            keys: {
                p256dh: {
                    type: String,
                    required: true
                },

                auth: {
                    type: String,
                    required: true
                }
            },

            userAgent: {
                type: String,
                default: ""
            },

            active: {
                type: Boolean,
                default: true
            },

            lastUsedAt: {
                type: Date,
                default: Date.now
            }
        },
        {
            timestamps: true
        }
    );

adminPushSubscriptionSchema.index({
    tenantId: 1,
    userId: 1,
    active: 1
});

export default mongoose.model(
    "AdminPushSubscription",
    adminPushSubscriptionSchema
);