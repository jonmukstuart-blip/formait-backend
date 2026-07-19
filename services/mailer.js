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
<head>
    <meta charset="UTF-8">

    <style>
        @media only screen and (max-width: 600px) {
            .email-shell {
                width: 100% !important;
            }

            .email-padding {
                padding-left: 20px !important;
                padding-right: 20px !important;
            }

            .quick-column,
            .contact-column {
                display: block !important;
                width: 100% !important;
                border-right: none !important;
                border-bottom: 1px solid #e4e4e7 !important;
                padding: 18px 10px !important;
                box-sizing: border-box !important;
            }

            .contact-column:last-child,
            .quick-column:last-child {
                border-bottom: none !important;
            }
        }
    </style>
</head>

<body style="margin:0;padding:0;background:#f1f3f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">

<table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="background:#f1f3f5;"
>
<tr>
<td align="center" style="padding:35px 14px;">

<table
    role="presentation"
    width="640"
    cellspacing="0"
    cellpadding="0"
    border="0"
    class="email-shell"
    style="width:640px;max-width:640px;background:#ffffff;border-collapse:collapse;"
>

    <!-- Logo -->
    <tr>
        <td align="center" style="padding:34px 20px 22px;">
            <div style="font-size:30px;font-weight:800;letter-spacing:-1.5px;color:#111111;">
                forma<span style="color:#2563eb;">.IT</span>
            </div>

            <div style="font-size:9px;letter-spacing:4px;color:#71717a;text-transform:uppercase;margin-top:5px;">
                Group
            </div>
        </td>
    </tr>

    <!-- Message -->
    <tr>
        <td
            class="email-padding"
            style="padding:15px 52px 38px;"
        >
            <h1 style="font-size:24px;line-height:1.3;margin:0 0 18px;color:#18181b;">
                Hello ${safeName},
            </h1>

            <p style="font-size:15px;line-height:1.75;color:#52525b;margin:0 0 18px;">
                Thank you for contacting FORMA.IT. Our team has reviewed
                your enquiry and sent the following response:
            </p>

            <div style="margin:24px 0;padding:20px;background:#f8fafc;border-left:4px solid #2563eb;color:#27272a;font-size:15px;line-height:1.8;">
                ${safeMessage}
            </div>

            <p style="font-size:14px;line-height:1.7;color:#52525b;margin:0;">
                If you need further assistance, reply directly to this
                email and our support team will help you.
            </p>

            <p style="font-size:14px;line-height:1.7;color:#3f3f46;margin:28px 0 0;">
                Kind regards,<br>
                <strong>FORMA.IT Support Team</strong>
            </p>
        </td>
    </tr>

    <!-- Quick actions -->
    <tr>
        <td style="border-top:1px solid #e4e4e7;">
            <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="border-collapse:collapse;"
            >
                <tr>

                    <td
                        class="quick-column"
                        width="33.33%"
                        align="center"
                        valign="top"
                        style="padding:25px 12px;border-right:1px solid #e4e4e7;"
                    >
                        <div style="font-size:22px;margin-bottom:9px;">
                            ↗
                        </div>

                        <div style="font-size:11px;font-weight:800;color:#18181b;text-transform:uppercase;">
                            Visit our website
                        </div>

                        <a
                            href="https://formaitgroup.com"
                            style="display:inline-block;margin-top:8px;color:#2563eb;font-size:10px;font-weight:700;text-decoration:none;text-transform:uppercase;"
                        >
                            Explore FORMA.IT
                        </a>
                    </td>

                    <td
                        class="quick-column"
                        width="33.33%"
                        align="center"
                        valign="top"
                        style="padding:25px 12px;border-right:1px solid #e4e4e7;"
                    >
                        <div style="font-size:22px;margin-bottom:9px;">
                            ✉
                        </div>

                        <div style="font-size:11px;font-weight:800;color:#18181b;text-transform:uppercase;">
                            Email support
                        </div>

                        <a
                            href="mailto:support@formaitgroup.com"
                            style="display:inline-block;margin-top:8px;color:#2563eb;font-size:10px;font-weight:700;text-decoration:none;text-transform:uppercase;"
                        >
                            Contact support
                        </a>
                    </td>

                    <td
                        class="quick-column"
                        width="33.33%"
                        align="center"
                        valign="top"
                        style="padding:25px 12px;"
                    >
                        <div style="font-size:22px;margin-bottom:9px;">
                            ◉
                        </div>

                        <div style="font-size:11px;font-weight:800;color:#18181b;text-transform:uppercase;">
                            Chat on WhatsApp
                        </div>

                        <a
                            href="https://wa.me/256794616175"
                            style="display:inline-block;margin-top:8px;color:#2563eb;font-size:10px;font-weight:700;text-decoration:none;text-transform:uppercase;"
                        >
                            Start conversation
                        </a>
                    </td>

                </tr>
            </table>
        </td>
    </tr>

    <!-- Social strip -->
    <tr>
        <td
            align="center"
            style="background:#050505;padding:18px 15px;"
        >
            <a
                href="https://www.facebook.com/share/171GwhGJQ1/"
                style="display:inline-block;width:28px;height:28px;line-height:28px;margin:0 6px;border-radius:50%;background:#ffffff;color:#050505;font-size:12px;font-weight:800;text-decoration:none;text-align:center;"
            >
                f
            </a>

            <a
                href="https://www.instagram.com/forma.itgroup?igsh=MWt6a3huamt3b3Ewcw=="
                style="display:inline-block;width:28px;height:28px;line-height:28px;margin:0 6px;border-radius:50%;background:#ffffff;color:#050505;font-size:11px;font-weight:800;text-decoration:none;text-align:center;"
            >
                ig
            </a>

            <a
                href="https://x.com/Formaitgroup"
                style="display:inline-block;width:28px;height:28px;line-height:28px;margin:0 6px;border-radius:50%;background:#ffffff;color:#050505;font-size:12px;font-weight:800;text-decoration:none;text-align:center;"
            >
                X
            </a>
        </td>
    </tr>

    <!-- Contact blocks -->
    <tr>
        <td style="background:#ffffff;">
            <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="border-collapse:collapse;"
            >
                <tr>

                    <td
                        class="contact-column"
                        width="25%"
                        align="center"
                        valign="top"
                        style="padding:25px 10px;border-right:1px solid #e4e4e7;"
                    >
                        <div style="font-size:22px;color:#52525b;">
                            ✉
                        </div>

                        <p style="font-size:10px;font-weight:800;text-transform:uppercase;margin:9px 0 5px;color:#18181b;">
                            Support
                        </p>

                        <a
                            href="mailto:support@formaitgroup.com"
                            style="font-size:9px;color:#71717a;text-decoration:none;"
                        >
                            support@formaitgroup.com
                        </a>
                    </td>

                    <td
                        class="contact-column"
                        width="25%"
                        align="center"
                        valign="top"
                        style="padding:25px 10px;border-right:1px solid #e4e4e7;"
                    >
                        <div style="font-size:22px;color:#52525b;">
                            ☎
                        </div>

                        <p style="font-size:10px;font-weight:800;text-transform:uppercase;margin:9px 0 5px;color:#18181b;">
                            Call us
                        </p>

                        <a
                            href="tel:+256745860988"
                            style="display:block;font-size:9px;color:#71717a;text-decoration:none;line-height:1.6;"
                        >
                            +256 745 860 988
                        </a>

                        <a
                            href="tel:+256794616175"
                            style="display:block;font-size:9px;color:#71717a;text-decoration:none;line-height:1.6;"
                        >
                            +256 794 616 175
                        </a>
                    </td>

                    <td
                        class="contact-column"
                        width="25%"
                        align="center"
                        valign="top"
                        style="padding:25px 10px;border-right:1px solid #e4e4e7;"
                    >
                        <div style="font-size:22px;color:#52525b;">
                            ●
                        </div>

                        <p style="font-size:10px;font-weight:800;text-transform:uppercase;margin:9px 0 5px;color:#18181b;">
                            WhatsApp
                        </p>

                        <a
                            href="https://wa.me/256794616175"
                            style="font-size:9px;color:#71717a;text-decoration:none;"
                        >
                            +256 794 616 175
                        </a>
                    </td>

                    <td
                        class="contact-column"
                        width="25%"
                        align="center"
                        valign="top"
                        style="padding:25px 10px;"
                    >
                        <div style="font-size:22px;color:#52525b;">
                            ◇
                        </div>

                        <p style="font-size:10px;font-weight:800;text-transform:uppercase;margin:9px 0 5px;color:#18181b;">
                            Visit us
                        </p>

                        <span style="font-size:9px;color:#71717a;">
                            Kampala, Uganda
                        </span>
                    </td>

                </tr>
            </table>
        </td>
    </tr>

    <!-- Legal footer -->
    <tr>
        <td
            align="center"
            style="background:#3f3f46;padding:16px 20px;color:#d4d4d8;font-size:9px;"
        >
            <a
                href="https://formaitgroup.com"
                style="color:#ffffff;text-decoration:none;margin-right:15px;"
            >
                Website
            </a>

            <a
                href="mailto:info@formaitgroup.com"
                style="color:#ffffff;text-decoration:none;margin-right:15px;"
            >
                Official Contact
            </a>

            <span>
                © ${new Date().getFullYear()} FORMA.IT Group. All rights reserved.
            </span>
        </td>
    </tr>

</table>

</td>
</tr>
</table>

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