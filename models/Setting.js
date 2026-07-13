import mongoose from "mongoose";

const SettingSchema = new mongoose.Schema({
    configKey: { type: String, default: "global_settings", unique: true },
    productionDomain: { type: String, default: "https://forma.it" },
    adminEmail: { type: String, default: "admin@forma.it" },
    smtpHost: { type: String, default: "smtp.mailgun.org" },
    smtpPort: { type: Number, default: 587 }
}, { timestamps: true });

export default mongoose.model("Setting", SettingSchema);
