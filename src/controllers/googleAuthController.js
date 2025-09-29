// controllers/googleAuthController.js
import { generateState, generateCodeVerifier, decodeIdToken } from 'arctic';
import { 
  createGoogleAuthorizationURL, 
  validateGoogleAuthorizationCode 
} from '../oauth/google.js';
import Admin from '../models/admin.js';
import User from '../models/user.js';

// Common function to generate authorization URL
const getGoogleAuthorization = (type) => {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = createGoogleAuthorizationURL(state, codeVerifier, type);
  
  const cookieConfig = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge: 60 * 60 * 1000 * 24 // 1 day
  };
  
  console.log(`[${type.toUpperCase()}] Generated OAuth values:`, {
    state: state.substring(0, 10) + '...', // Only show first 10 chars for security
    codeVerifier: codeVerifier.substring(0, 10) + '...',
    url: url.toString().substring(0, 100) + '...'
  });
  
  return { state, codeVerifier, url, cookieConfig };
};

// Admin Google OAuth
export const getAdminGoogleLogin = async (req, res) => {
  console.log('[ADMIN] Starting Google OAuth login process');
  
  if (req.admin) {
    console.log('[ADMIN] User already authenticated, redirecting to dashboard');
    return res.redirect(`${process.env.FRONTEND_URL}/admin/dashboard`);
  }
  
  const { state, codeVerifier, url, cookieConfig } = getGoogleAuthorization('admin');
  
  console.log('[ADMIN] Setting cookies:', {
    admin_oauth_state: state.substring(0, 10) + '...',
    admin_oauth_type: 'admin',
    admin_oauth_code_verifier: codeVerifier.substring(0, 10) + '...'
  });
  
  res.cookie("admin_oauth_state", state, cookieConfig);
  res.cookie("admin_oauth_type", 'admin', cookieConfig);
  res.cookie("admin_oauth_code_verifier", codeVerifier, cookieConfig);
  
  console.log('[ADMIN] Redirecting to Google OAuth URL');
  res.redirect(url.toString());
}; 

// User Google OAuth
export const getUserGoogleLogin = async (req, res) => {
  console.log('[USER] Starting Google OAuth login process');
  
  if (req.user) {
    console.log('[USER] User already authenticated, redirecting to home');
    return res.redirect(`${process.env.FRONTEND_URL}`);
  }
  
  const { state, codeVerifier, url, cookieConfig } = getGoogleAuthorization('user');
  
  console.log('[USER] Setting cookies:', {
    google_oauth_state: state.substring(0, 10) + '...',
    google_oauth_type: 'user',
    google_oauth_code_verifier: codeVerifier.substring(0, 10) + '...'
  });
  
  res.cookie("google_oauth_state", state, cookieConfig);
  res.cookie("google_oauth_type", 'user', cookieConfig);
  res.cookie("google_oauth_code_verifier", codeVerifier, cookieConfig);
  
  console.log('[USER] Redirecting to Google OAuth URL');
  res.redirect(url.toString());
};

// Admin Google Callback
export const handleAdminGoogleCallback = async (req, res) => {
  const { code, state } = req.query;

  const storedState = req.cookies.admin_oauth_state;
  const storedVerifier = req.cookies.admin_oauth_code_verifier;

  if (!storedState || state !== storedState) {
    console.error("[ADMIN CALLBACK] ❌ State mismatch!");
    return res.status(400).send("Invalid state");
  }

  try {
    const tokens = await validateGoogleAuthorizationCode(code, storedVerifier, 'admin');
    console.log("[ADMIN CALLBACK] ✅ Tokens received:", tokens);

    // continue with user info fetch + admin login...
    // Decode ID token to get user info
    const idTokenClaims = decodeIdToken(tokens.idToken());
    console.log("[ADMIN CALLBACK] User info:", idTokenClaims);

    // Find or create admin based on Google ID or email
    let admin = await Admin.findOne({ googleId: idTokenClaims.sub });
    
    if (!admin) {
      admin = await Admin.findOne({ email: idTokenClaims.email });
      if (admin) {
        // Link Google ID to existing admin
        admin.googleId = idTokenClaims.sub;
        await admin.save();
      } else {
        // Create new admin (you might want to add additional validation here)
        admin = new Admin({
          googleId: idTokenClaims.sub,
          email: idTokenClaims.email,
          name: idTokenClaims.name,
          profilePicture: idTokenClaims.picture
        });
        await admin.save();
      }
    }

    // Set admin session cookie
    res.cookie('adminId', admin._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 60 * 60 * 1000 * 24 * 7 // 1 week
    });

    // Clear OAuth cookies
    res.clearCookie('admin_oauth_state');
    res.clearCookie('admin_oauth_type');
    res.clearCookie('admin_oauth_code_verifier');

    // Redirect to admin dashboard
    res.redirect(`${process.env.FRONTEND_URL}/admin/dashboard`);

  } catch (error) {
    console.error("[ADMIN CALLBACK] ❌ Error:", error);
    res.status(500).send("Authentication failed");
  }
};

export const handleUserGoogleCallback = async (req, res) => {
  const { code, state } = req.query;

  const storedState = req.cookies.google_oauth_state;
  const storedVerifier = req.cookies.google_oauth_code_verifier;

  if (!storedState || state !== storedState) {
    console.error("[USER CALLBACK] ❌ State mismatch!");
    return res.status(400).send("Invalid state");
  }

  try {
    const tokens = await validateGoogleAuthorizationCode(code, storedVerifier, 'user');
    console.log("[USER CALLBACK] ✅ Tokens received:", tokens);

    // continue with user info fetch + user login...
    // Decode ID token to get user info
    const idTokenClaims = decodeIdToken(tokens.idToken());
    console.log("[USER CALLBACK] User info:", idTokenClaims);

    // Find or create user based on Google ID or email
    let user = await User.findOne({ googleId: idTokenClaims.sub });
    
    if (!user) {
      user = await User.findOne({ email: idTokenClaims.email });
      if (user) {
        // Link Google ID to existing user
        user.googleId = idTokenClaims.sub;
        user.isVerified = true; // Mark email as verified
        user.picture = idTokenClaims.picture; // Update profile picture
        user.lastLogin = new Date();
        await user.save();
      } else {
        // Create new user
        user = new User({
          isVerified: true,
          lastLogin: new Date(),
          googleId: idTokenClaims.sub,
          email: idTokenClaims.email,
          name: idTokenClaims.name,
          picture: idTokenClaims.picture,
          phone:idTokenClaims.phone_number  ,
        });
        await user.save();
      }
    }

    // Set user session cookie
    res.cookie('userId', user._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 60 * 60 * 1000 * 24 * 7 // 1 week
    });

    // Clear OAuth cookies
    res.clearCookie('google_oauth_state');
    res.clearCookie('google_oauth_type');
    res.clearCookie('google_oauth_code_verifier');

    // Redirect to user home
    res.redirect(`${process.env.FRONTEND_URL}`);

  } catch (error) {
    console.error("[USER CALLBACK] ❌ Error:", error);
    res.status(500).send("Authentication failed");
  }
};

// Logout functions
export const adminLogout = (req, res) => {
  console.log('[ADMIN] Logging out, clearing adminId cookie');
    res.clearCookie('adminId', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    });  res.redirect(`${process.env.FRONTEND_URL}/admin`);
};

export const userLogout = (req, res) => {
  console.log('[USER] Logging out, clearing userId cookie');
    res.clearCookie('userId', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    }); 
     res.redirect(`${process.env.FRONTEND_URL}/login`);
};