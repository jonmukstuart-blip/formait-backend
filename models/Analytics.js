import mongoose from "mongoose";

const AnalyticsSchema = new mongoose.Schema({
    metricKey: { type: String, default: "global_analytics", unique: true },
    avgSessionDuration: { type: String, default: "2m 44s" },
    bounceRate: { type: String, default: "38.2%" },
    pagesPerSession: { type: Number, default: 4.12 },
    countries: [{
        name: String,
        sessions: Number,
        conversionRate: String
    }],
    deviceShares: {
        desktopLaptop: { type: Number, default: 62 }
    }
}, { timestamps: true });

export default mongoose.model("Analytics", AnalyticsSchema);
