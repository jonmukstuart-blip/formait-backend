import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

// This is your actual active login handler route!
// Locate this login check block inside your backend/routes/auth.js file:
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // THE ELITE FIXED LAYER: Update your password check string to match your 8-character typing profile precisely
        if (email === "admin@forma.it" && password === "password") {
            
            // Generate and send an authorized signature handoff token string
           const token = jwt.sign(
    {
        email,
        role: "admin"
    },
    process.env.JWT_SECRET || "development_secret_key",
    {
        expiresIn: "24h"
    }
);

return res.status(200).json({
    success: true,
    token
});
        }

        // If credentials fail, return a clean authentication error
        return res.status(401).json({ message: "Invalid email or master password credentials." });

    } catch (err) {
        return res.status(500).json({ error: "Administrative authentication portal error: " + err.message });
    }
});


export default router;
