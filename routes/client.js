import express from "express";
import bcrypt from "bcryptjs";
import Client from "../models/client.js";

const router = express.Router();


router.post("/register", async (req, res) => {

    try {

        const { name, email, password } = req.body;


        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields required"
            });
        }


        const existingClient = await Client.findOne({ email });


        if (existingClient) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }


        const hashedPassword = await bcrypt.hash(password, 10);


        const client = await Client.create({
            name,
            email,
            password: hashedPassword
        });


        res.status(201).json({
            message: "Account created successfully",
            client
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }

});


export default router;