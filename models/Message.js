import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true
    },

    message: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: ["New", "In Progress", "Resolved"],
        default: "New"
    },

    priority: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: "Medium"
    },

    // Kept your flat string reply property for basic fallback backward compatibility
    adminReply: {
        type: String,
        default: ""
    },

    // 🚀 NEW HIGH-DENSITY AUDIT TRAIL: Records multi-reply history streams inside MongoDB
   adminReplies: [{
    text: {
        type: String,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    repliedBy: {
        type: String,
        default: "Administrator"
    },

    attachmentUrl: {
        type: String,
        default: ""
    }
}],

    // 🚀 NEW STORAGE TRACKER: Stores uploaded file attachments or screenshot URLs
    attachmentUrl: {
        type: String,
        default: ""
    }
},
{
    timestamps: true
}
);

export default mongoose.model("Message", messageSchema);
