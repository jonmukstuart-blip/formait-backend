import mongoose from "mongoose";

const ServiceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    tier: { type: String, default: "Standard Tier" },
    tag: { type: String, default: "ACTIVE" }, // e.g. FEATURED, ACTIVE
    price: { type: String, required: true }, // e.g. "$4,500"
    billingPeriod: { type: String, default: "mo" }
}, { timestamps: true });

export default mongoose.model("Service", ServiceSchema);
