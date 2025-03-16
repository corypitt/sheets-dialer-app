/**
 * @fileoverview Next.js Application for Dialer Interface
 * 
 * This is the main Next.js application that provides:
 * 1. User authentication via Supabase (Google login)
 * 2. A paginated list of leads synced from Google Sheets
 * 3. A "dialer-like" detail view when clicking on a lead
 * 
 * === ENVIRONMENT VARIABLES REQUIRED ===
 * 
 * NEXT_PUBLIC_SUPABASE_URL - Supabase project URL (client-accessible)
 * NEXT_PUBLIC_SUPABASE_ANON_KEY - Supabase anon key (client-accessible)
 * SUPABASE_SERVICE_ROLE_KEY - Supabase service role key (server-side only)
 * 
 * === INTEGRATION POINTS ===
 * 
 * This app integrates with:
 * - supabaseAuthService.js - For user authentication and session management
 * - sheetsToSupabaseSync.js - For the data that gets displayed
 * 
 * === FILE STRUCTURE ===
 * 
 * While this demonstrates the core functionality in one file, a real Next.js app
 * would typically be structured in multiple files:
 * 
 * /pages
 *   _app.js - Main app wrapper with providers
 *   index.js - Home page with login
 *   dashboard.js - Dashboard with lead listing
 *   leads/[id].js - Individual lead detail page
 * /components
 *   Layout.js - Common layout elements
 *   LeadsList.js - Table of leads with pagination
 *   LeadDetail.js - "Dialer" view for a lead
 *   LoginButton.js - Google login button
 * 
 * This file contains the equivalent functionality but concentrated into one file
 * for easier AI-based maintenance. You can split it into the traditional structure
 * if desired.
 * 
 * === USAGE ===
 * 
 * Run the development server:
 * ```
 * npm run dev
 * ```
 * 
 * Build for production:
 * ```
 * npm run build
 * ```
 */

// Required packages - as a monolithic file, we're importing everything here
// Note: In a real app, each page/component would have its own imports
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import {
  SessionContextProvider,
  useSession,
  useSupabaseClient
} from '@supabase/auth-helpers-react';

// Initialize the Supabase client (client-side)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ============================================================================
// App Component - Main entry point for the application
// ============================================================================
export default function App({ Component, pageProps }) {
  // Create a Supabase client for the browser
  const [supabaseClient] = useState(() => 
    createPagesBrowserClient({
      supabaseUrl,
      supabaseKey: supabaseAnonKey,
    })
  );

  return (
    <SessionContextProvider 
      supabaseClient={supabaseClient}
      initialSession={pageProps.initialSession}
    >
      <AppContent Component={Component} pageProps={pageProps} />
    </SessionContextProvider>
  );
}

// Main app content that checks authentication status
function AppContent({ Component, pageProps }) {
  const session = useSession();
  
  // If we have no session, show the login page
  if (!session) {
    return <LoginPage />;
  }
  
  // Otherwise show the actual app content
  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
}

// ============================================================================
// Login Page Component
// ============================================================================
function LoginPage() {
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error logging in:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Google Sheets Dialer</h1>
        <p>Sign in to access your leads from Google Sheets</p>
        
        <button 
          onClick={handleLogin} 
          disabled={loading}
          className="login-button"
        >
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
        
        {error && <div className="error-message">{error}</div>}
      </div>
      
      <style jsx>{`
        .login-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: #f5f5f5;
        }
        
        .login-card {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          text-align: center;
          max-width: 400px;
          width: 100%;
        }
        
        .login-button {
          background-color: #4285F4;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 12px 24px;
          font-size: 16px;
          cursor: pointer;
          width: 100%;
          margin-top: 20px;
        }
        
        .login-button:hover {
          background-color: #3367D6;
        }
        
        .login-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .error-message {
          color: red;
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// Layout Component - Common layout for authenticated pages
// ============================================================================
function Layout({ children }) {
  const supabase = useSupabaseClient();
  const session = useSession();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  
  return (
    <div className="layout">
      <header className="header">
        <div className="logo">Google Sheets Dialer</div>
        <div className="user-info">
          {session?.user?.email}
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>
      
      <main className="main">
        {children}
      </main>
      
      <footer className="footer">
        &copy; {new Date().getFullYear()} Google Sheets Dialer App
      </footer>
      
      <style jsx>{`
        .layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background-color: #333;
          color: white;
        }
        
        .logo {
          font-size: 1.5rem;
          font-weight: bold;
        }
        
        .user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .logout-button {
          background-color: transparent;
          color: white;
          border: 1px solid white;
          border-radius: 4px;
          padding: 5px 10px;
          cursor: pointer;
        }
        
        .main {
          flex: 1;
          padding: 2rem;
        }
        
        .footer {
          padding: 1rem 2rem;
          background-color: #f5f5f5;
          text-align: center;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// Dashboard Component - Shows list of leads
// ============================================================================
function Dashboard() {
  const supabase = useSupabaseClient();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0
  });
  
  // Fetch leads from Supabase
  const fetchLeads = async () => {
    setLoading(true);
    
    try {
      // Calculate range for pagination
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      
      // Get leads with pagination
      const { data, error, count } = await supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('last_sync', { ascending: false });
      
      if (error) throw error;
      
      setLeads(data || []);
      setPagination({
        ...pagination,
        totalCount: count || 0
      });
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError('Failed to load leads. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Load leads on initial render and when pagination changes
  useEffect(() => {
    fetchLeads();
  }, [pagination.page, pagination.pageSize]);
  
  // Handle lead selection for detail view
  const handleSelectLead = (lead) => {
    setSelectedLead(lead);
  };
  
  // Close the detail view
  const handleCloseDetail = () => {
    setSelectedLead(null);
  };
  
  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination({
      ...pagination,
      page: newPage
    });
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(pagination.totalCount / pagination.pageSize);
  
  return (
    <div className="dashboard">
      <h1>Your Leads</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading">Loading leads...</div>
      ) : (
        <>
          {/* Leads Table */}
          <div className="leads-table-container">
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Company</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-leads">
                      No leads found. Please sync your Google Sheet.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} onClick={() => handleSelectLead(lead)}>
                      <td>{lead.name}</td>
                      <td>{lead.email}</td>
                      <td>{lead.phone}</td>
                      <td>{lead.company}</td>
                      <td>
                        <button 
                          className="view-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectLead(lead);
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {leads.length > 0 && (
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(pagination.page - 1)} 
                disabled={pagination.page === 1}
              >
                Previous
              </button>
              
              <span>
                Page {pagination.page} of {totalPages}
              </span>
              
              <button 
                onClick={() => handlePageChange(pagination.page + 1)} 
                disabled={pagination.page >= totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
      
      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetail lead={selectedLead} onClose={handleCloseDetail} />
      )}
      
      <style jsx>{`
        .dashboard {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .leads-table-container {
          overflow-x: auto;
          margin-bottom: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .leads-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .leads-table th,
        .leads-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        
        .leads-table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        
        .leads-table tr:hover {
          background-color: #f9f9f9;
          cursor: pointer;
        }
        
        .view-button {
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 5px 10px;
          cursor: pointer;
        }
        
        .no-leads {
          text-align: center;
          padding: 2rem;
          color: #777;
        }
        
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .pagination button {
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 5px 15px;
          cursor: pointer;
        }
        
        .pagination button:disabled {
          background-color: #eee;
          color: #999;
          cursor: not-allowed;
        }
        
        .error-message {
          background-color: #ffecec;
          color: #721c24;
          padding: 10px;
          margin-bottom: 20px;
          border-radius: 4px;
          border: 1px solid #f5c6cb;
        }
        
        .loading {
          text-align: center;
          padding: 2rem;
          color: #777;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// LeadDetail Component - "Dialer" interface for a selected lead
// ============================================================================
function LeadDetail({ lead, onClose }) {
  // In a real application, this could trigger actual calls or other actions
  const handleCall = () => {
    alert(`Simulating call to ${lead.name} at ${lead.phone}`);
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{lead.name}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="lead-details">
          <div className="detail-row">
            <div className="detail-label">Email:</div>
            <div className="detail-value">
              <a href={`mailto:${lead.email}`}>{lead.email}</a>
            </div>
          </div>
          
          <div className="detail-row">
            <div className="detail-label">Phone:</div>
            <div className="detail-value">
              <a href={`tel:${lead.phone}`}>{lead.phone}</a>
            </div>
          </div>
          
          <div className="detail-row">
            <div className="detail-label">Company:</div>
            <div className="detail-value">{lead.company}</div>
          </div>
          
          {lead.notes && (
            <div className="detail-row notes">
              <div className="detail-label">Notes:</div>
              <div className="detail-value">{lead.notes}</div>
            </div>
          )}
        </div>
        
        <div className="dialer-actions">
          <button className="call-button" onClick={handleCall}>
            Call {lead.name}
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .modal-content {
          background-color: white;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background-color: #f5f5f5;
          border-bottom: 1px solid #eee;
        }
        
        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .lead-details {
          padding: 1rem;
        }
        
        .detail-row {
          display: flex;
          margin-bottom: 1rem;
        }
        
        .detail-label {
          width: 100px;
          font-weight: bold;
          color: #555;
        }
        
        .detail-value {
          flex: 1;
        }
        
        .detail-value a {
          color: #2196F3;
          text-decoration: none;
        }
        
        .detail-value a:hover {
          text-decoration: underline;
        }
        
        .notes {
          flex-direction: column;
        }
        
        .notes .detail-label {
          margin-bottom: 0.5rem;
        }
        
        .notes .detail-value {
          background-color: #f9f9f9;
          padding: 0.5rem;
          border-radius: 4px;
          white-space: pre-line;
        }
        
        .dialer-actions {
          padding: 1rem;
          border-top: 1px solid #eee;
          display: flex;
          justify-content: center;
        }
        
        .call-button {
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 10px 24px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .call-button:hover {
          background-color: #45a049;
        }
      `}</style>
    </div>
  );
} 