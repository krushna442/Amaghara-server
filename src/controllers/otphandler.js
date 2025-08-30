import { createTransport } from "nodemailer";

export const sendOTPHandler = async ({ email, subject, otp }) => {
    const transporter = createTransport({
        service: "gmail",
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: subject,
        text: `Your OTP is: ${otp}`,
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true, message: `OTP sent to ${email}` };
    } catch (err) {
        console.error("Email error:", err);
        return { success: false, message: "Error sending OTP email." };
    }
};