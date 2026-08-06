import jwt from "jsonwebtoken";
import User from "../models/User.js";
import TenantMembership from "../models/TenantMembership.js";

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

        const requestedTenantId =
            req.headers["x-tenant-id"];

        const membershipQuery = {
            userId: user._id,
            status: "active"
        };

        if (requestedTenantId) {
            membershipQuery.tenantId = requestedTenantId;

        } else if (user.tenantId) {
            membershipQuery.tenantId = user.tenantId;
        }

        let membership =
            await TenantMembership.findOne(
                membershipQuery
            );

        // If the original tenantId is no longer available,
        // safely use the user's first active membership.
        if (!membership && !requestedTenantId) {
            membership =
                await TenantMembership.findOne({
                    userId: user._id,
                    status: "active"
                });
        }

        if (!membership) {
            return res.status(403).json({
                message:
                    "You are not an active member of this business"
            });
        }

        req.user = user;
        req.membership = membership;
        req.tenantId = membership.tenantId;
        req.userRole = membership.role;
        req.permissions = membership.permissions || [];

        next();

    } catch (error) {
        console.error("[AUTH ERROR]", error.message);

        return res.status(401).json({
            message: "Not authorized, token failed"
        });
    }
};

export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.membership) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        if (!allowedRoles.includes(req.userRole)) {
            return res.status(403).json({
                message:
                    "You do not have permission to perform this action"
            });
        }

        next();
    };
};