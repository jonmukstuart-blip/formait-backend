import nodemailer from "nodemailer";

const smtpPort = Number(process.env.SMTP_PORT || 465);

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: smtpPort,
    secure: smtpPort === 465,

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },

    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000
});

export async function sendMail({ name, email, message }) {
    if (!email) {
        throw new Error("The client has no email address.");
    }

    const result = await transporter.sendMail({
        from: `"FORMA.IT Support" <${process.env.EMAIL_USER}>`,
        replyTo: process.env.EMAIL_USER,
        to: email,
        subject: "A response from FORMA.IT",

        html: `
            <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#222;">
                <h2>Hello ${name || "there"},</h2>

                <p>Thank you for contacting FORMA.IT.</p>

                <p>Our team has replied to your enquiry:</p>

                <div style="margin:24px 0;padding:18px;background:#f5f7fa;border-left:4px solid #3b82f6;border-radius:6px;">
                    ${String(message).replace(/\n/g, "<br>")}
                </div>

                <p>
                    Kind regards,<br>
                    <strong>FORMA.IT Team</strong>
                </p>
            </div>
        `
    });

    console.log(
        "📧 Email sent successfully:",
        result.messageId,
        "to:",
        email
    );

    return result;
}