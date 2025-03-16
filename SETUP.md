# Setup and Testing Guide for Google Sheets Dialer App

This guide provides step-by-step instructions for setting up external services (Supabase and Google Cloud) and testing the application.

## 1. Local Development Setup

Before connecting to external services, you can set up the local development environment:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

## 2. Testing Strategy

Since this application relies on external services, we'll use a phased testing approach:

### Phase 1: Mock Testing
- Use mock data for initial UI testing
- Verify route navigation and component rendering
- Test UI components with placeholder data

### Phase 2: External Service Integration
- Connect to real Supabase instance
- Connect to Google Sheets API
- Test data sync and authentication

## 3. Supabase Setup

### Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign up/login
2. Create a new project
3. Note your project URL and API keys (public anon key and service role key)

### Set Up Authentication

1. In Supabase dashboard, go to Authentication → Providers
2. Enable Google provider
3. Create a Google OAuth Client (instructions below in Google Setup)
4. Configure redirect URLs:
   - For local development: `http://localhost:3000/api/auth/callback`
   - For production: `https://your-domain.com/api/auth/callback`

### Set Up Database

1. Go to SQL Editor in your Supabase dashboard
2. Paste the contents of `docs/supabase_tables.sql`
3. Run the SQL commands to create the necessary tables and functions

## 4. Google Cloud Setup

### Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Google Sheets API:
   - Go to APIs & Services → Dashboard
   - Click "+ ENABLE APIS AND SERVICES"
   - Search for "Google Sheets API" and enable it

### Create OAuth 2.0 Client ID (for Authentication)

1. Go to APIs & Services → Credentials
2. Click "CREATE CREDENTIALS" and select "OAuth client ID"
3. Select "Web application" as the application type
4. Add authorized redirect URIs:
   - `https://[YOUR_SUPABASE_PROJECT].supabase.co/auth/v1/callback`
5. Note your Client ID and Client Secret
6. Add these to your Supabase Google provider settings

### Create Service Account (for Google Sheets Access)

1. Go to APIs & Services → Credentials
2. Click "CREATE CREDENTIALS" and select "Service account"
3. Name your service account and grant it appropriate roles
4. Click on the created service account
5. Go to the "KEYS" tab
6. Click "ADD KEY" → "Create new key" → JSON
7. Save the downloaded JSON file securely

### Prepare a Test Google Sheet

1. Create a new Google Sheet
2. Add columns matching your leads table (name, email, phone, etc.)
3. Add a few test rows
4. Share the sheet with the service account email address (view access is sufficient)
5. Note the Spreadsheet ID (from the URL: `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`)

## 5. Environment Variables Setup

Create a `.env.local` file with the following variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Sheets Configuration
GOOGLE_SHEETS_PRIVATE_KEY="your_private_key_with_escaped_newlines"
GOOGLE_SHEETS_CLIENT_EMAIL=your_service_account_email
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SHEETS_SHEET_NAME=your_sheet_name
```

Note: For the private key, you'll need to replace newlines with `\n` characters.

## 6. Testing the Application

### Test Authentication

1. Start the development server: `npm run dev`
2. Visit `http://localhost:3000`
3. Click "Sign in with Google"
4. You should be redirected to Google for authentication
5. After successful authentication, you should be redirected back to your app

### Test Google Sheets Sync

1. Make sure your environment variables are properly set
2. Run the sync script: `npm run sync`
3. Check your Supabase database to verify that leads were imported
4. Visit `http://localhost:3000` and sign in to view the imported leads

## 7. Minimal Testing Without Full Setup

If you want to test parts of the application without setting up all external services:

### For Frontend UI Testing Only:

1. Modify `web/nextjsApp.js` to bypass authentication for development:
   ```javascript
   // Add at the top of the AppContent component
   if (process.env.NODE_ENV === 'development') {
     // Mock session for development
     const mockSession = { user: { email: 'test@example.com' } };
     return (
       <Layout>
         <Dashboard mockData={true} />
       </Layout>
     );
   }
   ```

2. Add mock data to the Dashboard component:
   ```javascript
   // In the Dashboard component, add support for mock data
   function Dashboard({ mockData = false }) {
     // Use mock data if specified
     useEffect(() => {
       if (mockData) {
         setLeads([
           { id: '1', name: 'Test User', email: 'test@example.com', phone: '123-456-7890', company: 'Test Co' },
           // Add more mock leads as needed
         ]);
         setPagination({
           page: 1,
           pageSize: 10,
           totalCount: 1
         });
         setLoading(false);
       } else {
         fetchLeads();
       }
     }, [mockData, pagination.page, pagination.pageSize]);
     
     // Rest of component remains the same
   }
   ```

This approach lets you test the UI components without requiring external service configuration.

## 8. Troubleshooting

### Authentication Issues
- Check that redirect URIs match exactly between Supabase and Google OAuth settings
- Verify that environment variables are correctly set
- For local development, ensure `localhost:3000` is an allowed redirect URI

### Google Sheets Sync Issues
- Verify that the service account has access to the Google Sheet
- Check that the GOOGLE_SHEETS_PRIVATE_KEY is properly formatted with escaped newlines
- Ensure the sheet has the expected column headers

### Database Issues
- Run the SQL commands manually in the Supabase SQL Editor to check for errors
- Verify that the RLS policies are correctly configured 