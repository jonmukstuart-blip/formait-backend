import mongoose from "mongoose";

const OperatorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ["Super Admin", "Marketing", "Editor", "Support Agent"], default: "Editor" },
    networkLocation: { type: String, default: "Remote Core Network" },
    status: { type: String, enum: ["Active", "Pending"], default: "Active" }
}, { timestamps: true });

export default mongoose.model("Operator", OperatorSchema);
