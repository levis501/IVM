# Milestone 14: SSO Authentication

**Goal**: Add SSO providers (Google, Microsoft, etc.) as alternative to magic-link.

**Features**:
- NextAuth configuration for OAuth providers:
  - Google OAuth
  - Microsoft OAuth
  - (Additional providers as needed)
- Login page shows SSO options + magic-link fallback
- SSO account linking to existing users by email
- Environment variable configuration for OAuth credentials
- Graceful fallback when SSO is unavailable

**Manual Tests**:
1. Configure Google OAuth credentials
2. Navigate to login page
3. Click "Sign in with Google"
4. Complete OAuth flow
5. Verify successful authentication
6. Repeat for Microsoft
7. Test with existing user email - verify account linking
8. Test with new email - verify registration still required
9. Test magic-link still works alongside SSO

**Automated Tests**:
- NextAuth provider configuration for each SSO provider
- Account linking logic
- OAuth callback handling
- Fallback to magic-link when SSO fails
- Session creation from OAuth is equivalent to magic-link
