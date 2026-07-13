import mongoose from "mongoose";

const IntegrationSchema = new mongoose.Schema({
    moduleName: { type: String, required: true }, // e.g., "Gmail & Analytics Enterprise Pipeline"
    scope: { type: String, required: true },      // e.g., "Lead capture inbox reading..."
    status: { type: String, enum: ["CONNECTED", "OFFLINE"], default: "OFFLINE" },
    errorRate: { type: Number, default: 0.00 }
}, { timestamps: true });

export default mongoose.model("Integration", IntegrationSchema);
