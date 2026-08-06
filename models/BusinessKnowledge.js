import mongoose from "mongoose";

const businessKnowledgeSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true
        },

        category: {
            type: String,
            enum: [
                "company",
                "service",
                "pricing",
                "faq",
                "policy",
                "portfolio"
            ],
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        content: {
            type: String,
            required: true,
            trim: true
        },

        keywords: [{
            type: String,
            trim: true
        }],

        priority: {
            type: Number,
            default: 0
        },

        active: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

businessKnowledgeSchema.index({
    tenantId: 1,
    category: 1,
    active: 1
});

export default mongoose.model(
    "BusinessKnowledge",
    businessKnowledgeSchema
);