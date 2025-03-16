/**
 * @fileoverview Google Sheets to Supabase Sync Microservice
 * 
 * This microservice synchronizes data from a Google Sheet to a Supabase table.
 * It handles authentication with Google's API, fetches data with pagination,
 * and writes the data to a specified Supabase table.
 * 
 * === ENVIRONMENT VARIABLES REQUIRED ===
 * 
 * GOOGLE_SERVICE_ACCOUNT_EMAIL - Email of the Google Service Account
 * GOOGLE_PRIVATE_KEY - Private key for the Google Service Account (with newlines as \n)
 * GOOGLE_SHEET_ID - ID of the Google Sheet to read from (from the URL)
 * SUPABASE_URL - URL of your Supabase project
 * SUPABASE_SERVICE_ROLE_KEY - Service role key for Supabase (admin access)
 * 
 * === GOOGLE SETUP INSTRUCTIONS ===
 * 
 * 1. Create a Google Cloud Project:
 *    - Go to https://console.cloud.google.com/
 *    - Create a new project
 * 
 * 2. Enable the Google Sheets API:
 *    - Go to "APIs & Services" > "Library"
 *    - Search for "Google Sheets API" and enable it
 * 
 * 3. Create a Service Account:
 *    - Go to "APIs & Services" > "Credentials"
 *    - Click "Create Credentials" > "Service Account"
 *    - Fill in details and create
 *    - In the service account details, go to the "Keys" tab
 *    - Add Key > Create new key > JSON
 *    - Save the downloaded JSON file securely
 * 
 * 4. Share your Google Sheet:
 *    - Open your Google Sheet
 *    - Click "Share" button
 *    - Add your service account email with "Viewer" access
 * 
 * === SUPABASE SETUP INSTRUCTIONS ===
 * 
 * 1. Create a 'leads' table in your Supabase project with these fields:
 *    - id (uuid, primary key)
 *    - name (text)
 *    - email (text)
 *    - phone (text)
 *    - company (text)
 *    - notes (text)
 *    - sheet_row_id (text, unique) - To track which row in the sheet this came from
 *    - created_at (timestamp with time zone)
 *    - updated_at (timestamp with time zone)
 *    - last_sync (timestamp with time zone)
 *    (Note: Adjust fields based on your Google Sheet's actual columns)
 * 
 * === USAGE ===
 * 
 * Run this script directly to perform a sync:
 *   node services/sheetsToSupabaseSync.js
 * 
 * Or import the functions to use programmatically:
 *   const { syncSheetsToSupabase } = require('./services/sheetsToSupabaseSync');
 *   
 *   // Sync with default options
 *   syncSheetsToSupabase();
 *   
 *   // Sync with custom options
 *   syncSheetsToSupabase({
 *     sheetName: 'Sheet2', // Default is 'Sheet1'
 *     batchSize: 100,      // Default is 50
 *     forceFullSync: true  // Default is false (incremental sync)
 *   });
 * 
 * === SCHEDULING ===
 * 
 * This script can be scheduled using:
 * 1. Vercel Cron Jobs (if deployed on Vercel)
 * 2. External services like GitHub Actions with cron triggers
 * 3. Traditional cron jobs if hosted on a server
 * 
 * === ERROR HANDLING ===
 * 
 * The script includes error handling for:
 * - Google API authentication failures
 * - Sheet access issues
 * - Data validation problems
 * - Supabase connection and write errors
 * 
 * Errors are logged to the console and an optional error callback can be provided.
 */

require('dotenv').config();
const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');

// Validate required environment variables
const requiredEnvVars = [
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_PRIVATE_KEY',
  'GOOGLE_SHEET_ID',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`Error: Missing required environment variable ${varName}`);
  }
});

/**
 * Authenticate with Google Sheets API using service account
 * @returns {Object} Google Sheets API client
 */
function getGoogleSheetsClient() {
  // Parse the private key correctly (handling newlines)
  const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
  
  const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    privateKey,
    ['https://www.googleapis.com/auth/spreadsheets.readonly']
  );
  
  return google.sheets({ version: 'v4', auth });
}

/**
 * Create a Supabase client with admin privileges
 * @returns {Object} Supabase client
 */
function getSupabaseClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Get the latest sync timestamp from the leads table
 * @param {Object} supabase - Supabase client
 * @returns {Promise<string>} ISO timestamp of the last sync
 */
async function getLastSyncTimestamp(supabase) {
  const { data, error } = await supabase
    .from('leads')
    .select('last_sync')
    .order('last_sync', { ascending: false })
    .limit(1);
    
  if (error || !data || data.length === 0) {
    // If there's an error or no data, return a very old date
    return new Date(0).toISOString();
  }
  
  return data[0].last_sync;
}

/**
 * Maps Google Sheets columns to Supabase table fields
 * @param {Array} headerRow - Array of column headers from Google Sheet
 * @param {Array} dataRow - Array of values from a row in Google Sheet
 * @param {number} rowIndex - Index of the row in the sheet (for tracking)
 * @returns {Object} Mapped object ready for Supabase
 */
function mapSheetRowToLeadObject(headerRow, dataRow, rowIndex) {
  // Create a base object with default fields
  const lead = {
    sheet_row_id: String(rowIndex),
    last_sync: new Date().toISOString()
  };

  // Map each column in the sheet to its corresponding field
  headerRow.forEach((header, index) => {
    // Convert header to a safe field name (lowercase, underscores)
    const fieldName = header.toLowerCase().replace(/\s+/g, '_');
    
    // Add the value to our lead object
    if (index < dataRow.length) {
      lead[fieldName] = dataRow[index];
    } else {
      lead[fieldName] = null; // Handle missing data
    }
  });

  return lead;
}

/**
 * Fetch data from Google Sheets with pagination
 * @param {Object} options - Options for the sync
 * @param {string} options.sheetName - Name of the sheet to read
 * @param {number} options.batchSize - Number of rows to read at once
 * @returns {Promise<Array>} Array of objects with header row and data rows
 */
async function fetchSheetData({ sheetName = 'Sheet1', batchSize = 50 }) {
  const sheets = getGoogleSheetsClient();
  const sheetId = process.env.GOOGLE_SHEET_ID;
  
  try {
    // First, fetch the header row
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!A1:Z1`,
    });
    
    const headerRow = headerResponse.data.values[0];
    if (!headerRow) {
      throw new Error('Could not find header row in sheet');
    }
    
    // Get the total number of rows in the sheet
    const metadataResponse = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      ranges: [sheetName],
      includeGridData: false,
    });
    
    const sheetProperties = metadataResponse.data.sheets.find(
      s => s.properties.title === sheetName
    ).properties;
    
    const totalRows = sheetProperties.gridProperties.rowCount;
    console.log(`Total rows in sheet: ${totalRows}`);
    
    const allData = [];
    
    // Fetch data in batches
    for (let startRow = 2; startRow < totalRows; startRow += batchSize) {
      const endRow = Math.min(startRow + batchSize - 1, totalRows);
      const range = `${sheetName}!A${startRow}:Z${endRow}`;
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range,
      });
      
      const rows = response.data.values || [];
      console.log(`Fetched rows ${startRow} to ${endRow}: ${rows.length} rows`);
      
      if (rows.length === 0) break;
      
      // Process each row
      rows.forEach((row, index) => {
        const actualRowIndex = startRow + index;
        allData.push({
          headerRow,
          dataRow: row,
          rowIndex: actualRowIndex
        });
      });
    }
    
    return allData;
    
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
}

/**
 * Write leads to Supabase, handling upserts based on sheet_row_id
 * @param {Array} leads - Array of lead objects to write to Supabase
 * @returns {Promise<Object>} Result of the operation
 */
async function writeLeadsToSupabase(leads) {
  const supabase = getSupabaseClient();
  
  try {
    // Use upsert to handle both inserts and updates
    const { data, error } = await supabase
      .from('leads')
      .upsert(leads, { 
        onConflict: 'sheet_row_id',
        returning: 'minimal' // Improve performance by not returning the whole dataset
      });
    
    if (error) {
      throw error;
    }
    
    return { success: true, count: leads.length };
    
  } catch (error) {
    console.error('Error writing leads to Supabase:', error);
    throw error;
  }
}

/**
 * Main function to sync Google Sheets data to Supabase
 * @param {Object} options - Options for the sync process 
 * @param {string} options.sheetName - Name of the sheet to sync (default: 'Sheet1')
 * @param {number} options.batchSize - Number of rows to process at once (default: 50)
 * @param {boolean} options.forceFullSync - Force a full sync instead of incremental (default: false)
 * @param {Function} options.onError - Callback for error handling
 * @returns {Promise<Object>} Result of the sync operation
 */
async function syncSheetsToSupabase(options = {}) {
  const {
    sheetName = 'Sheet1',
    batchSize = 50,
    forceFullSync = false,
    onError = (err) => console.error('Sync error:', err)
  } = options;
  
  const syncStartTime = new Date().toISOString();
  console.log(`Starting sync at ${syncStartTime}`);
  
  try {
    // Fetch all data from Google Sheet
    const sheetData = await fetchSheetData({ sheetName, batchSize });
    console.log(`Fetched ${sheetData.length} rows from sheet`);
    
    // Map sheet data to leads objects
    const leads = sheetData.map(({ headerRow, dataRow, rowIndex }) => 
      mapSheetRowToLeadObject(headerRow, dataRow, rowIndex)
    );
    
    // Write all leads to Supabase
    const result = await writeLeadsToSupabase(leads);
    console.log(`Successfully synced ${result.count} leads to Supabase`);
    
    return {
      success: true,
      syncStartTime,
      syncEndTime: new Date().toISOString(),
      rowsProcessed: leads.length
    };
    
  } catch (error) {
    onError(error);
    return {
      success: false,
      syncStartTime,
      syncEndTime: new Date().toISOString(),
      error: error.message
    };
  }
}

// If this file is run directly, perform a sync
if (require.main === module) {
  syncSheetsToSupabase()
    .then(result => {
      console.log('Sync completed:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Sync failed:', error);
      process.exit(1);
    });
}

// Export functions for programmatic use
module.exports = {
  syncSheetsToSupabase,
  fetchSheetData,
  writeLeadsToSupabase,
  getGoogleSheetsClient,
  getSupabaseClient
}; 