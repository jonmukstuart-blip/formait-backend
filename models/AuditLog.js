import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema({
    level: { type: String, enum: ["INFO", "WARN", "CRITICAL"], default: "INFO" },
    message: { type: String, required: true }, // e.g., "Failed SSH authentication attempt detected"
    metaDetails: { type: String, default: "" }, // e.g., "IP Address: 198.51.100.42"
    statusTag: { type: String, default: "BLOCKED" } // BLOCKED, VERIFIED, ACTIVE
}, { timestamps: true });

export default mongoose.model("AuditLog", AuditLogSchema);
