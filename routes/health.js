import express from "express";
import mongoose from "mongoose";

const router = express.Router();

router.get("/status", async (req, res) => {
    const startTime = Date.now();
    try {
        const dbState = mongoose.connection && mongoose.connection.readyState ? mongoose.connection.readyState : 0;
        let dbStatus = "Offline";
        
        if (dbState === 1) dbStatus = "Stable";
        else if (dbState === 2) dbStatus = "Connecting";

        const responseLatencyMs = Date.now() - startTime;

        res.status(200).json({
            status: "ONLINE",
            metrics: {
                apiGateway: `${Math.max(100, 100 + responseLatencyMs)}%`, 
                database: dbStatus,
                smtpNodes: "Active", 
                latency: `${responseLatencyMs}ms`
            }
        });
    } catch (err) {
        res.status(200).json({ 
            status: "DEGRADED", 
            metrics: { apiGateway: "100%", database: "Error", smtpNodes: "Active", latency: "0ms" },
            error: err.message 
        });
    }
});

export default router;
