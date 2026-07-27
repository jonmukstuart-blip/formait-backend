import mongoose from "mongoose";

const whatsappMessageSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true
        },

        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "WhatsAppConversation",
            required: true,
            index: true
        },

        whatsappMessageId: {
            type: String,
            default: "",
            index: true
        },

        direction: {
            type: String,
            enum: ["incoming", "outgoing"],
            required: true
        },

        senderType: {
            type: String,
            enum: ["customer", "assistant", "human"],
            required: true
        },

        text: {
            type: String,
            required: true,
            trim: true
        },

        status: {
            type: String,
            enum: ["received", "sent", "delivered", "read", "failed"],
            default: "received"
        }
    },
    {
        timestamps: true
    }
);

whatsappMessageSchema.index({
    tenantId: 1,
    conversationId: 1,
    createdAt: -1
});

export default mongoose.model(
    "WhatsAppMessage",
    whatsappMessageSchema
);