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
        "forma.IT Support <support@formaitgroup.com>";

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
                    subject: "A response from forma.IT",

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

<body style="margin:0;padding:0;background:#020617;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">

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
    width="760"
    cellspacing="0"
    cellpadding="0"
    border="0"
    class="email-shell"
    style="width:760px;max-width:760px;background:#071426;border:1px solid #1e3a5f;border-radius:18px;overflow:hidden;border-collapse:collapse;"
>

<!-- Header -->
<tr>
    <td style="padding:30px 38px;background:#081a33;border-bottom:1px solid #17355c;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td>
<img
    src="https://formaitgroup.com/frontend/assets/image/logo.png"
    width="150"
    alt="forma.IT Group"
    style="display:block;width:150px;max-width:100%;height:auto;border:0;"
>
                </td>

                <td align="right">
                    <a
                        href="https://formaitgroup.com"
                        style="display:inline-block;padding:11px 18px;background:#2563eb;color:#ffffff;border-radius:8px;text-decoration:none;font-size:11px;font-weight:bold;"
                    >
                        VISIT WEBSITE
                    </a>
                </td>
            </tr>
        </table>
    </td>
</tr>

<!-- Message -->
<tr>
    <td class="email-padding" style="padding:38px 48px;">
        <h1 style="font-size:25px;line-height:1.3;margin:0 0 16px;color:#ffffff;">
            Hello ${safeName},
        </h1>

        <p style="font-size:15px;line-height:1.75;color:#b8c5d8;margin:0 0 20px;">
            Thank you for contacting forma.IT. Our team has reviewed your
            enquiry and prepared the following response:
        </p>

        <div style="margin:24px 0;padding:22px;background:#0b2343;border-left:4px solid #3b82f6;border-radius:0 10px 10px 0;color:#e2e8f0;font-size:15px;line-height:1.8;">
            ${safeMessage}
        </div>

        <p style="font-size:14px;line-height:1.7;color:#9fb0c7;margin:0;">
            Need more assistance? Reply directly to this email and our support
            team will be happy to help.
        </p>

        <p style="font-size:14px;line-height:1.7;color:#dbeafe;margin:26px 0 0;">
            Kind regards,<br>
            <strong style="color:#ffffff;">forma.IT 
            Support Team</strong>
        </p>
    </td>
</tr>

<!-- Landscape contact footer -->
<tr>
    <td style="background:#061225;border-top:1px solid #17355c;padding:26px 25px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <!-- Email -->
                <td class="contact-column" width="25%" align="center" valign="top">
                    <img
                        src="https://img.icons8.com/ios-filled/50/60a5fa/new-post.png"
                        width="25"
                        height="25"
                        alt="Email"
                        style="display:block;margin:0 auto 10px;"
                    >

                    <div style="font-size:10px;font-weight:bold;color:#ffffff;text-transform:uppercase;margin-bottom:7px;">
                        Email
                    </div>

                    <a
                        href="mailto:support@formaitgroup.com"
                        style="font-size:9px;color:#93c5fd;text-decoration:none;"
                    >
                        support@formaitgroup.com
                    </a>

                    <br>

                    <a
                        href="mailto:info@formaitgroup.com"
                        style="font-size:9px;color:#94a3b8;text-decoration:none;"
                    >
                        info@formaitgroup.com
                    </a>
                </td>

                <!-- Phone -->
                <td class="contact-column" width="25%" align="center" valign="top">
                    <img
                        src="https://img.icons8.com/ios-filled/50/60a5fa/phone.png"
                        width="25"
                        height="25"
                        alt="Phone"
                        style="display:block;margin:0 auto 10px;"
                    >

                    <div style="font-size:10px;font-weight:bold;color:#ffffff;text-transform:uppercase;margin-bottom:7px;">
                        Call us
                    </div>

                    <a
                        href="tel:+256745860988"
                        style="display:block;font-size:9px;color:#93c5fd;text-decoration:none;line-height:1.7;"
                    >
                        +256 745 860 988
                    </a>

                    <a
                        href="tel:+256794616175"
                        style="display:block;font-size:9px;color:#94a3b8;text-decoration:none;line-height:1.7;"
                    >
                        +256 794 616 175
                    </a>
                </td>

                <!-- WhatsApp -->
                <td class="contact-column" width="25%" align="center" valign="top">
                    <img
                        src="https://img.icons8.com/color/48/whatsapp--v1.png"
                        width="27"
                        height="27"
                        alt="WhatsApp"
                        style="display:block;margin:0 auto 8px;"
                    >

                    <div style="font-size:10px;font-weight:bold;color:#ffffff;text-transform:uppercase;margin-bottom:7px;">
                        WhatsApp
                    </div>

                    <a
                        href="https://wa.me/256794616175"
                        style="font-size:9px;color:#4ade80;text-decoration:none;"
                    >
                        +256 794 616 175
                    </a>
                </td>

                <!-- Location -->
                <td class="contact-column" width="25%" align="center" valign="top">
                    <img
                        src="https://img.icons8.com/ios-filled/50/60a5fa/marker.png"
                        width="25"
                        height="25"
                        alt="Location"
                        style="display:block;margin:0 auto 10px;"
                    >

                    <div style="font-size:10px;font-weight:bold;color:#ffffff;text-transform:uppercase;margin-bottom:7px;">
                        Office
                    </div>

                    <span style="font-size:9px;color:#94a3b8;">
                        Kampala, Uganda
                    </span>
                </td>
            </tr>
        </table>
    </td>
</tr>

<!-- Social media strip -->
<tr>
    <td align="center" style="background:#040c19;padding:18px 20px;border-top:1px solid #17355c;">
        <span style="font-size:10px;color:#64748b;text-transform:uppercase;margin-right:18px;">
            Follow forma.IT
        </span>

        <a
            href="https://www.facebook.com/share/171GwhGJQ1/"
            style="display:inline-block;margin:0 7px;text-decoration:none;"
        >
            <img
                src="https://img.icons8.com/color/48/facebook-new.png"
                width="25"
                height="25"
                alt="Facebook"
                style="display:block;border:0;"
            >
        </a>

        <a
            href="https://www.instagram.com/forma.itgroup?igsh=MWt6a3huamt3b3Ewcw=="
            style="display:inline-block;margin:0 7px;text-decoration:none;"
        >
            <img
                src="https://img.icons8.com/fluency/48/instagram-new.png"
                width="25"
                height="25"
                alt="Instagram"
                style="display:block;border:0;"
            >
        </a>

        <a
            href="https://x.com/Formaitgroup"
            style="display:inline-block;margin:0 7px;text-decoration:none;"
        >
            <img
                src="https://img.icons8.com/ios-filled/50/ffffff/twitterx--v2.png"
                width="23"
                height="23"
                alt="X"
                style="display:block;border:0;"
            >
        </a>
    </td>
</tr>

<!-- Legal footer -->
<tr>
    <td align="center" style="background:#020817;padding:14px 20px;color:#64748b;font-size:9px;">
        <a
            href="https://formaitgroup.com"
            style="color:#93c5fd;text-decoration:none;margin-right:14px;"
        >
            Website
        </a>

        <a
            href="mailto:info@formaitgroup.com"
            style="color:#93c5fd;text-decoration:none;margin-right:14px;"
        >
            Official contact
        </a>

        <span>
            © ${new Date().getFullYear()} forma.IT Group. All rights reserved.
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