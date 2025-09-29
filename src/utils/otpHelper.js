// utils/otpHelpers.js

/**
 * Generates a random numeric OTP
 * @param {number} length - Length of OTP (default: 6)
 * @returns {string} Generated OTP
 */
export const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

/**
 * Stores OTP in session with metadata
 * @param {object} req - Express request object
 * @param {string} email - User's email
 * @param {string} otp - Generated OTP
 * @param {string} purpose - 'register' | 'login' | 'reset'
 * @param {number} expiresIn - Expiration in ms (default: 5 minutes)
 */
export const storeOTPInSession = (req, email, otp, purpose, expiresIn = 5 * 60 * 1000) => {
  req.session.otpData = {
    code: otp,
    for: email,
    purpose: purpose,
    expires: Date.now() + expiresIn,
    attempts: 0
  };
};

/**
 * Verifies OTP against session storage
 * @param {object} req - Express request object
 * @param {string} email - User's email
 * @param {string} otp - User-provided OTP
 * @param {string} purpose - Expected purpose
 * @returns {object} { success: boolean, message: string }
 */
export const verifyOTPFromSession = (req, email, otp, purpose) => {
  if (!req.session.otpData) {
    return { success: false, message: "No OTP requested" };
  }

  const otpData = req.session.otpData;

  // Validation checks
  if (otpData.for !== email) {
    return { success: false, message: "OTP not for this email" };
  }

  if (otpData.purpose !== purpose) {
    return { success: false, message: "OTP not for this purpose" };
  }

  if (Date.now() > otpData.expires) {
    delete req.session.otpData;
    return { success: false, message: "OTP expired" };
  }

  if (otpData.attempts >= 3) {
    delete req.session.otpData;
    return { success: false, message: "Too many attempts" };
  }

  if (otpData.code !== otp) {
    req.session.otpData.attempts++;
    return { success: false, message: "Invalid OTP" };
  }

  // Successful verification
  req.session.otpVerified = { 
    email,
    purpose,
    verifiedAt: Date.now() 
  };
  delete req.session.otpData;
  return { success: true, message: "OTP verified" };
};

// Email transporter configuration
export const createEmailTransporter = () => {
  return createTransport({
    service: "gmail",
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });
};