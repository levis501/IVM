# Milestone 8: Verified User Access

**Status**: ✅ Completed (2026-02-17)

**Goal**: Verified users can access protected areas of the site.

**Features**:
- Middleware to check verification status
- Verified users can access:
  - Published documents (when committees exist)
  - Past events (older than current calendar month start)
  - User-only pages
- Pending users **blocked at login** (implemented in M3)
- Denied users **blocked at login** (implemented in M3) with messaging
- Graceful error handling for unverified users (should not reach this point due to M3)
- Past event date logic: events before start of current calendar month require verified login

**Manual Tests**:
1. Log in as newly verified user from Milestone 7
2. Navigate to events - see all events (past and current month)
3. Attempt to access user-only content - access granted
4. **Pending/denied user tests already covered in M3** (cannot log in)
5. Verify past events properly filtered (before current calendar month start)
6. Test date boundary: If today is Jan 15, December events require login, January events are public

**Automated Tests**:
- Middleware allows verified users through
- Pending users cannot log in (M3 test)
- Denied users cannot log in (M3 test)
- API routes respect verification status
- Correct error messages for blocked users
- Past event date filtering (calendar month boundary)
