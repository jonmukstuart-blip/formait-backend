import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import { connectDB } from "./config/db.js";

import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import crmRoutes from "./routes/crm.js";
import contactRoutes from "./routes/contact.js";
import leadRoutes from "./routes/leadRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// ROUTES
app.use("/api/leads", leadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/crm", crmRoutes);
app.use("/api/contact", contactRoutes);

// TEST ROUTE
app.get("/", (req, res) => {
    res.send("Forma.IT CRM Backend Running");
});

// DB
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
