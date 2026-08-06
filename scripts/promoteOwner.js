import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
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
    console.warn(
        "[DNS] Resolver configuration failed:",
        error.message
    );
}

async function promoteOwner() {
    try {
        const connected = await connectDB();

if (!connected) {
    throw new Error(
        "MongoDB connection could not be established"
    );
}

        const ownerEmail =
            String(process.env.ADMIN_EMAIL || "")
                .trim()
                .toLowerCase();

        if (!ownerEmail) {
            throw new Error(
                "ADMIN_EMAIL is missing from .env"
            );
        }

        const user = await User.findOneAndUpdate(
            { email: ownerEmail },
            { $set: { role: "owner" } },
            { new: true }
        );

        if (!user) {
            throw new Error(
                `No user found for ${ownerEmail}`
            );
        }

        console.log(
            `[OWNER UPDATED] ${user.email} — ${user.role}`
        );

    } catch (error) {
        console.error(
            "[OWNER UPDATE ERROR]",
            error.message
        );

        process.exitCode = 1;

    } finally {
        await mongoose.connection.close();
    }
}

promoteOwner();