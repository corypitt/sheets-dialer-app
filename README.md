# Google Sheets Dialer App

A microservice-based application that syncs data from Google Sheets to Supabase and provides a dialer-like interface for leads management.

## Features

- **Google Sheets Integration**: Automatically sync data from your Google Sheets to Supabase
- **Authentication**: Secure user authentication via Google OAuth
- **Leads Management**: Paginated list view of all your leads
- **Dialer Interface**: Dedicated view for contacting leads
- **Automated Syncing**: Configured to sync every 6 hours via cron job

## Project Architecture

This application uses a microservice architecture with the following components:

1. **Next.js Web Application**: Provides the user interface and API routes
2. **Google Sheets Sync Service**: Handles data synchronization from Google Sheets to Supabase
3. **Supabase Authentication**: Manages user authentication and data storage

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- Google Cloud Platform account
- Supabase account
- Google Sheet with lead data

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/sheets-dialer-app.git
cd sheets-dialer-app
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Sheets Configuration
GOOGLE_SHEETS_PRIVATE_KEY=your_private_key
GOOGLE_SHEETS_CLIENT_EMAIL=your_client_email
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SHEETS_SHEET_NAME=your_sheet_name
```

### Step 4: Set Up Supabase

1. Create a new Supabase project
2. Configure Google OAuth provider in the Authentication settings
3. Create necessary database tables (refer to docs/supabase_tables.sql)

### Step 5: Set Up Google Cloud

1. Create a new Google Cloud project
2. Enable Google Sheets API
3. Create a service account with appropriate permissions
4. Generate and download the JSON key
5. Share your Google Sheet with the service account email

### Step 6: Start the Application

Development mode:
```bash
npm run dev
```

Production build:
```bash
npm run build
npm start
```

### Step 7: Trigger Initial Sync

```bash
npm run sync
```

Or visit `/api/sync-sheets` endpoint to manually trigger a sync.

## Usage Guide

### Authentication

Visit the homepage and click "Sign in with Google" to authenticate using your Google account.

### Viewing Leads

After logging in, you'll see a paginated list of all leads synced from your Google Sheet.

### Using the Dialer

Click on any lead to open the dialer interface, which allows you to:
- View detailed information about the lead
- Contact the lead via phone or email

### Syncing Data

Data syncs automatically every 6 hours. You can also manually trigger a sync by:
- Running `npm run sync` from the command line
- Visiting the `/api/sync-sheets` endpoint (requires authentication in production)

## Troubleshooting

### Authentication Issues

- Ensure Google OAuth is properly configured in Supabase dashboard
- Verify redirect URIs match exactly
- Check for correct environment variables

### Sync Issues

- Validate Google Service Account has Sheet access
- Check private key formatting (newlines as \n)
- Verify Sheet column headers match expected fields

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Development Setup

### Cloning the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/sheets-dialer-app.git

# Navigate to project directory
cd sheets-dialer-app

# Install dependencies
npm install

# Create and configure .env.local file (see Environment Variables section)
cp .env.example .env.local
```

### Branch Strategy

- `main` - Production-ready code
- `develop` - Development branch
- Feature branches should be created from `develop` using format: `feature/feature-name` 