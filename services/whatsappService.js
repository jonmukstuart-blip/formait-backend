export async function sendWhatsAppText({
    tenant,
    recipient,
    text
}) {
    const phoneNumberId =
        tenant.whatsapp.phoneNumberId;

    const accessToken =
        tenant.whatsapp.accessToken;

    if (!phoneNumberId || !accessToken) {
        throw new Error(
            `WhatsApp credentials missing for ${tenant.businessName}`
        );
    }

    const apiVersion =
        process.env.WHATSAPP_API_VERSION || "v23.0";

    const response = await fetch(
        `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
        {
            method: "POST",

            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: recipient,
                type: "text",

                text: {
                    preview_url: false,
                    body: text
                }
            })
        }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        console.error("[WHATSAPP SEND ERROR]", result);

        throw new Error(
            result?.error?.message ||
            `WhatsApp send failed ${response.status}`
        );
    }

    return result;
}