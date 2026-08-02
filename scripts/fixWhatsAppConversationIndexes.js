import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import WhatsAppConversation from "../models/WhatsAppConversation.js";
import { setServers } from "node:dns";

dotenv.config();
try {
    setServers([
        "8.8.8.8",
        "8.8.4.4",
        "1.1.1.1"
    ]);

    console.log("[DNS] MongoDB resolver configured");

} catch (error) {
    console.warn("[DNS] Resolver configuration failed");
}

async function fixIndexes() {
    try {
        await connectDB();

        const collection =
            WhatsAppConversation.collection;

        const indexes = await collection.indexes();

        const oldPhoneIndex = indexes.find(
            index => index.name === "phone_1"
        );

        if (oldPhoneIndex) {
            await collection.dropIndex("phone_1");
            console.log("[INDEX REMOVED] phone_1");
        } else {
            console.log("[INDEX OK] phone_1 was already removed");
        }

        await collection.createIndex(
            {
                tenantId: 1,
                whatsappUserId: 1
            },
            {
                unique: true,
                name: "tenantId_1_whatsappUserId_1"
            }
        );

        console.log(
            "[INDEX CREATED] tenantId_1_whatsappUserId_1"
        );

    } catch (error) {
        console.error("[INDEX FIX ERROR]", error);
        process.exitCode = 1;

    } finally {
        await mongoose.connection.close();
    }
}

fixIndexes();