import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema(
    {
        businessName: {
            type: String,
            required: true,
            trim: true
        },

        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        whatsapp: {
            phoneNumberId: {
                type: String,
                required: true,
                unique: true
            },

            businessAccountId: {
                type: String,
                default: ""
            },

            accessToken: {
                type: String,
                required: true,
                select: false
            },

            verifyToken: {
                type: String,
                required: true,
                select: false
            }
        },

        chatbot: {
            name: {
                type: String,
                default: "Virtual Assistant"
            },

            disclosure: {
                type: String,
                default: "I’m a virtual assistant. You can ask to speak with a human at any time."
            },

            tone: {
                type: String,
                default: "Friendly, clear, natural and professional"
            },

            instructions: {
                type: String,
                default: ""
            },

            humanHandoverEnabled: {
                type: Boolean,
                default: true
            },

            minimumReplyDelay: {
                type: Number,
                default: 4000
            },

            maximumReplyDelay: {
                type: Number,
                default: 6000
            }
        },

        status: {
            type: String,
            enum: ["active", "suspended"],
            default: "active"
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model("Tenant", tenantSchema);