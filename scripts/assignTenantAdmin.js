import dotenv from "dotenv";
import mongoose from "mongoose";
import { setServers } from "node:dns";
import { connectDB } from "../config/db.js";
import Tenant from "../models/Tenant.js";
import User from "../models/User.js";

dotenv.config();

try {
    setServers([
        "8.8.8.8",
        "8.8.4.4",
        "1.1.1.1"
    ]);
} catch (error) {
    console.warn("[DNS] Custom DNS unavailable");
}

async function assignTenantAdmin() {
    try {
        const connected = await connectDB();

        if (!connected) {
            throw new Error("MongoDB connection failed");
        }

        const tenant = await Tenant.findOne({
            slug: process.env.TENANT_SLUG
        });

        if (!tenant) {
            throw new Error("Tenant not found");
        }

        const user = await User.findOneAndUpdate(
            {
                email: process.env.ADMIN_EMAIL.toLowerCase()
            },
            {
                $set: {
                    tenantId: tenant._id,
                    role: "admin"
                }
            },
            {
                new: true
            }
        );

        if (!user) {
            throw new Error("Administrator not found");
        }

        console.log(
            `[ADMIN CONNECTED] ${user.email} → ${tenant.businessName}`
        );

    } catch (error) {
        console.error(
            "[ADMIN ASSIGNMENT ERROR]",
            error.message
        );

        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
    }
}

assignTenantAdmin();