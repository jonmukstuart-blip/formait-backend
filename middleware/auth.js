import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (
        !authHeader ||
        !authHeader.startsWith("Bearer ")
    ) {
        return res.status(401).json({
            message: "No token provided, access denied"
        });
    }

    try {
        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.id)
            .select("_id name email role tenantId");

        if (!user) {
            return res.status(401).json({
                message: "Administrator account not found"
            });
        }

        if (!user.tenantId) {
            return res.status(403).json({
                message: "Administrator is not connected to a business"
            });
        }

        req.user = user;
        req.tenantId = user.tenantId;

        next();

    } catch (error) {
        console.error("[AUTH ERROR]", error.message);

        return res.status(401).json({
            message: "Not authorized, token failed"
        });
    }
};