import mongoose from "mongoose";

const whatsappConversationSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true
        },

        whatsappUserId: {
            type: String,
            required: true,
            trim: true
        },

        customerName: {
            type: String,
            default: "WhatsApp Customer",
            trim: true
        },

        state: {
            type: String,
            default: "main_menu"
        },

        collectedData: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        humanHandover: {
            type: Boolean,
            default: false
        },

        status: {
            type: String,
            enum: ["active", "waiting_for_human", "follow_up", "closed"],
            default: "active"
        },

        hasIntroduced: {
    type: Boolean,
    default: false
},
disclosureSentAt: {
    type: Date,
    default: null
},
        isPinned: {
    type: Boolean,
    default: false
},

pinnedSummary: {
    type: String,
    default: ""
},

summaryUpdatedAt: {
    type: Date,
    default: null
},

priority: {
    type: String,
    enum: ["normal", "high", "urgent"],
    default: "normal"
},

sessionStartedAt: {
    type: Date,
    default: Date.now
},

sessionNeedsReset: {
    type: Boolean,
    default: false
},

needsFollowUp: {
    type: Boolean,
    default: false
},

followUpReason: {
    type: String,
    default: ""
},

closedAt: {
    type: Date,
    default: null
},

assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
},
        lastMessageAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

whatsappConversationSchema.index(
    {
        tenantId: 1,
        whatsappUserId: 1
    },
    {
        unique: true
    }
);

export default mongoose.model(
    "WhatsAppConversation",
    whatsappConversationSchema
);