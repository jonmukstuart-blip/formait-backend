import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;

        if (!mongoUri) {
            throw new Error("MONGO_URI is missing from .env");
        }

        console.log("[DATABASE ENGINE] Driving direct channel handshake to Atlas...");

        await mongoose.connect(mongoUri);

        console.log("[DATABASE LIVE] MongoDB Connected Successfully!");

        return true;

    } catch (error) {
        console.error("[DATABASE CRITICAL ERROR]", error);
        return false;
    }
};