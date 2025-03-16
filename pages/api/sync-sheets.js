import { syncSheetsToSupabase } from '../../src/services/sheetsToSupabaseSync';

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