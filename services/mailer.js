function escapeEmailHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export async function sendMail({ name, email, message }) {
    const apiKey = process.env.RESEND_API_KEY;

    const fromEmail =
        process.env.RESEND_FROM_EMAIL ||
        "FORMA.IT Support <support@send.formaitgroup.com>";

    const replyEmail =
        process.env.COMPANY_REPLY_EMAIL ||
        "info@formaitgroup.com";

    if (!apiKey) {
        throw new Error("RESEND_API_KEY is missing.");
    }

    if (!email) {
        throw new Error("The client has no email address.");
    }

    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, 20000);

    try {
        const response = await fetch(
            "https://api.resend.com/emails",
            {
                method: "POST",

                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    from: fromEmail,
                    to: [email],
                    reply_to: replyEmail,
                    subject: "A response from FORMA.IT",

                    html: `
                        <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#222;">
                            <h2>
                                Hello ${escapeEmailHtml(name || "there")},
                            </h2>

                            <p>Thank you for contacting FORMA.IT.</p>

                            <p>Our team has replied to your enquiry:</p>

                            <div style="margin:24px 0;padding:18px;background:#f5f7fa;border-left:4px solid #3b82f6;border-radius:6px;line-height:1.7;">
                                ${escapeEmailHtml(message).replace(/\n/g, "<br>")}
                            </div>

                            <p>
                                Kind regards,<br>
                                <strong>FORMA.IT Team</strong>
                            </p>
                        </div>
                    `
                }),

                signal: controller.signal
            }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                result.message ||
                result.error ||
                `Email API failed ${response.status}`
            );
        }

        console.log(
            "📧 Resend email delivered:",
            result.id,
            "to:",
            email
        );

        return result;

    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error("Email API request timed out.");
        }

        throw error;

    } finally {
        clearTimeout(timeout);
    }
}