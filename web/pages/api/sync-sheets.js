/**
 * @fileoverview API Route for Google Sheets Sync
 * 
 * This API route triggers the synchronization of Google Sheets data to Supabase.
 * It can be called manually or by a scheduled cron job via Vercel.
 * 
 * === SECURITY ===
 * 
 * In production, you should add authentication to this endpoint to prevent
 * unauthorized syncs. Options include:
 * 1. API key validation
 * 2. Admin-only access
 * 3. IP whitelisting
 */

import { syncSheetsToSupabase } from '../../../services/sheetsToSupabaseSync';

export default async function handler(req, res) {
  // Only allow POST requests (or GET for testing/scheduled jobs)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Run the sync process
    const result = await syncSheetsToSupabase();
    
    if (!result.success) {
      return res.status(500).json({ 
        error: 'Sync failed', 
        details: result.error 
      });
    }
    
    return res.status(200).json({
      success: true,
      message: `Successfully synced ${result.rowsProcessed} leads`,
      ...result
    });
  } catch (error) {
    console.error('Error in sync API route:', error);
    return res.status(500).json({ 
      error: 'Unexpected error during sync',
      message: error.message
    });
  }
} 