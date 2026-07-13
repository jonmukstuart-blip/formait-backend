import mongoose from "mongoose";

const PortfolioSchema = new mongoose.Schema({
    title: { type: String, required: true },
    client: { type: String, required: true },
    status: { type: String, default: "Published" }, // e.g. Published, In Review
    tags: [{ type: String }] // Array of tech stack chips, e.g. ["React Core", "Tailwind UI"]
}, { timestamps: true });

export default mongoose.model("Portfolio", PortfolioSchema);
