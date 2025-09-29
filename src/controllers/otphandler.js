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
    html: `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP Verification</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
            <tr>
                <td align="center" style="padding: 40px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <tr>
                            <td style="padding: 40px 30px; text-align: center;">
                                <div style="margin-bottom: 20px;">
                                    <h2 style="color: #333333; margin: 0;">Your Verification Code</h2>
                                </div>
                                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0;">
                                    <p style="margin: 0; color: #666666; font-size: 16px;">Use the following OTP to complete your verification process. This code will expire in 10 minutes.</p>
                                    <div style="background-color: #e9ecef; padding: 15px; border-radius: 4px; margin: 20px 0; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #495057;">
                                        ${otp}
                                    </div>
                                    <p style="margin: 0; color: #666666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
                                </div>
                                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee;">
                                    <p style="margin: 0; color: #999999; font-size: 12px;">This is an automated message, please do not reply.</p>
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `,
};

    try {
        await transporter.sendMail(mailOptions);
        return { success: true, message: `OTP sent to ${email}` };
    } catch (err) {
        console.error("Email error:", err);
        return { success: false, message: "Error sending OTP email." };
    }
};  