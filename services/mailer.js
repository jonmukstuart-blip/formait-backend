import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


export async function sendMail({ name, email, message }) {

    await transporter.sendMail({

        from: `"FORMA.IT Support" <${process.env.EMAIL_USER}>`,

        to: email,

        subject: "FORMA.IT Response",

        html: `
        <h2>Hello ${name}</h2>

        <p>Thank you for contacting FORMA.IT.</p>

        <p>Your message has received a response:</p>

        <hr>

        <p>${message}</p>

        <hr>

        <p>FORMA.IT Team</p>
        `
    });

    console.log("📧 Email sent to:", email);
}