import mongoose from "mongoose";

const marketingSchema = new mongoose.Schema(
    {
        campaignName: { type: String, required: true, trim: true },
        channel: { type: String, required: true }, 
        status: { type: String, enum: ["Running", "Scheduled", "Paused"], default: "Scheduled" },
        // 🚀 NEW FILE URL TRACKING LAYER
        creativeUrl: { type: String, default: "" },
        metrics: {
            impressions: { type: Number, default: 0 },
            ctr: { type: Number, default: 0.0 }, 
            subscribersCount: { type: Number, default: 4812 }
        }
    },
    { timestamps: true }
);

const Marketing = mongoose.model("Marketing", marketingSchema);
export default Marketing;
