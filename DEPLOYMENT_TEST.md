# Deployment Testing Checklist

## Basic Deployment
- [ ] Application loads at Vercel URL
- [ ] No console errors on initial load
- [ ] Static assets (CSS, images) load correctly

## Authentication
- [ ] Login page displays correctly
- [ ] Google OAuth flow works
- [ ] Successful redirect after login
- [ ] Session persistence works
- [ ] Logout functionality works

## Data Sync
- [ ] `/api/sync-sheets` endpoint responds
- [ ] Data appears in Supabase database
- [ ] Leads display in dashboard
- [ ] Pagination works correctly
- [ ] Lead details view functions

## Error Handling
- [ ] Protected routes redirect to login
- [ ] Invalid routes show 404 page
- [ ] API errors display user-friendly messages
- [ ] Session expiration handled correctly

## Performance
- [ ] Initial page load time acceptable
- [ ] API response times within limits
- [ ] No memory leaks in browser
- [ ] Smooth navigation between pages 