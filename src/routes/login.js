import express from 'express';
import { 
  getAdminGoogleLogin, 
  getUserGoogleLogin, 
  handleAdminGoogleCallback, 
  handleUserGoogleCallback,
  adminLogout,
  userLogout
} from '../controllers/googleAuthController.js';
import { sendOTPHandler } from '../controllers/otphandler.js';
import {generateOTP, storeOTPInSession, verifyOTPFromSession} from '../utils/otpHelper.js'

const router = express.Router();

// Admin Google OAuth routes
router.get('/admin/google', getAdminGoogleLogin);
router.get('/admin/google/callback', handleAdminGoogleCallback);

// User Google OAuth routes
router.get('/user/google', getUserGoogleLogin);
router.get('/user/google/callback', handleUserGoogleCallback);

// Logout routes
router.post('/admin/logout', adminLogout);
router.post('/user/logout', userLogout); 



// Send OTP route
router.post('/user/send-otp', async (req, res) => {
    const { email, purpose } = req.body; // purpose can be 'register', 'login', or 'reset'
    
    if (!email || !purpose) {
        return res.status(400).json({ success: false, message: "Email and purpose are required" });
    }

    const otp = generateOTP(); // 6-digit code
    const subject = "Security Verification"

    const result = await sendOTPHandler({ 
        email, 
        subject, 
        otp
    });

    if (result.success) {
        // Store OTP in session for later verification
        storeOTPInSession(req, email, otp, purpose);
        res.json(result);
    } else {
        res.status(500).json(result);
    }
});


router.post('/user/verify-otp', async (req, res) => {
    const { email, otp, purpose } = req.body;
    
    if (!req.session.otpData) {
        return res.status(400).json({ success: false, message: "No OTP requested" });
    }

    const otpData = req.session.otpData;

    // Check if OTP matches the email and purpose
    if (otpData.for !== email || otpData.purpose !== purpose) {
        return res.status(400).json({ success: false, message: "Invalid OTP request" });
    }

    // Check expiry
    if (Date.now() > otpData.expires) {
        delete req.session.otpData;
        return res.status(400).json({ success: false, message: "OTP expired" });
    }

    // Check attempts
    if (otpData.attempts >= 3) {
        delete req.session.otpData;
        return res.status(429).json({ success: false, message: "Too many attempts" });
    }

    // Verify OTP
    if (otpData.code === otp) {
        // Mark as verified (you might want to store this separately)
        req.session.otpVerified = { 
            email,
            purpose,
            verifiedAt: Date.now() 
        };
        delete req.session.otpData;
        return res.json({ success: true, message: "OTP verified" });
    }

    // Increment attempts on failure
    req.session.otpData.attempts++;
    res.status(400).json({ success: false, message: "Invalid OTP" });
});

export default router;