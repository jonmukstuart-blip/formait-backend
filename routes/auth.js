import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const router = express.Router();


router.post("/login", async (req, res) => {
    try {

        const { email, password } = req.body;

        console.log("[LOGIN ATTEMPT]", email);

        const user = await User.findOne({ email });

        console.log("[USER FOUND]", !!user);

        if (!user) {
            console.log("[LOGIN FAILED] User not found");

            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        console.log("[DB EMAIL]", user.email);

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        console.log("[PASSWORD MATCH]", passwordMatch);

        if (!passwordMatch) {

            console.log("[LOGIN FAILED] Wrong password");

            return res.status(401).json({
                message: "Invalid email or password"
            });

        }

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: "admin"
            },
            process.env.JWT_SECRET || "development_secret_key",
            {
                expiresIn: "24h"
            }
        );

        console.log("[LOGIN SUCCESS]", email);

        res.json({
            success: true,
            token
        });

    } catch (err) {

        console.error("[AUTH ERROR]", err);

        res.status(500).json({
            error: err.message
        });

    }
});

export default router;