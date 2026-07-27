import Tenant from "../models/Tenant.js";

export async function resolveTenantFromWhatsAppPayload(payload) {
    const phoneNumberId =
        payload?.entry?.[0]?.changes?.[0]?.value?.metadata
            ?.phone_number_id;

    if (!phoneNumberId) {
        throw new Error("WhatsApp phone_number_id is missing");
    }

    const tenant = await Tenant.findOne({
        "whatsapp.phoneNumberId": phoneNumberId,
        status: "active"
    }).select("+whatsapp.accessToken");

    if (!tenant) {
        throw new Error(
            `No business connected to WhatsApp number ${phoneNumberId}`
        );
    }

    return tenant;
}