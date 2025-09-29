import {generateState,generateCodeVerifier, Google, decodeIdToken } from 'arctic'; // Import a utility function to generate a unique state parameter
import { google } from '../oauth/google.js'; // Fix import for Google OAuth instance
import Admin from '../models/admin.js'; // Import the Admin model
import User from '../models/user.js';
import { createTransport } from 'nodemailer';
import { generateOTP, storeOTPInSession } from '../utils/otpHelper.js';
import { sendOTPHandler } from './otphandler.js';
import bcrypt from 'bcrypt';

export const getGoogleLoginPage= async (req, res) => {
    if(req.user) {
        return res.redirect('/'); // Redirect to home if already logged in
    }  
    const type = req.path.includes('/admin/google') ? 'admin' : 'user';

    const state = generateState(); // Function to generate a unique state parameter
    const codeVerifier = generateCodeVerifier(); // Function to generate a code verifier for PKCE
    const url = google.createAuthorizationURL(state, codeVerifier,["openid","profile","email"]); // Create the authorization URL with state and code verifier

    const cookieconfig = {
        httpOnly: true,
        secure :true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000 *24
    };
    res.cookie("google_oauth_state",state, cookieconfig); // Set the state in a secure cookie
      res.cookie("google_oauth_type", type, cookieconfig);
    res.cookie("google_oauth_code_verifier", codeVerifier, cookieconfig); // Set the code verifier in a secure cookie
    res.redirect(url.toString()); // Redirect the user to the Google OAuth login page

}


export const handleGoogleCallback = async (req, res) => {
    const { code, state} = req.query; // type: 'user' or 'admin'
    const storedState = req.cookies.google_oauth_state;
    const codeVerifier = req.cookies.google_oauth_code_verifier;
    const type = req.cookies.google_oauth_type;

    if (state !== storedState) {
        return res.status(400).send('Invalid state parameter');
    }

    let tokens;
    try {
        tokens = await google.validateAuthorizationCode(code, codeVerifier);
    } catch (error) {
        console.error('Error validating authorization code:', error);
        return res.status(500).send('Error during Google OAuth callback');
    }

    const claims = decodeIdToken(tokens.idToken());
    const { sub: googleUserId, name, email, picture } = claims;

    try {
        let model, role;
        if (type === 'user') {
            model = User;
            role = 'user';
        } else {
            model = Admin;
            role = 'admin';
        }

        let record = await model.findOne({ email }).select('+password');

        if (record) {
            // Condition 1: Already linked
            if (record.googleId === googleUserId) {
                record.lastLogin = new Date();
                record.name = name;
                record.picture = picture;
                await record.save();
                res.cookie(role === 'admin' ? 'adminId' : 'userId', record._id.toString(), {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 1000 * 24 // 1 day
                });
                return res.json({
                    success: true,
                    message: `Logged in with Google (${role} already linked)`,
                    user: {
                        id: record._id,
                        name: record.name,
                        email: record.email,
                        picture: record.picture,
                        role: role
                    }
                });
            }
            // Condition 2: Exists but not linked
            else {
                record.googleId = googleUserId;
                record.name = name;
                record.picture = picture;
                record.lastLogin = new Date();
                await record.save();
                return res.json({
                    success: true,
                    message: `Google account linked to existing ${role}`,
                    user: {
                        id: record._id,
                        name: record.name,
                        email: record.email,
                        picture: record.picture,
                        role: role
                    }
                });
            }
        } else {
            // Condition 3: Doesn't exist
            const newRecordData = {
                name,
                email,
                googleId: googleUserId,
                picture,
                lastLogin: new Date(),
                password: Math.random().toString(36).slice(-10),
            };
            if (role === 'admin') {
                newRecordData.role = 'admin';
            } else {
                newRecordData.isVerified = true;
            }
            const newRecord = new model(newRecordData);
            await newRecord.save();
            res.cookie(role === 'admin' ? 'adminId' : 'userId', newRecord._id.toString(), {
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                maxAge: 60 * 60 * 1000 * 24 // 1 day
            });
            return res.json({
                success: true,
                message: `New ${role} created via Google OAuth`,
                user: {
                    id: newRecord._id,
                    name: newRecord.name,
                    email: newRecord.email,
                    picture: newRecord.picture,
                    role: role
                }
            });
        }
    } catch (err) {
        console.error('Google OAuth error:', err);
        return res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};



export const adminLogout = (req, res) => {
    res.clearCookie('google_oauth_state');
    res.clearCookie('google_oauth_code_verifier');
    res.clearCookie('adminId');
    
    // If you set any session or auth cookies, clear them here as well
    res.json({
        success: true,
        message: 'Admin logged out successfully'
    });
};

// Admin registration: send OTP
export const admin_send_otp = async (req, res) => {
    const { email, purpose } = req.body; // purpose: 'register', 'login', 'reset'
    if (!email || !purpose) {
        return res.status(400).json({ success: false, message: "Email and purpose are required" });
    }
    const otp = generateOTP();
    const subject = `Your Admin ${purpose} OTP`;
    const result = await sendOTPHandler({ email, subject, otp });
    if (result.success) {
        storeOTPInSession(req, email, otp, purpose);
        res.json(result);
    } else {
        res.status(500).json(result);
    }
};

// Admin OTP verification (for registration, forgot password, etc.)
export const admin_verify_otp = async (req, res) => {
    const { email, otp, purpose } = req.body;
    if (!req.session.otpData) {
        return res.status(400).json({ success: false, message: "No OTP requested" });
    }
    const otpData = req.session.otpData;
    if (otpData.for !== email || otpData.purpose !== purpose) {
        return res.status(400).json({ success: false, message: "Invalid OTP request" });
    }
    if (Date.now() > otpData.expires) {
        delete req.session.otpData;
        return res.status(400).json({ success: false, message: "OTP expired" });
    }
    if (otpData.attempts >= 3) {
        delete req.session.otpData;
        return res.status(429).json({ success: false, message: "Too many attempts" });
    }
    if (otpData.code === otp) {
        req.session.otpVerified = { email, purpose, verifiedAt: Date.now() };
        delete req.session.otpData;
   return res.json({ success: true, message: "OTP verified"});
    }
    otpData.attempts++;
    res.status(400).json({ success: false, message: "Invalid OTP" });
};

// Admin login with email and password
export const admin_login = async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
    }
    
    try {
        const admin = await Admin.findOne({ email }).select('+password');
        
        if (!admin) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }
        
        // Check if admin.password exists before calling trim
        if (!admin.password) {
            return res.status(401).json({ success: false, message: "Invalid password" });
        }
        
        // Trim and compare passwords
        const trimmedInputPassword = password.trim();
        const trimmedStoredPassword = admin.password.trim();
        
        if (trimmedStoredPassword !== trimmedInputPassword) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }
        
        res.cookie('adminId', admin._id.toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });
        
        res.json({
            success: true,
            message: "Admin login successful",
            admin: {
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
        
    } catch (error) {
        console.log("Error during admin login:", error);
        res.status(500).json({
            success: false,
            message: "Error logging in",
            error: error.message
        });
    }
};

