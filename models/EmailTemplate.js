import mongoose from "mongoose";

const EmailTemplateSchema = new mongoose.Schema({
    triggerTag: { type: String, required: true, unique: true, lowercase: true, trim: true }, // e.g., "welcome", "support_auto_reply"
    replyBody: { type: String, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("EmailTemplate", EmailTemplateSchema);
