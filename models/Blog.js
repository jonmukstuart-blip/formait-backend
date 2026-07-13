import mongoose from "mongoose";

const BlogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    status: { type: String, default: "Published" }, // e.g., Published, Scheduled, Draft
    category: { type: String, default: "General" },
    tags: [{ type: String }], // e.g., ["CRM", "Scalability"]
    seoScore: { type: Number, default: 90 },
    publishDate: { type: String, default: () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
}, { timestamps: true });

export default mongoose.model("Blog", BlogSchema);
