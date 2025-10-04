// controllers/googleAuthController.js
import { generateState, generateCodeVerifier, decodeIdToken } from 'arctic';
import { 
  createGoogleAuthorizationURL, 
  validateGoogleAuthorizationCode 
} from '../oauth/google.js';
import Admin from '../models/admin.js';
import User from '../models/user.js';

// Common function to generate authorization URL
// Common function to generate authorization URL
const getGoogleAuthorization = (type) => {
  console.log(`[${type.toUpperCase()}] 🔧 GENERATING AUTHORIZATION PARAMETERS...`);
  
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  
  console.log(`[${type.toUpperCase()}] 📝 GENERATED PARAMETERS:`);
  console.log(`  State: ${state}`);
  console.log(`  Code Verifier: ${codeVerifier}`);
  
  const url = createGoogleAuthorizationURL(state, codeVerifier, type);
  
  const cookieConfig = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge: 60 * 60 * 1000 * 24 // 1 day
  };
  
  console.log(`[${type.toUpperCase()}] ✅ AUTHORIZATION URL CREATED`);
  
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
// User Google OAuth
export const getUserGoogleLogin = async (req, res) => {
  console.log('═══════════════════════════════════════════════════');
  console.log('[USER] 🚀 STARTING GOOGLE OAUTH LOGIN PROCESS');
  console.log('═══════════════════════════════════════════════════');
  
  // Log all environment variables
  console.log('[USER] 📋 ENVIRONMENT VARIABLES:');
  console.log('  BACKEND_URL:', process.env.BACKEND_URL);
  console.log('  FRONTEND_URL:', process.env.FRONTEND_URL);
  console.log('  NODE_ENV:', process.env.NODE_ENV);
  console.log('  GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✓ Present' : '✗ Missing');
  
  // Log request details
  console.log('[USER] 📨 REQUEST DETAILS:');
  console.log('  URL:', req.url);
  console.log('  Method:', req.method);
  console.log('  Headers:', req.headers);
  console.log('  Cookies:', req.cookies);
  
  if (req.user) {
    console.log('[USER] ⚠️  User already authenticated, redirecting to home');
    return res.redirect(`${process.env.FRONTEND_URL}`);
  }
  
  console.log('[USER] 🔧 GENERATING AUTHORIZATION URL...');
  const { state, codeVerifier, url, cookieConfig } = getGoogleAuthorization('user');
  
  console.log('[USER] 📝 OAUTH PARAMETERS GENERATED:');
  console.log('  State:', state);
  console.log('  Code Verifier:', codeVerifier);
  console.log('  Full Authorization URL:', url.toString());
  console.log('  Redirect URI from URL:', url.searchParams.get('redirect_uri'));
  
  console.log('[USER] 🍪 SETTING COOKIES:');
  console.log('  google_oauth_state:', state.substring(0, 10) + '...');
  console.log('  google_oauth_type: user');
  console.log('  google_oauth_code_verifier:', codeVerifier.substring(0, 10) + '...');
  console.log('  Cookie Config:', cookieConfig);
  
  // Set cookies
  res.cookie("google_oauth_state", state, cookieConfig);
  res.cookie("google_oauth_type", 'user', cookieConfig);
  res.cookie("google_oauth_code_verifier", codeVerifier, cookieConfig);
  
  console.log('[USER] ✅ COOKIES SET SUCCESSFULLY');
  console.log('[USER] 🔀 REDIRECTING TO GOOGLE OAUTH URL');
  console.log('═══════════════════════════════════════════════════');
  
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
  console.log('═══════════════════════════════════════════════════');
  console.log('[USER CALLBACK] 🔄 HANDLING GOOGLE OAUTH CALLBACK');
  console.log('═══════════════════════════════════════════════════');
  
  // Log all query parameters
  console.log('[USER CALLBACK] 📨 REQUEST QUERY PARAMETERS:');
  console.log('  Full Query:', req.query);
  console.log('  Code:', req.query.code ? req.query.code.substring(0, 20) + '...' : '✗ Missing');
  console.log('  State:', req.query.state ? req.query.state.substring(0, 10) + '...' : '✗ Missing');
  console.log('  Error:', req.query.error || 'None');
  console.log('  Error Description:', req.query.error_description || 'None');
  
  // Log all cookies
  console.log('[USER CALLBACK] 🍪 STORED COOKIES:');
  console.log('  google_oauth_state:', req.cookies.google_oauth_state ? req.cookies.google_oauth_state.substring(0, 10) + '...' : '✗ Missing');
  console.log('  google_oauth_type:', req.cookies.google_oauth_type || '✗ Missing');
  console.log('  google_oauth_code_verifier:', req.cookies.google_oauth_code_verifier ? req.cookies.google_oauth_code_verifier.substring(0, 10) + '...' : '✗ Missing');
  console.log('  All Cookies:', req.cookies);
  
  const { code, state, error, error_description } = req.query;
  const storedState = req.cookies.google_oauth_state;
  const storedVerifier = req.cookies.google_oauth_code_verifier;

  // State validation
  console.log('[USER CALLBACK] 🔐 STATE VALIDATION:');
  console.log('  Received State:', state ? state.substring(0, 10) + '...' : 'None');
  console.log('  Stored State:', storedState ? storedState.substring(0, 10) + '...' : 'None');
  console.log('  States Match:', state === storedState);
  
  if (!storedState || state !== storedState) {
    console.error('[USER CALLBACK] ❌ STATE MISMATCH ERROR!');
    console.error('  Expected:', storedState);
    console.error('  Received:', state);
    console.error('  Possible issues:');
    console.error('    - Cookies not properly set');
    console.error('    - Cross-domain cookie issues');
    console.error('    - User blocked cookies');
    console.error('    - Multiple tabs with OAuth flow');
    return res.status(400).send("Invalid state");
  }

  if (error) {
    console.error('[USER CALLBACK] ❌ GOOGLE RETURNED ERROR:');
    console.error('  Error:', error);
    console.error('  Description:', error_description);
    return res.status(400).send(`OAuth Error: ${error} - ${error_description}`);
  }

  if (!code) {
    console.error('[USER CALLBACK] ❌ NO AUTHORIZATION CODE RECEIVED');
    return res.status(400).send("No authorization code received");
  }

  try {
    console.log('[USER CALLBACK] 🔑 VALIDATING AUTHORIZATION CODE...');
    console.log('  Code:', code.substring(0, 20) + '...');
    console.log('  Code Verifier:', storedVerifier ? storedVerifier.substring(0, 10) + '...' : 'Missing');
    
    const tokens = await validateGoogleAuthorizationCode(code, storedVerifier, 'user');
    console.log("[USER CALLBACK] ✅ TOKENS RECEIVED SUCCESSFULLY");
    console.log('  Access Token:', tokens.data.access_token ? tokens.data.access_token.substring(0, 20) + '...' : 'Missing');
    console.log('  ID Token Present:', !!tokens.data.id_token);
    console.log('  Token Type:', tokens.data.token_type);
    console.log('  Expires In:', tokens.data.expires_in);

    // Decode ID token to get user info
    console.log('[USER CALLBACK] 👤 DECODING USER INFORMATION...');
    const idTokenClaims = decodeIdToken(tokens.idToken());
    console.log("[USER CALLBACK] 📋 USER INFO DECODED:");
    console.log('  Google ID:', idTokenClaims.sub);
    console.log('  Email:', idTokenClaims.email);
    console.log('  Name:', idTokenClaims.name);
    console.log('  Email Verified:', idTokenClaims.email_verified);
    console.log('  Picture:', idTokenClaims.picture);

    // Find or create user
    console.log('[USER CALLBACK] 🔍 SEARCHING FOR USER IN DATABASE...');
    let user = await User.findOne({ googleId: idTokenClaims.sub });
    console.log('  User found by Google ID:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('[USER CALLBACK] 🔍 SEARCHING FOR USER BY EMAIL...');
      user = await User.findOne({ email: idTokenClaims.email });
      console.log('  User found by email:', user ? 'Yes' : 'No');
      
      if (user) {
        console.log('[USER CALLBACK] 🔗 LINKING GOOGLE ID TO EXISTING USER...');
        // Link Google ID to existing user
        user.googleId = idTokenClaims.sub;
        user.isVerified = true;
        user.picture = idTokenClaims.picture;
        user.lastLogin = new Date();
        await user.save();
        console.log('  ✅ USER UPDATED WITH GOOGLE ID');
      } else {
        console.log('[USER CALLBACK] 👶 CREATING NEW USER...');
        // Create new user
        user = new User({
          isVerified: true,
          lastLogin: new Date(),
          googleId: idTokenClaims.sub,
          email: idTokenClaims.email,
          name: idTokenClaims.name,
          picture: idTokenClaims.picture,
          phone: idTokenClaims.phone_number || '',
        });
        await user.save();
        console.log('  ✅ NEW USER CREATED');
      }
    } else {
      console.log('[USER CALLBACK] ✅ EXISTING USER FOUND');
      user.lastLogin = new Date();
      await user.save();
    }

    console.log('[USER CALLBACK] 🍪 SETTING USER SESSION COOKIE...');
    console.log('  User ID:', user._id.toString());
    
    // Set user session cookie
    res.cookie('userId', user._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 60 * 60 * 1000 * 24 * 7 // 1 week
    });

    console.log('[USER CALLBACK] 🧹 CLEARING OAUTH COOKIES...');
    // Clear OAuth cookies
    res.clearCookie('google_oauth_state');
    res.clearCookie('google_oauth_type');
    res.clearCookie('google_oauth_code_verifier');

    console.log('[USER CALLBACK] 🔀 REDIRECTING TO FRONTEND...');
    console.log('  Redirect URL:', `${process.env.FRONTEND_URL}`);
    console.log('═══════════════════════════════════════════════════');

    // Redirect to user home
    res.redirect(`${process.env.FRONTEND_URL}`);

  } catch (error) {
    console.error('[USER CALLBACK] ❌ AUTHENTICATION FAILED:');
    console.error('  Error Name:', error.name);
    console.error('  Error Message:', error.message);
    console.error('  Error Stack:', error.stack);
    
    if (error.response) {
      console.error('  Response Data:', error.response.data);
      console.error('  Response Status:', error.response.status);
      console.error('  Response Headers:', error.response.headers);
    }
    
    console.log('═══════════════════════════════════════════════════');
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