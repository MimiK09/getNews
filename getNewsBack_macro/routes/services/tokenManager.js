// services/tokenManager.js
const fs = require('fs/promises');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

// Path to the tokens file
const TOKEN_FILE_PATH = path.join(__dirname, 'documents', 'secret', 'threads_tokens.json');

// Variables d'environnement
const THREADS_APP_ID = process.env.THREADS_APP_ID;
const THREADS_APP_SECRET = process.env.THREADS_APP_SECRET;
const REDIRECT_URI = process.env.THREADS_APP_REDIRECT_URI;

/**
 * Reads stored tokens from JSON file
 */
const getStoredTokens = async () => {
  try {
    const data = await fs.readFile(TOKEN_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
};

/**
 * Saves tokens to JSON file
 */
const saveTokens = async (accessToken, userId, expiresIn = 3600) => {
  const expiresAt = Date.now() + expiresIn * 1000;
  console.log("je passe dans saveTokens")
  const tokensData = {
    accessToken,
    userId,
    expiresAt
  };
  
  // Ensure directory exists
  const dir = path.dirname(TOKEN_FILE_PATH);
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    // Directory already exists, continue
  }
  
  await fs.writeFile(TOKEN_FILE_PATH, JSON.stringify(tokensData, null, 2), 'utf8');
};

/**
 * Generate an authorization URL with return path
 * @param {string} returnPath - Path to return to after authentication
 * @returns {string} The authorization URL
 */
const getAuthorizationUrl = (returnPath = '/threads/publish') => {
  const state = encodeURIComponent(returnPath); // Use state parameter to store return path
  const scope = "threads_basic,threads_content_publish";
  
  return `https://threads.net/oauth/authorize?client_id=${THREADS_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=${scope}&response_type=code&state=${state}`;
};

/**
 * Checks if stored tokens exist and are valid
 */
const validateTokens = async () => {
  const tokens = await getStoredTokens();
  
  if (!tokens || !tokens.accessToken || !tokens.userId) {
    return { isValid: false, tokens: null };
  }
  
  // Check if token is expired (with 5 minute buffer)
  const now = Date.now();
  const isExpired = tokens.expiresAt - now < 5 * 60 * 1000;
  
  if (isExpired) {
    return { isValid: false, tokens: null };
  }
  
  return { isValid: true, tokens: { accessToken: tokens.accessToken, userId: tokens.userId } };
};

/**
 * Exchanges authorization code for access token
 */
const exchangeCodeForToken = async (code) => {
  const formData = new URLSearchParams();
  formData.append("client_id", THREADS_APP_ID);
  formData.append("client_secret", THREADS_APP_SECRET);
  formData.append("code", code);
  formData.append("grant_type", "authorization_code");
  formData.append("redirect_uri", REDIRECT_URI);

  const response = await axios.post(
    "https://graph.threads.net/oauth/access_token",
    formData.toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  const { access_token, user_id, expires_in } = response.data;
  
  await saveTokens(access_token, user_id, expires_in);
  
  return { accessToken: access_token, userId: user_id };
};

/**
 * Gets valid tokens or throws an error if authentication is needed
 * @returns {Promise<{accessToken: string, userId: string}>}
 * @throws {Error} If tokens are invalid and authentication is needed
 */
const getValidTokens = async (returnPath = '/threads/publish') => {
  const { isValid, tokens } = await validateTokens();
  
  if (isValid) {
    return { accessToken: tokens.accessToken, userId: tokens.userId };
  } else {
    // Au lieu de renvoyer un objet avec needsUserAuth,
    // on lance une erreur spéciale qui sera attrapée par le middleware
    const authUrl = getAuthorizationUrl(returnPath);
    const error = new Error("Authentication required");
    error.name = "AuthenticationRequiredError";
    error.authUrl = authUrl;
    throw error;
  }
};

/**
 * Removes stored tokens (for logout functionality)
 */
const clearTokens = async () => {
  try {
    await fs.unlink(TOKEN_FILE_PATH);
  } catch (error) {
    // File doesn't exist or can't be deleted, ignore
  }
};

module.exports = {
  getStoredTokens,
  saveTokens,
  validateTokens,
  exchangeCodeForToken,
  getValidTokens,
  getAuthorizationUrl,
  clearTokens
};