// oauth/google.js
import { Google } from 'arctic';
import dotenv from 'dotenv';

dotenv.config();

// Get environment variables with fallbacks
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Validate critical environment variables
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error('Missing Google OAuth credentials. Please check your environment variables.');
  throw new Error('Google OAuth credentials are required');
}

console.log('Google OAuth Config:');
console.log('Client ID:', GOOGLE_CLIENT_ID);
console.log('Backend URL:', BACKEND_URL);
console.log('Environment:', NODE_ENV);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

export const google = new Google(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  null 
);

// Helper function to get redirect URI based on type
export const getGoogleRedirectURI = (type = 'user') => {
  return `${BACKEND_URL}/auth/${type}/google/callback`;
};

// Helper function to create authorization URL with custom redirect
export const createGoogleAuthorizationURL = (state, codeVerifier, type = 'user') => {
  const redirectURI = getGoogleRedirectURI(type);
  console.log(`Creating authorization URL for ${type} with redirect:`, redirectURI);
  
  // Create a new Google instance with the specific redirect URI for this request
  const googleWithRedirect = new Google(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectURI
  );
  
  return googleWithRedirect.createAuthorizationURL(
    state,
    codeVerifier,
    ["openid", "profile", "email"]
  );
};

// Helper function to validate authorization code with custom redirect
export const validateGoogleAuthorizationCode = (code, codeVerifier, type = 'user') => {
  const redirectURI = getGoogleRedirectURI(type);
  console.log(`Validating authorization code for ${type} with redirect:`, redirectURI);
  
  // Create a new Google instance with the specific redirect URI for this request
  const googleWithRedirect = new Google(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectURI
  );
  
  return googleWithRedirect.validateAuthorizationCode(code, codeVerifier);
};