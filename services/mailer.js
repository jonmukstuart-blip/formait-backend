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
        "FORMA.IT Support <support@formaitgroup.com>";

    if (!apiKey) {
        throw new Error("RESEND_API_KEY is missing.");
    }

    if (!email) {
        throw new Error("The client has no email address.");
    }

    const safeName = escapeEmailHtml(name || "there");

    const safeMessage = escapeEmailHtml(message)
        .replace(/\n/g, "<br>");

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
                    reply_to: "support@formaitgroup.com",
                    subject: "A response from FORMA.IT",

                    html: `
<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b;">

    <div style="padding:32px 16px;">

        <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e4e4e7;">

            <!-- Header -->
            <div style="background:#09090b;padding:30px;text-align:center;">
                <div style="font-size:27px;font-weight:800;color:#ffffff;letter-spacing:-1px;">
                    forma<span style="color:#3b82f6;">.IT</span>
                </div>

                <div style="margin-top:6px;color:#71717a;font-size:10px;letter-spacing:3px;text-transform:uppercase;">
                    Group
                </div>
            </div>

            <!-- Main content -->
            <div style="padding:36px 30px;">

                <h2 style="margin:0 0 18px;font-size:23px;color:#18181b;">
                    Hello ${safeName},
                </h2>

                <p style="margin:0 0 18px;color:#52525b;line-height:1.7;font-size:15px;">
                    Thank you for getting in touch with FORMA.IT. A member
                    of our team has reviewed your enquiry and sent the
                    following response:
                </p>

                <div style="margin:26px 0;padding:22px;background:#f8fafc;border-left:4px solid #3b82f6;border-radius:8px;color:#27272a;line-height:1.8;font-size:15px;">
                    ${safeMessage}
                </div>

                <p style="color:#52525b;line-height:1.7;font-size:14px;">
                    If you need any further assistance, simply reply to
                    this email and our support team will be happy to help.
                </p>

                <div style="margin-top:28px;">
                    <a
                        href="https://formaitgroup.com"
                        style="display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;padding:13px 22px;border-radius:8px;font-size:14px;font-weight:700;"
                    >
                        Visit Our Website
                    </a>
                </div>

                <p style="margin:32px 0 0;color:#3f3f46;line-height:1.7;font-size:14px;">
                    Kind regards,<br>
                    <strong>FORMA.IT Support Team</strong>
                </p>

            </div>

            <!-- Contact information -->
            <div style="background:#18181b;padding:28px 30px;color:#d4d4d8;">

                <h3 style="margin:0 0 18px;color:#ffffff;font-size:15px;">
                    Contact FORMA.IT
                </h3>

                <p style="margin:7px 0;font-size:13px;">
                    Support:
                    <a href="mailto:support@formaitgroup.com" style="color:#60a5fa;text-decoration:none;">
                        support@formaitgroup.com
                    </a>
                </p>

                <p style="margin:7px 0;font-size:13px;">
                    Official:
                    <a href="mailto:info@formaitgroup.com" style="color:#60a5fa;text-decoration:none;">
                        info@formaitgroup.com
                    </a>
                </p>

                <p style="margin:7px 0;font-size:13px;">
                    Phone:
                    <a href="tel:+256745860988" style="color:#d4d4d8;text-decoration:none;">
                        +256 745 860 988
                    </a>
                    /
                    <a href="tel:+256794616175" style="color:#d4d4d8;text-decoration:none;">
                        +256 794 616 175
                    </a>
                </p>

                <p style="margin:7px 0;font-size:13px;">
                    WhatsApp:
                    <a href="https://wa.me/256794616175" style="color:#4ade80;text-decoration:none;">
                        +256 794 616 175
                    </a>
                </p>

                <p style="margin:7px 0;font-size:13px;">
                    Kampala, Uganda
                </p>

                <!-- Social links -->
                <div style="margin-top:22px;padding-top:18px;border-top:1px solid #27272a;">

                    <a
                        href="https://www.facebook.com/share/171GwhGJQ1/"
                        style="color:#60a5fa;text-decoration:none;font-size:13px;margin-right:16px;"
                    >
                        Facebook
                    </a>

                    <a
                        href="https://www.instagram.com/forma.itgroup?igsh=MWt6a3huamt3b3Ewcw=="
                        style="color:#f472b6;text-decoration:none;font-size:13px;margin-right:16px;"
                    >
                        Instagram
                    </a>

                    <a
                        href="https://x.com/Formaitgroup"
                        style="color:#ffffff;text-decoration:none;font-size:13px;"
                    >
                        X
                    </a>

                </div>

            </div>

            <!-- Copyright -->
            <div style="background:#09090b;padding:18px;text-align:center;color:#52525b;font-size:11px;">
                © ${new Date().getFullYear()} FORMA.IT Group. All rights reserved.
            </div>

        </div>

    </div>

</body>
</html>
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
            "📧 Branded email sent:",
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