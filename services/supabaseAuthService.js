/**
 * @fileoverview Supabase Authentication Service
 * 
 * This microservice handles authentication through Supabase, specifically configured for Google OAuth login.
 * It includes helper functions for user session management, verification, and retrieval.
 * 
 * === ENVIRONMENT VARIABLES REQUIRED ===
 * 
 * SUPABASE_URL - The URL of your Supabase project (e.g., https://yourproject.supabase.co)
 * SUPABASE_ANON_KEY - The anon/public key for your Supabase project (for client-side operations)
 * SUPABASE_SERVICE_ROLE_KEY - The service role key for admin-level operations (use with caution)
 * 
 * === SUPABASE CONFIGURATION ===
 * 
 * 1. Create a Supabase project at https://supabase.com
 * 2. Enable Google Auth in the Authentication > Providers section:
 *    - Get Google OAuth credentials from Google Cloud Console:
 *      a. Go to https://console.cloud.google.com/
 *      b. Create a new project or use an existing one
 *      c. Navigate to "APIs & Services" > "Credentials"
 *      d. Create OAuth client ID for Web application
 *      e. Add authorized redirect URIs for your Supabase project:
 *         - https://yourproject.supabase.co/auth/v1/callback
 *         - http://localhost:3000/api/auth/callback (for local development)
 *    - In Supabase dashboard, add the Google Client ID and Client Secret
 * 
 * 3. Create a 'users' table in Supabase with appropriate fields:
 *    - id (uuid, primary key)
 *    - email (text)
 *    - created_at (timestamp with time zone)
 *    - updated_at (timestamp with time zone)
 *    - other user fields as needed
 * 
 * === USAGE ===
 * 
 * This service provides client and server-side functions for authentication:
 * - createSupabaseClient() - Creates a Supabase client for client-side use
 * - createSupabaseServerClient() - Creates a Supabase client with admin privileges
 * - getUserById(userId) - Retrieves user details by ID (server-side)
 * - verifySession(token) - Verifies a user session token (server-side)
 * 
 * === INTEGRATION ===
 * 
 * This service is used by the Next.js frontend for user authentication flows,
 * and can be used by other microservices that need to verify user sessions or
 * access user data.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`Error: Missing required environment variable ${varName}`);
  }
});

/**
 * Creates a Supabase client for client-side use with anon key
 * @returns {Object} Supabase client instance
 */
function createSupabaseClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
}

/**
 * Creates a Supabase client with admin privileges for server-side operations
 * @returns {Object} Supabase client instance with admin rights
 */
function createSupabaseServerClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Gets user data by user ID
 * @param {string} userId - The user's UUID
 * @returns {Promise<Object>} User data or null if not found
 */
async function getUserById(userId) {
  const supabase = createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  
  return data;
}

/**
 * Verifies a user session token
 * @param {string} token - JWT token from client session
 * @returns {Promise<Object>} User data if session is valid, null otherwise
 */
async function verifySession(token) {
  const supabase = createSupabaseServerClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('Session verification failed:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error verifying session:', error);
    return null;
  }
}

/**
 * Creates a new user record in the database after sign-up
 * This function can be called after a successful auth.signUp or OAuth sign-in
 * @param {Object} userData - User data including id, email
 * @returns {Promise<Object>} Created user data or null if error
 */
async function createUserRecord(userData) {
  const supabase = createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('users')
    .insert([
      { 
        id: userData.id,
        email: userData.email,
        created_at: new Date(),
        updated_at: new Date()
      }
    ])
    .select();
    
  if (error) {
    console.error('Error creating user record:', error);
    return null;
  }
  
  return data[0];
}

module.exports = {
  createSupabaseClient,
  createSupabaseServerClient,
  getUserById,
  verifySession,
  createUserRecord
}; 