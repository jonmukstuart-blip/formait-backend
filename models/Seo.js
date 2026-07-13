import mongoose from "mongoose";

const SeoSchema = new mongoose.Schema({
    configKey: { type: String, default: "global_seo", unique: true },
    robotsTxt: { type: String, default: "User-agent: *\nDisallow: /admin/\nDisallow: /api/\nSitemap: https://forma.it" },
    lastGeneratedSitemap: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Seo", SeoSchema);
