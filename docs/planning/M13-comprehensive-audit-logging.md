# Milestone 13: Comprehensive Audit Logging System

**Goal**: Enhance basic audit logging (from M3) to comprehensive audit logging for all user actions and anonymous access.

**Note**: Basic audit logging implemented in M3 (login/logout, auth attempts). This milestone expands it to all actions.

**Features**:
- **Middleware to log all API requests**:
  - Document actions (upload, publish, archive, delete, restore)
  - Event actions (create, edit, delete)
  - Admin actions (role changes, membership changes, system config updates, template edits)
  - Verification actions (approve, deny)
  - Profile updates
- **Log structure**: userId, actor ("firstName lastName (Unit: X)" or "anonymous"), unit, action, target, meta (JSON), timestamp
- **Logs written to /data/logs/audit.log** (volume-mounted for backup alongside documents)
- **Anonymous logging**:
  - Main page access (page views)
  - Public document access (including QR-linked newsletters)
  - Track visit counts, not detailed request info
  - **Subtract robot/bot traffic** using user-agent detection
  - Store minimal data for privacy
- **Log retention cleanup**:
  - Authenticated logs: configurable retention (default 12 months)
  - Anonymous logs: configurable retention (default 90 days)
  - Automated cleanup job
- **Audit log viewing interface** (dbadmin only):
  - Search/filter by user, action, date range
  - Export logs to CSV
  - View log details (meta JSON)
- E2E test for audit logging

**Manual Tests**:
1. Perform various actions as authenticated user:
   - Upload document
   - Publish document
   - Create event
   - Update profile
2. Access public pages as anonymous user
3. Access specific document via QR code (simulate)
4. Log in as bootstrap user (dbadmin)
5. Navigate to audit log viewer
6. Verify logs contain:
   - userId (UUID reference)
   - Actor information ("IVM Bootstrap User (Unit:None)" or "anonymous")
   - Action type (upload, publish, page_view, etc.)
   - Target (filename, event ID, user ID)
   - Timestamp
7. **Filter logs**:
   - By specific user
   - By action type (upload, publish, etc.)
   - By date range
8. **Check anonymous logs**:
   - Verify visit counts tracked
   - Verify robot traffic excluded (test with bot user-agent)
9. **Check log file**:
   - Verify /data/logs/audit.log exists
   - Verify log format is parseable (JSON lines or structured format)
10. Test export to CSV
11. **Test log retention**:
    - Verify old logs are cleaned up per configuration
    - Check SystemConfig for retention settings

**Automated Tests**:
- Audit middleware logs all specified actions
- Log entries include userId (or null for anonymous)
- Actor formatting correct ("Name (Unit: X)")
- Anonymous logs include minimal data (action, target, timestamp)
- Robot detection works (user-agent matching)
- Authenticated logs include full user context
- Log query functions work correctly (filter by user, action, date)
- Only dbadmin can view audit logs
- Log retention cleanup works (respects SystemConfig)
- Logs written to /data/logs volume (not database only)
- Export to CSV functionality works
- E2E test: perform action → verify logged → query logs → export
