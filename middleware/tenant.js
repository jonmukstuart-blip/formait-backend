import Tenant from "../models/Tenant.js";

export async function resolveWhatsAppTenant(req, res, next) {
    try {
        const phoneNumberId =
            req.body?.entry?.[0]?.changes?.[0]?.value?.metadata
                ?.phone_number_id;

        if (!phoneNumberId) {
            return res.status(400).json({
                error: "WhatsApp phone number ID is missing"
            });
        }

        const tenant = await Tenant.findOne({
            "whatsapp.phoneNumberId": phoneNumberId,
            status: "active"
        }).select("+whatsapp.accessToken +whatsapp.verifyToken");

        if (!tenant) {
            return res.status(404).json({
                error: "No active business is connected to this number"
            });
        }

        req.tenant = tenant;
        req.tenantId = tenant._id;

        next();

    } catch (error) {
        console.error("[TENANT RESOLUTION ERROR]", error);

        res.status(500).json({
            error: "Could not identify the business"
        });
    }
}

export function requireTenant(req, res, next) {
    if (!req.user?.tenantId) {
        return res.status(403).json({
            error: "Your account is not connected to a business"
        });
    }

    req.tenantId = req.user.tenantId;
    next();
}