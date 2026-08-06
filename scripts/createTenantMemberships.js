import dotenv from "dotenv";
import mongoose from "mongoose";
import { setServers } from "node:dns";

import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import TenantMembership from "../models/TenantMembership.js";

dotenv.config();

try {
    setServers([
        "8.8.8.8",
        "8.8.4.4",
        "1.1.1.1"
    ]);

    console.log("[DNS] MongoDB resolver configured");

} catch (error) {
    console.warn("[DNS ERROR]", error.message);
}

async function createMemberships() {
    try {
        const connected = await connectDB();

        if (!connected) {
            throw new Error(
                "MongoDB connection could not be established"
            );
        }

        const users = await User.find({
            tenantId: { $ne: null }
        });

        for (const user of users) {
            const membershipRole = [
                "owner",
                "admin",
                "sales",
                "support"
            ].includes(user.role)
                ? user.role
                : "viewer";

            await TenantMembership.findOneAndUpdate(
                {
                    userId: user._id,
                    tenantId: user.tenantId
                },
                {
                    $set: {
                        role: membershipRole,
                        status: "active"
                    },

                    $setOnInsert: {
                        acceptedAt: new Date()
                    }
                },
                {
                    upsert: true,
                    new: true
                }
            );

            console.log(
                `[MEMBERSHIP CREATED] ${user.email} — ${membershipRole}`
            );
        }

        console.log(
            `[MEMBERSHIP MIGRATION COMPLETE] ${users.length} user(s)`
        );

    } catch (error) {
        console.error(
            "[MEMBERSHIP MIGRATION ERROR]",
            error.message
        );

        process.exitCode = 1;

    } finally {
        await mongoose.connection.close();
    }
}

createMemberships();