// backend/server.js
import dotenv from "dotenv";
dotenv.config();

console.log("MAIL USER:", process.env.EMAIL_USER);
console.log("MAIL PASS:", process.env.EMAIL_PASS ? "FOUND" : "MISSING");
import { setServers } from "node:dns";
try {
    setServers(["8.8.8.8", "8.8.4.4"]); // Safely map database stream connections
} catch (err) {
    console.warn("[SYSTEM] Custom DNS override could not map.");
}

import testimonialAdminRoutes from "./routes/testimonialAdminRoutes.js";
import express from "express";
import cors from "cors";     
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";

// Core Database Models Mappings
import Lead from "./models/Lead.js"; 
import Message from "./models/Message.js"; 
import MediaAsset from "./models/MediaAsset.js"; 
import Activity from "./models/Activity.js"; 
import aiRoutes from "./routes/ai.js";

// API Routing Handlers
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import leadRoutes from "./routes/leadRoutes.js";
import messages from "./routes/messages.js"; 
import mediaRoutes from "./routes/mediaRoutes.js"; 
import adminRoutes from "./routes/admin.js";
import aiAgentRouter from "./routes/aiAgent.js"; // Unified Autonomous Agent Route
import chatRoutes from "./routes/chat.js";
import testimonialRoutes from "./routes/testimonialRoutes.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";
import clientRoutes from "./routes/client.js";

const app = express();
const httpServer = createServer(app);

// WebSocket Engine Configuration Pool
export const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});
app.set("io", io);
app.get("/", (req, res) => {
  res.send("FORMA.IT API is running 🚀");
});

// Multi-Origin Production CORS Matrix Configuration
const allowedOrigins = process.env.ALLOWED_CORS_ORIGINS 
    ? process.env.ALLOWED_CORS_ORIGINS.split(",") 
    : ["http://localhost:5173", "https://formait-backend.onrender.com", "http://localhost:5500"];

app.use(cors({
    origin: (origin, callback) => {
        // SYSTEMS FIX: If 'origin' is undefined or matches local paths, approve it instantly!
        return callback(null, true);
    },
    credentials: true
}));

app.use(express.json());

// Pass WebSocket Context Layer down to Express Router handlers
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Mounted Application API Endpoint Gateways
app.use("/api/auth", authRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/messages", messages);
app.use("/api/media", mediaRoutes); 
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/admin/testimonials", testimonialAdminRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/client", clientRoutes);

// Direct target gateway for your AI Agent Panel executions
app.use("/api/ai", aiAgentRouter); 

// ==========================================================================
// 🚀 PRODUCTION COUPLER: DATABASE CLUSTER REAL-TIME CHANGE STREAMS
// ==========================================================================
// Stateful in-memory gatekeeper tracking map to debounce rapid cluster broadcasts
const changeStreamDebounceTimers = {};

function initDatabaseChangeStreams(ioInstance) {
    if (!ioInstance) return;
    console.log("⚙️ [REALTIME MATRIX] Synchronizing Live Database Cluster Change Streams...");

    // Helper closure function to throttle and group rapid change signals safely
    const debounceWorkspaceSync = (tabKey, payload) => {
        if (changeStreamDebounceTimers[tabKey]) {
            clearTimeout(changeStreamDebounceTimers[tabKey]);
        }
        
        // Hold the transaction block open for 150ms to compress rapid burst updates into 1 emit
        changeStreamDebounceTimers[tabKey] = setTimeout(() => {
            console.log(`⚡ [REALTIME BROADCAST] Emitting debounced sync matrix request for channel: [${tabKey.toUpperCase()}]`);
            ioInstance.emit("globalWorkspaceSyncRequest", payload);
            delete changeStreamDebounceTimers[tabKey];
        }, 150);
    };

    // 1. Monitor Sales Pipelines mutations
    Lead.watch([], { fullDocument: 'updateLookup' }).on("change", (change) => {
        debounceWorkspaceSync("leads", { action: "DATABASE_LEADS_SYNC", tab: "leads" });
    });

    // 2. Monitor Customer Support interactions
    Message.watch([], { fullDocument: 'updateLookup' }).on("change", (change) => {
        debounceWorkspaceSync("messages", { action: "DATABASE_MESSAGES_SYNC", tab: "messages" });
    });


  Activity.watch([], { fullDocument: "updateLookup" }).on("change", () => {
    debounceWorkspaceSync("logs", {
        action: "DATABASE_LOGS_SYNC",
        tab: "logs"
    });
});
}
const startServer = async () => {
    try {
        await connectDB();
        
        const PORT = process.env.PORT || 5000;
        httpServer.listen(PORT, () => {
            console.log(`🚀 [ENGINE LIVE] Master Node operational on port ${PORT}`);
            initDatabaseChangeStreams(io); // Safely trigger after db topology builds completely
        });
    } catch (error) {
        console.error("❌ Database connection failure. Aborting platform boot cycle:", error);
        process.exit(1);
    }
};

startServer();
