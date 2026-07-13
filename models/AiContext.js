import mongoose from "mongoose";

const AiContextSchema = new mongoose.Schema({
    userPrompt: { type: String, required: true },
    engineResponse: { type: String, required: true },
    issuedBy: { type: String, default: "Anonymous Operator" },
    timestampText: { type: String, default: () => new Date().toLocaleTimeString() }
}, { timestamps: true });

export default mongoose.model("AiContext", AiContextSchema);
