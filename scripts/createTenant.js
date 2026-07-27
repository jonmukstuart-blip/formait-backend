import dotenv from "dotenv";
import mongoose from "mongoose";
import { setServers } from "node:dns";

dotenv.config();

try {
    setServers([
        "8.8.8.8",
        "8.8.4.4",
        "1.1.1.1"
    ]);

    console.log("[DNS] MongoDB DNS resolver configured");

} catch (error) {
    console.warn("[DNS] Could not configure DNS resolver");
}

import { connectDB } from "../config/db.js";
import Tenant from "../models/Tenant.js";


async function createTenant() {
    try {
        const databaseConnected = await connectDB();

if (!databaseConnected) {
    throw new Error(
        "MongoDB connection failed. Tenant creation stopped."
    );
}

        const requiredVariables = [
            "TENANT_BUSINESS_NAME",
            "TENANT_SLUG",
            "WHATSAPP_PHONE_NUMBER_ID",
            "WHATSAPP_ACCESS_TOKEN",
            "WHATSAPP_VERIFY_TOKEN"
        ];

        for (const variable of requiredVariables) {
            if (!process.env[variable]) {
                throw new Error(
                    `${variable} is missing from .env`
                );
            }
        }

        const tenant = await Tenant.findOneAndUpdate(
            {
                slug: process.env.TENANT_SLUG.toLowerCase()
            },
            {
                $set: {
                    businessName:
                        process.env.TENANT_BUSINESS_NAME,

                    "whatsapp.phoneNumberId":
                        process.env.WHATSAPP_PHONE_NUMBER_ID,

                    "whatsapp.businessAccountId":
                        process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "",

                    "whatsapp.accessToken":
                        process.env.WHATSAPP_ACCESS_TOKEN,

                    "whatsapp.verifyToken":
                        process.env.WHATSAPP_VERIFY_TOKEN,

                    "chatbot.name":
                        process.env.CHATBOT_NAME || "FORMA",

                    "chatbot.disclosure":
                        "I’m a virtual assistant. You can ask to speak with a human team member at any time.",

                    "chatbot.tone":
                        "Friendly, clear, natural and professional",

                    "chatbot.instructions":
                        process.env.CHATBOT_INSTRUCTIONS ||
                        "FORMA.IT provides websites, custom software, automation, AI integration, WhatsApp chatbots, mobile applications, UI/UX design, branding and motion design.",

                    "chatbot.humanHandoverEnabled": true,
                    "chatbot.minimumReplyDelay": 4000,
                    "chatbot.maximumReplyDelay": 6000,
                    status: "active"
                }
            },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        console.log(
            `[TENANT CREATED] ${tenant.businessName} — ${tenant._id}`
        );

    } catch (error) {
        console.error("[TENANT CREATION ERROR]", error.message);
        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
    }
}

createTenant();