import mongoose from "mongoose";

const ContentSchema = new mongoose.Schema({
    page: {
        type: String,
        required: true,
        unique: true, // e.g., "landing_page"
        lowercase: true,
        trim: true
    },
    // The Master Blueprint Layout Data Structure Grouping
    hero: {
        titleAccent: { type: String, default: "FORMA IT GROUP" },
        slogan: { type: String, default: "Next-Gen Architecture Infrastructure Core" },
        ctaText: { type: String, default: "Publish Live Target Deployment" }
    },
    workspaceStatus: {
        homeComponent: { type: String, default: "Live" },
        aboutPage: { type: String, default: "Live" },
        careersTrack: { type: String, default: "Drafting" },
        faqsMatrix: { type: String, default: "Live" }
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

export default mongoose.model("Content", ContentSchema);
