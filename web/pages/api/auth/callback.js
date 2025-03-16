/**
 * @fileoverview Auth Callback Handler for Supabase Authentication
 * 
 * This API route handles the OAuth callback from Supabase after a user
 * authenticates with Google. It checks for an active session and redirects
 * the user to the appropriate page.
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  // Create a Supabase client authenticated with the user's session
  const supabaseServerClient = createServerSupabaseClient({ req, res });
  
  // Check if we have a session
  const {
    data: { session },
  } = await supabaseServerClient.auth.getSession();

  // Redirect based on session status
  if (session) {
    // User is signed in, redirect to the dashboard
    return res.redirect('/');
  } else {
    // No session found, redirect to login page
    return res.redirect('/login');
  }
} 