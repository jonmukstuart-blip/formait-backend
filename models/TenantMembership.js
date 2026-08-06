import mongoose from "mongoose";

const tenantMembershipSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true
        },

        role: {
            type: String,
            enum: [
                "owner",
                "admin",
                "sales",
                "support",
                "viewer"
            ],
            required: true,
            default: "viewer"
        },

        permissions: {
            type: [String],
            default: []
        },

        status: {
            type: String,
            enum: [
                "invited",
                "active",
                "suspended"
            ],
            default: "active"
        },

        invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        acceptedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

tenantMembershipSchema.index(
    {
        userId: 1,
        tenantId: 1
    },
    {
        unique: true
    }
);

export default mongoose.model(
    "TenantMembership",
    tenantMembershipSchema
);