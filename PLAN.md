# Indian Village Manor - Implementation Plan

## Overview

This plan breaks down the implementation of the Indian Village Manor website into discrete, testable milestones. Each milestone includes manual and automated test criteria.

## Project Setup (Milestone 0)

**Goal**: Establish the development environment and foundational infrastructure.

**Tasks**:
- Initialize Next.js project with TypeScript
- Configure TailwindCSS
- Set up PostgreSQL database (local + Docker)
- Initialize Prisma with schema models
- Configure nodemailer for email
- Set up basic project structure (app/, components/, lib/, prisma/)
- Create docker-compose.yml for local development

**Manual Tests**:
- Project builds without errors (`npm run build`)
- Database migrations run successfully (`npx prisma migrate dev`)
- Dev server starts and shows Next.js welcome page

**Automated Tests**:
- Build script succeeds in CI
- Database connection test
- Environment variable validation test

---

## Milestone 1: Anonymous User Experience

**Goal**: Public users can view the static marketing site and public events without authentication.

**Features**:
- Static homepage with manor information
- Public navigation (no hamburger menu for unauthenticated users, or hamburger shows only "Login")
- Current and future events are publicly visible
- Contact information page
- Floorplans page (if content available)
- Basic layout with responsive design

**Manual Tests**:
1. Visit homepage - see manor information
2. Navigate to events page - see only current and future events
3. Navigate to contact page - see contact information
4. Verify hamburger menu shows "Login" option only
5. Verify no authenticated content is accessible
6. Test responsive design on mobile, tablet, desktop

**Automated Tests**:
- Homepage renders correctly (snapshot test)
- Events API returns only current/future events for unauthenticated requests
- Navigation links are correct for unauthenticated users
- Protected routes redirect to login
- API routes return 401 for authenticated-only endpoints

---

## Milestone 2: Database Schema and Seed Data

**Goal**: Complete database schema with initial bootstrap user.

**Features**:
- Complete Prisma schema (User, Role, Committee, Document, Event, AuditLog, SystemConfig, EmailTemplate)
- User model includes: id, firstName, lastName, email, phone (required), unitNumber (alphanumeric max 6 chars), isResident, isOwner, verificationStatus, roles, committees, timestamps
- SystemConfig model for runtime configuration (session timeout, alert thresholds, etc.)
- EmailTemplate model for customizable email templates
- Seed script to create initial roles (dbadmin, publisher, calendar, verifier, user, owner)
- Seed script to create initial bootstrap user:
  - First Name: "IVM Bootstrap"
  - Last Name: "User"
  - Email: "indianvillagemanor+bootstrap@gmail.com"
  - Unit: "None"
  - Roles: dbadmin, user, owner, verifier
  - verificationStatus: "verified"
- Seed initial SystemConfig entries (session timeout: 90 days, disk alert threshold: 85%)
- Seed initial EmailTemplate entries (magic-link, verifier-notification, approval, denial)
- Database constraints and validations

**Manual Tests**:
1. Run `npx prisma migrate dev` - migrations succeed
2. Run `npx prisma db seed` - seed data created
3. Use Prisma Studio to verify bootstrap user exists with firstName="IVM Bootstrap", lastName="User"
4. Verify all roles exist in Role table
5. Verify SystemConfig has session_timeout and disk_alert_threshold entries
6. Verify EmailTemplate has default templates
7. Verify all model relationships work correctly
8. Verify User.id references work correctly for uploadedBy, createdBy, etc.

**Automated Tests**:
- Migration scripts run without errors
- Seed script is idempotent (can run multiple times safely)
- Database constraints are enforced (unique email, required fields)
- Relationship queries work (user -> roles, committee -> documents, etc.)
- unitNumber validation (alphanumeric, max 6 chars)
- User must have isResident OR isOwner

---

## Milestone 3: Magic Link Authentication and Basic Audit Logging

**Goal**: Implement email magic-link authentication flow with rate limiting and basic audit logging.

**Features**:
- NextAuth configuration with email provider
- Magic-link email template (from EmailTemplate table)
- Login page with email input
- "Check your email" confirmation page
- Session management with secure HTTP-only cookies
- Session timeout: 90 days (configurable via SystemConfig)
- Logout functionality
- Email verification token generation and validation
- **Rate limiting implementation** for login and magic-link requests (not just testing)
- **Pending users CANNOT log in** - authentication blocks at login, shows appropriate message
- **Email recovery flow**:
  - Option 1: Partial email challenge (show some characters, user completes it)
  - Option 2: Unit number lookup (send reminder to all verified users in that unit)
- **Basic audit logging** (comprehensive logging in M13):
  - Write logs to /data/logs volume
  - Log login/logout actions
  - Log authentication attempts (successful and failed)
  - Track failed login attempts per user
  - Simple log format: userId, actor name, action, timestamp

**Manual Tests**:
1. Navigate to /login
2. Enter bootstrap user email
3. Receive magic-link email with customized template
4. Click magic-link - successfully authenticated
5. See hamburger menu with "Logout" option
6. Click logout - session ends, redirected to homepage
7. Verify expired/invalid tokens are rejected
8. **Test rate limiting** - attempt >5 magic-link requests rapidly, verify blocking
9. **Create pending user, attempt to log in** - verify blocked with "Verification required" message
10. **Test email recovery Option 1** - partial email challenge works
11. **Test email recovery Option 2** - unit number sends email to verified users in unit
12. Verify session persists for 90 days (or configured duration)
13. **Check /data/logs** - verify login/logout actions are logged

**Automated Tests**:
- NextAuth provider configuration is valid
- Magic-link token generation and validation
- Session creation and destruction
- Protected route middleware works
- Email sending (mock in tests)
- Token expiration logic
- **Rate limiting enforcement (login, magic-link)**
- **Pending user authentication blocked**
- **Email recovery flows (partial email, unit lookup)**
- **Session timeout respects SystemConfig setting**
- **Basic audit log writes to volume**
- **Failed login attempt tracking**

---

## Milestone 4: Basic Menu and Navigation for Authenticated Users

**Goal**: Authenticated users see appropriate menu items based on their roles and verification status.

**Features**:
- Hamburger menu component
- Dynamic menu items based on authentication status:
  - Unauthenticated: "Login"
  - Authenticated verified users: "Logout", committee links (if applicable)
  - **Calendar link added later when events exist** (not in this milestone)
- User context/session hook
- Role-based menu item visibility
- Committee visibility rules:
  - Show committees with published documents (all verified users)
  - Show committees where user is member or publisher (even if no published docs)

**Manual Tests**:
1. Log in as bootstrap user (verified)
2. Open hamburger menu
3. Verify "Logout" is visible
4. **Verify "Calendar" link is NOT yet visible** (will be added in M11)
5. Log out and verify menu shows only "Login"
6. Test menu on mobile and desktop
7. Create pending user, verify they cannot access menu (cannot log in)

**Automated Tests**:
- Menu renders correct items for unauthenticated users
- Menu renders correct items for authenticated verified users
- Pending users cannot authenticate (tested in M3)
- Session hook returns correct user data (firstName, lastName, email, unit, roles)
- Component tests for menu with different user states

---

## Milestone 5: User Registration Flow

**Goal**: New users can register with required information.

**Features**:
- Registration form with validation
- Zod schema for registration data
- Required fields: **firstName, lastName**, email, phone, unitNumber, at least one of {isResident, isOwner}
- Unit number validation: alphanumeric, maximum 6 characters (manually verified by verifier)
- Create user with verificationStatus = "pending"
- Registration confirmation page ("Verification required - you will receive an email when approved")
- Form validation and error handling
- **Note**: Pending users CANNOT log in (enforced in M3)

**Manual Tests**:
1. Navigate to /register
2. Fill in all required fields (firstName, lastName, email, phone, unit, check at least one of resident/owner)
3. Submit form - see "Verification required" message
4. Use Prisma Studio to verify user created with:
   - firstName, lastName correctly stored
   - pending verificationStatus
   - unitNumber is alphanumeric, max 6 chars
5. Test validation errors:
   - Missing firstName or lastName
   - Missing required fields
   - Invalid email format
   - Neither resident nor owner selected
   - Invalid unit number (>6 chars or non-alphanumeric)
6. Verify duplicate email registration is rejected
7. Attempt to log in with pending user - verify blocked (from M3)

**Automated Tests**:
- Registration form validation (Zod schema)
- API route creates user with correct data (firstName, lastName, etc.)
- Duplicate email returns appropriate error
- Unit number validation logic (alphanumeric, max 6 chars)
- At least one of isResident/isOwner is enforced
- User is created with pending verification status
- Pending users cannot authenticate (from M3)

---

## Milestone 6: Verifier Notification System

**Goal**: Users with verifier role receive email notifications when new users register.

**Features**:
- Email notification to all verifiers on new registration
- Email template from EmailTemplate table (key: "verifier-notification")
- Email includes:
  - New user details (**firstName, lastName**, email, phone, unit, resident/owner status)
  - Link to verification page
- Queue system for email sending (or immediate with error handling)
- **Failed email notification to dbadmin** (basic implementation, enhanced in M20)

**Manual Tests**:
1. Ensure bootstrap user has verifier role
2. Register a new user
3. Check that bootstrap user email receives notification
4. Verify email contains:
   - firstName, lastName
   - Email, phone, unit number
   - Resident/owner status
   - Link to verification page
5. Test with multiple verifiers - all receive email
6. Simulate email failure - verify dbadmin is notified

**Automated Tests**:
- Email sent to all users with verifier role
- Email contains correct user information (firstName, lastName, etc.)
- Verification link format is correct
- Email sending errors are handled gracefully
- Failed email triggers dbadmin notification
- Mock email service in tests

---

## Milestone 7: Verifier Approval/Denial Flow

**Goal**: Verifiers can approve or deny pending user registrations.

**Features**:
- Verifier dashboard listing pending registrations
- Verification page for individual registration:
  - Show user details (firstName, lastName, email, phone, unit, resident/owner)
  - Approve button
  - Deny button
  - Comment field (optional but recommended)
- Update user verificationStatus to "verified" or "denied"
- Record verificationUpdatedAt, verificationUpdatedBy (User.id reference), verificationComment
- **Send approval email** to user (EmailTemplate: "approval")
- **Send denial email** to user with next steps (EmailTemplate: "denial"):
  - Explain registration was denied
  - Suggest contacting office for assistance
  - Suggest re-registering with correct information
- Audit log entry for verification action (uses basic logging from M3)
- E2E test for complete verifier flow

**Manual Tests**:
1. Log in as bootstrap user (verifier)
2. Navigate to verifier dashboard
3. See pending registration(s) from Milestone 5
4. Click on a pending user
5. Add comment "Verified as resident - unit number confirmed"
6. Click "Approve"
7. Verify user status updated to "verified" in database
8. Verify verificationUpdatedBy stores bootstrap user's ID
9. Verify user receives confirmation email
10. User can now log in successfully
11. Create another pending user, deny with comment "Incorrect unit number"
12. Verify denial is recorded correctly
13. **Verify denied user receives denial email with next steps**
14. Denied user still cannot log in
15. Verify audit log records both approval and denial actions

**Automated Tests**:
- Only users with verifier role can access verifier dashboard
- Approve action updates user status correctly
- Deny action updates user status correctly
- Verification metadata (updatedAt, updatedBy User.id, comment) is recorded
- Approval email is sent (EmailTemplate: "approval")
- **Denial email is sent with next steps** (EmailTemplate: "denial")
- Audit log entry is created for both approve and deny
- Non-verifiers cannot access verification endpoints
- **E2E test: complete flow from registration → verification → login**

---

## Milestone 8: Verified User Access

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

---

## Milestone 8.5: User Profile Management

**Goal**: Verified users can update their profile information with re-verification flow.

**Features**:
- User profile page showing: first Name, lastName, email, phone, unitNumber, isResident, isOwner
- Profile edit form
- Changes to firstName, lastName, unitNumber, phone, or resident/owner status trigger re-verification:
  - User's verificationStatus reverts to "pending"
  - User is notified of re-verification requirement
  - **Option to cancel changes** and maintain verified status
  - Confirmation dialog before saving changes that require re-verification
- Email change requires email confirmation before taking effect
- After profile changes requiring re-verification:
  - User reverts to pending status (cannot access protected content)
  - Verifiers notified of profile update for re-verification
  - Email sent to user (EmailTemplate: "profile-update-reverify")
- Audit log for profile updates
- E2E test for profile update flow

**Manual Tests**:
1. Log in as verified user
2. Navigate to profile page
3. Change firstName - submit form
4. Verify warning appears: "This change requires re-verification"
5. Confirm you want to proceed
6. Verify verificationStatus changed to "pending"
7. Verify verifiers receive email notification
8. Verify user receives "profile-update-reverify" email
9. User can no longer access protected content
10. Log in as verifier, approve the profile change
11. User can access protected content again
12. **Test cancel option**:
    - Go to profile, change unitNumber
    - See re-verification warning
    - Click cancel - changes not saved, still verified
13. Verify audit log records profile update

**Automated Tests**:
- Profile update API works
- Changes requiring re-verification properly revert status to pending
- Verifiers notified of profile updates
- User receives re-verification email
- Cancel option works correctly
- Audit log records profile changes
- E2E test: update profile → re-verify → access restored

---

## Milestone 9: Committee System

**Goal**: Set up committees and membership management.

**Features**:
- Committee CRUD (dbadmin only)
- Committee list page
- Committee detail pages
- Committee membership management (dbadmin only)
- Display committees in navigation for:
  - Members of the committee
  - Publishers for the committee
  - Committees with at least one published document (all verified users)
- Committee page shows published documents

**Manual Tests**:
1. Log in as bootstrap user (dbadmin)
2. Create committees: "Board", "Architectural", "Social"
3. Add descriptions to committees
4. Assign bootstrap user as member of "Board"
5. Verify "Board" appears in navigation
6. Create test user and add as member of "Social"
7. Log in as test user - verify "Social" appears in their navigation

**Automated Tests**:
- Only dbadmin can create/edit committees
- Committee membership queries work correctly
- Navigation shows correct committees for user
- Non-members cannot see committees without published documents
- API endpoints enforce role-based access

---

## Milestone 10: Document Publishing System

**Goal**: Publishers can upload, publish, archive, delete, and restore documents for their committees.

**Features**:
- Document storage setup (mounted volume /data/documents with committee subdirectories)
- Document upload API with validation:
  - File type whitelist (pdf, jpg, png)
  - Size limit (25 MB, configurable via SystemConfig)
  - Filename sanitization
- Publisher interface for document management (**must be committee member**)
- Document states:
  - **Published**: Listed on committee page, accessible to verified users
  - **Archived**: Not listed, but existing links work
  - **Deleted**: Moved to committee-specific trash (`/data/documents/<committee-id>/.trash/`)
- **Restore functionality**: Publishers can restore archived or deleted documents for their committees
- Published documents visible to all verified users
- Trash management: View deleted documents, restore, or permanently delete
- Audit log for all document actions (upload, publish, archive, delete, restore)
- E2E test for document lifecycle

**Manual Tests**:
1. Log in as bootstrap user (dbadmin)
2. Assign bootstrap user publisher role AND add as member of "Board" committee
3. Navigate to Board committee page
4. **Upload a PDF document** - verify stored in /data/documents/board-id/
5. Mark document as published - verify appears on committee page
6. Log in as different verified user - verify document is visible
7. Log back in as publisher
8. **Archive the document**:
   - Verify no longer listed on committee page
   - Verify direct link still works
9. **Delete a document**:
   - Upload second document
   - Delete it
   - Verify moved to /data/documents/board-id/.trash/
   - Verify not accessible via public URL
10. **Restore deleted document**:
    - View trash for committee
    - Restore document
    - Verify it reappears as published (or archived, based on previous state)
11. **Restore archived document**:
    - Restore previously archived document
    - Verify it reappears as published
12. Verify audit logs record all actions (upload, publish, archive, delete, restore)
13. Test file validation:
    - Reject .exe file
    - Reject file over 25 MB
    - Accept valid PDF
14. Test publisher without committee membership cannot upload to that committee
15. Check size limit from SystemConfig (max_upload_size_mb)

**Automated Tests**:
- File upload validation (type, size)
- Filename sanitization
- Only publishers **with committee membership** can upload
- Published documents query returns correct results (deleted=false, published=true)
- Archived documents are excluded from listings but accessible
- Deleted files are moved to committee .trash directory
- Restore function works for both archived and deleted documents
- Audit log entries created for all document actions (including restore)
- Storage path configuration works
- E2E test: upload → publish → archive → restore → delete → restore

---

## Milestone 11: Event Calendar System

**Goal**: Calendar role can manage events; public can view current/future events.

**Features**:
- Event CRUD interface for calendar role
- Event list page (public for current calendar month and future, authenticated for past)
- Event detail page
- Calendar view (optional - can be simple list first)
- Event creation/edit form with validation
- **Date-based filtering logic**:
  - Public: Events in current calendar month or future (e.g., if today is Jan 15 or Jan 31, show January and later, not December)
  - Protected: Events before start of current calendar month require verified login
- Audit log for event actions
- **Add "Calendar" link to hamburger menu** for verified users (now that events exist)
- E2E test for event management

**Manual Tests**:
1. Log in as bootstrap user (dbadmin)
2. Assign bootstrap user calendar role
3. **Verify "Calendar" link now appears in hamburger menu**
4. Create a future event (next month)
5. Log out - verify future event is visible on public site
6. Log in and create an event in current month
7. Log out - verify current month event IS visible (public)
8. Log in and create a past event (last month)
9. Log out - verify past event is NOT visible
10. Log in as verified user - verify past event IS visible
11. **Test calendar month boundary**:
    - If today is January 15, January events should be public
    - December events should require login
12. Edit and delete events as calendar user
13. Verify non-calendar users cannot create/edit/delete events
14. Verify audit logs record event actions
15. Verify calendar link appears for all verified users

**Automated Tests**:
- Only calendar role can create/edit/delete events
- Public API returns only current calendar month and future events
- Authenticated API returns all events for verified users
- **Event date filtering logic** (calendar month boundary)
- Event validation (required fields, valid dates)
- Audit log entries for event actions
- Non-calendar users cannot access event management endpoints
- Calendar link appears in menu for verified users
- E2E test: create event → verify visibility rules → edit → delete


---

## Milestone 12: Database Admin Console

**Goal**: Dbadmin role can manage user roles, committee memberships, system configuration, email templates, and perform bulk operations.

**Features**:
- User list page with search/filter
- User detail/edit page showing firstName, lastName, email, phone, unit, roles, committees, verification status
- Role assignment interface
- Committee membership assignment interface
- **Bulk operations interface**:
  - Bulk role assignment (select multiple users, assign role)
  - Bulk committee membership (select multiple users, add to committee)
  - Bulk actions with confirmation dialogs
- **SystemConfig management UI**:
  - View/edit system configuration values
  - session_timeout_days, disk_alert_threshold_percent, max_upload_size_mb, etc.
  - Input validation for config values
  - Changes take effect immediately (or after restart, depending on config)
- **EmailTemplate management UI**:
  - View all email templates
  - Edit template subject and body
  - Preview template with sample variables
  - List of available variables for each template
  - Syntax validation for template variables
- Audit log for role/membership/config/template changes
- Only accessible to dbadmin role
- E2E test for admin operations

**Manual Tests**:
1. Log in as bootstrap user (dbadmin)
2. Navigate to admin console
3. **User Management**:
   - View list of all users (firstName, lastName, email, unit, status)
   - Select a user, assign publisher role
   - Assign user to a committee
   - Verify changes persisted
4. **Bulk Operations**:
   - Select 3 users
   - Bulk assign calendar role
   - Verify all 3 users now have calendar role
   - Bulk add users to "Social" committee
   - Verify all added successfully
5. **SystemConfig**:
   - Navigate to system configuration
   - Change session_timeout_days from 90 to 60
   - Change disk_alert_threshold_percent from 85 to 80
   - Verify changes saved
   - Test that next login uses new session timeout
6. **Email Templates**:
   - Navigate to email templates
   - Edit "approval" template subject
   - Preview template with sample data
   - Verify available variables listed ({{firstName}}, {{lastName}}, etc.)
   - Save changes
   - Trigger approval - verify email uses new template
7. **Audit Logs**:
   - Verify all admin actions logged
   - Check role assignment, config change, template edit all in audit log
8. **Access Control**:
   - Log in as non-dbadmin user
   - Attempt to access admin console - access denied

**Automated Tests**:
- Only dbadmin can access admin console
- Role assignment API works correctly
- Committee membership API works correctly
- Multiple role assignment per user
- Multiple committee membership per user
- **Bulk operations API**:
  - Bulk role assignment
  - Bulk committee membership
  - Validation prevents invalid assignments
- **SystemConfig API**:
  - CRUD operations on config
  - Validation enforces correct value types/ranges
  - Config changes reflected in application
- **EmailTemplate API**:
  - CRUD operations on templates
  - Template variable validation
  - Preview functionality works
- Audit log entries created for all admin actions
- Non-dbadmin cannot access admin endpoints
- E2E test: bulk assign roles → update config → edit template → verify audit log

---

## Milestone 13: Comprehensive Audit Logging System

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

---

## Milestone 14: SSO Authentication

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

---

## Milestone 15: Containerization and Deployment

**Goal**: Complete Docker setup for production deployment.

**Features**:
- Dockerfile for Next.js app
- docker-compose.yml with:
  - Next.js app container
  - PostgreSQL container
  - Nginx reverse proxy container
- Persistent volumes for:
  - PostgreSQL data
  - Uploaded documents (/data/documents)
  - **Audit logs (/data/logs)**
  - Optional: configuration
- Environment variable configuration
- HTTPS setup with Let's Encrypt (certbot)
- Health checks for containers
- Production-ready configuration

**Manual Tests**:
1. Build Docker images
2. Start with docker-compose up
3. Verify all containers start successfully
4. Access application via reverse proxy
5. Verify HTTPS works (or HTTP is properly configured)
6. Upload a document - verify it persists after container restart in /data/documents
7. **Perform actions - verify audit logs persist in /data/logs**
8. Create database data - verify it persists after container restart
9. Stop and start containers - verify all data persistence
10. Check health endpoints
11. Verify volume mounts correct: /data/documents, /data/logs, postgres data

**Automated Tests**:
- Docker build succeeds
- docker-compose validation
- Container health checks pass
- Volume mounts work correctly (documents, logs, database)
- Environment variables are loaded
- Application starts and responds to requests

---

## Milestone 16: Backup and Recovery

**Goal**: Automated backup of database, documents, and logs with recovery procedures.

**Features**:
- **DATABASE_MIGRATIONS.md**: Documentation for production migration strategy (created in this milestone)
- Backup script for:
  - PostgreSQL dump
  - Document volume snapshot (/data/documents)
  - **Audit log volume snapshot (/data/logs)**
- Configurable backup schedule (cron)
- Off-site backup storage (Google Drive, S3, or similar)
- Backup retention policy (30-day rotation)
- Recovery documentation and scripts
- Backup verification (periodic restore tests)
- Encrypted backups
- **Database migration rollback tests**

**Manual Tests**:
1. **Review DATABASE_MIGRATIONS.md** - verify migration strategy documented
2. Run backup script manually
3. Verify backup files created in expected location:
   - PostgreSQL dump
   - /data/documents snapshot
   - /data/logs snapshot
4. Verify backups uploaded to off-site storage
5. Perform recovery test:
   - Stop containers
   - Clear volumes
   - Restore from backup (database + documents + logs)
   - Start containers
   - Verify data is restored correctly
   - Verify audit logs restored
6. Test automated backup schedule (wait for cron trigger)
7. Verify old backups are cleaned up per retention policy
8. **Test database migration rollback**:
   - Apply a test migration
   - Verify rollback procedure works (see DATABASE_MIGRATIONS.md)
9. Verify backups are encrypted

**Automated Tests**:
- Backup script completes successfully
- Backup files have expected format and content
- Database restore from backup works
- File restoration from backup works (documents + logs)
- Backup verification logic
- Retention cleanup removes old backups
- Encryption of backups
- **Migration rollback test** (test schema rollback)

---

## Milestone 17: Security Hardening

**Goal**: Implement security best practices.

**Features**:
- Input validation and sanitization for all user input
- File upload security:
  - Virus scanning (ClamAV or similar)
  - File type validation beyond extension
  - Size limits enforced
- Rate limiting:
  - Login attempts
  - Magic-link requests
  - API endpoints
  - Document uploads
- CSRF protection
- XSS prevention
- SQL injection prevention (via Prisma)
- Secure session configuration
- Security headers (CSP, HSTS, etc.)
- Dependency vulnerability scanning

**Manual Tests**:
1. Test rate limiting on login - verify lockout after N attempts
2. Test file upload with malicious filename - verify sanitization
3. Attempt SQL injection in form inputs - verify prevention
4. Attempt XSS in text inputs - verify escaping
5. Check HTTP headers include security headers
6. Verify sessions use HTTP-only, secure cookies
7. Test CSRF protection on state-changing operations
8. Run dependency audit - verify no critical vulnerabilities

**Automated Tests**:
- Rate limiting tests
- Input validation tests (malicious inputs)
- File upload validation tests
- CSRF protection tests
- Security header tests
- Session security tests
- Dependency vulnerability scanning in CI
- Integration tests with malicious payloads

---

## Milestone 18: Testing Infrastructure and Coverage

**Goal**: Establish comprehensive test infrastructure with good coverage across all features.

**Important Note**: This milestone focuses on test infrastructure, CI/CD pipeline, and coverage reporting. **E2E tests are written alongside features in their respective milestones** (M3, M7, M8.5, M10, M11, M12), not created separately here.

**Features**:
- Test infrastructure setup:
  - Jest configuration for unit/integration tests
  - Playwright or Cypress for E2E tests
  - Test database setup/teardown
  - Mock services (email, external APIs)
- Unit tests (if not already created):
  - Validation schemas (Zod)
  - Utility functions
  - Role checking logic
  - Date filtering logic
- Integration tests (if not already created):
  - API routes
  - Database operations
  - Authentication flows
  - Authorization checks
- **E2E tests already written in**:
  - M7: Registration → verification → login
  - M8.5: Profile update → re-verification
  - M10: Document upload → publish → archive → restore → delete
  - M11: Event create → verify visibility → edit → delete
  - M12: Bulk operations → config update → template edit
  - M13: Audit logging throughout
- Test coverage reporting (Istanbul/NYC)
- CI pipeline integration:
  - Lint → TypeCheck → Unit Tests → Integration Tests → Build → E2E Tests
  - Coverage thresholds enforced (>80% for critical paths)
  - Automated test runs on every commit
  - Pre-deployment test suite
- Performance test suite for load testing
- Security test suite (penetration testing scenarios)

**Manual Tests**:
1. Run `npm test` - all unit and integration tests pass
2. Run `npm run test:e2e` - all E2E tests pass (tests from M3-M13)
3. Review coverage report - verify >80% coverage for critical paths
4. Run tests in CI - verify pipeline passes
5. Test CI triggers - push commit, verify tests run automatically
6. Review test output for clarity and usefulness

**Automated Tests**:
- (This milestone IS about the testing infrastructure itself)
- All critical paths have test coverage
- Tests run in CI on every commit
- Coverage thresholds enforced
- Failed tests block deployment
- Test performance (tests complete in reasonable time)

**Success Criteria**:
- All feature E2E tests passing (written in M3-M13)
- >80% code coverage on critical paths
- CI pipeline running smoothly
- Fast test execution (<10min total)
- Clear test failure messages

---

## Milestone 19: Documentation and Operations Guide

**Goal**: Complete documentation for developers and operators.

**Features**:
- README.md with:
  - Project overview
  - Setup instructions
  - Environment variables
  - Development workflow
- **DATABASE.md** (already created):
  - Complete schema documentation
  - Relationships and constraints
  - Indexes and performance notes
  - Security considerations
- **DATABASE_MIGRATIONS.md** (already created):
  - Migration deployment strategy
  - Rollback procedures
  - Testing requirements
  - Production deployment checklist
- DEPLOYMENT.md with:
  - Deployment steps
  - Environment configuration
  - Docker commands
  - Troubleshooting
- OPERATIONS.md with:
  - Backup and recovery procedures
  - Monitoring recommendations
  - Log locations (/data/logs, /data/documents)
  - Common administrative tasks
  - Responding to alerts
- API documentation (OpenAPI/Swagger)
- Code comments for complex logic

**Manual Tests**:
1. Follow README setup instructions on fresh machine - verify works
2. Follow DATABASE.md to understand schema - verify accuracy
3. Follow DATABASE_MIGRATIONS.md to deploy a test migration - verify process works
4. Follow DEPLOYMENT.md to deploy to staging environment - verify successful deployment
5. Use OPERATIONS.md to perform common tasks (backup, restore, view logs)
6. Verify all environment variables are documented
7. Review API documentation for completeness
8. Test all documented procedures

**Automated Tests**:
- Documentation link checker (verify no broken links)
- Code examples in docs are valid (can be executed)
- Environment variable documentation matches code (script to verify)
- Shell commands in documentation are syntactically valid

**Documentation Checklist**:
- [ ] README.md complete
- [ ] DATABASE.md complete (already done)
- [ ] DATABASE_MIGRATIONS.md complete (already done)
- [ ] DEPLOYMENT.md complete
- [ ] OPERATIONS.md complete
- [ ] API documentation complete
- [ ] All environment variables documented
- [ ] All configuration options documented

---

## Milestone 20: Performance Optimization and Monitoring

**Goal**: Optimize application performance for production use and implement monitoring/alerting system.

**Features**:
- **Performance Optimization**:
  - Database query optimization:
    - Proper indexes (see DATABASE.md)
    - Query analysis and optimization
    - N+1 query prevention (use Prisma includes)
  - Caching strategy:
    - Static page caching (Next.js ISR)
    - API response caching (where appropriate)
    - Database query caching
  - Image optimization
  - Code splitting and lazy loading
  - CDN setup for static assets (optional)
- **Monitoring and Alerting System**:
  - **Metrics collection**:
    - Failed login attempts per user
    - Pending verifications count
    - Document upload success/failure rates
    - Email delivery success/failure rates
    - Disk usage for document and log volumes
    - Database connection pool status
    - API response times
    - Error rates
  - **Email alerting to dbadmin** for:
    - Failed email deliveries (magic-link, verifications, notifications)
    - Failed login attempts by a user > 3 (configurable via System Config)
    - Pending verifications count increase
    - Disk usage above configurable threshold (default: 85%, configurable via SystemConfig)
    - Application errors and warnings
    - Database connection issues
    - Backup failures
  - **Alert configuration UI** (dbadmin):
    - Configure alert thresholds via SystemConfig
    - failed_login_alert_threshold (default: 3)
    - disk_alert_threshold_percent (default: 85)
    - pending_verification_alert_count (default: 5)
  - Monitoring dashboard (optional, or use external tool like Grafana)
  - Health check endpoints for uptime monitoring

**Manual Tests**:
1. **Performance Testing**:
   - Use Lighthouse to audit performance (score >90)
   - Test page load times (<2s for main pages)
   - Monitor database query performance (no queries >100ms)
   - Upload large document (within limit) - verify reasonable upload time
   - Load page with many documents - verify performant
   - Check memory usage over time - no leaks
2. **Monitoring Testing**:
   - Trigger >3 failed logins - verify dbadmin receives alert email
   - Register 5+ new users - verify pending verification alert sent
   - Upload documents until disk usage >85% - verify alert sent
   - Simulate email delivery failure - verify dbadmin notified
   - Check application error - verify error alert sent
3. **Alert Configuration**:
   - Log in as dbadmin
   - Navigate to SystemConfig
   - Change disk_alert_threshold_percent to 75
   - Verify new threshold takes effect
   - Change failed_login_alert_threshold to 5
   - Trigger 5 failed logins - verify alert sent

**Automated Tests**:
- Performance benchmarks for critical paths:
  - Homepage load time <2s
  - API endpoints respond <200ms
  - Database queries <100ms
- Database query performance tests (use explain analyze)
- Load testing for API endpoints (Artillery or k6)
  - 100 concurrent users
  - Sustained load for 5 minutes
- Memory leak tests (monitor for 1 hour under load)
- **Monitoring tests**:
  - Failed login alert triggers correctly
  - Disk usage alert triggers at threshold
  - Email failure alert works
  - Pending verification alert works
  - Alert configuration updates reflected
- Health check endpoint returns correct status

**Monitoring Metrics Dashboard** (if implemented):
- Active users (last 24h)
- Failed login attempts (last 24h)
- Pending verifications
- Document uploads (last 7 days)
- Disk usage (documents, logs, database)
- Database connection pool utilization
- API response times (p50, p95, p99)
- Error rate

---

## Testing Strategy Summary

### Manual Testing Checklist
Each milestone includes specific manual test steps. For acceptance testing:
1. Start with anonymous user experience (M1)
2. Verify bootstrap user login (M2-4)
3. Complete full verifier flow (M5-8)
4. Test user profile management (M8.5)
5. Test all role-specific features (M9-12)
6. Verify comprehensive audit logging (M13)
7. Verify security features (M17)
8. Perform backup/recovery test (M16)
9. Verify monitoring and alerting (M20)

### Automated Testing Approach
- Unit tests: Run on every commit
- Integration tests: Run on every commit
- **E2E tests: Written alongside features in M3-M13, run before deployment**
- CI pipeline: Lint → TypeCheck → Unit Tests → Integration Tests → Build → E2E Tests
- Coverage requirements: >80% for critical paths

### Acceptance Criteria for Completion
- [ ] All milestones completed and tested (M0-M20)
- [ ] All automated tests passing (unit, integration, E2E)
- [ ] Security audit completed (M17)
- [ ] Performance benchmarks met (M20)
- [ ] Documentation complete (M19, including DATABASE.md and DATABASE_MIGRATIONS.md)
- [ ] Backup/recovery procedures tested (M16)
- [ ] Migration rollback tested (M16)
- [ ] Monitoring and alerting operational (M20)
- [ ] Production deployment successful (M15)
- [ ] User acceptance testing passed by stakeholders

---

## Development Phases

### Phase 1: Foundation (M0-M4)
Focus: Basic infrastructure, authentication, and basic audit logging
Timeline: First deliverable for user acceptance testing
Deliverable: Anonymous site + bootstrap user login with logout

### Phase 2: User Management (M5-M8.5)
Focus: Registration, verification flows, and profile management
Timeline: Second deliverable - verifier workflow and profile management testable
Deliverable:
- User registration with firstName, lastName, email, phone, unit
- Pending users blocked from login
- Verifier approval/denial with emails
- Verified user access
- Profile management with re-verification

### Phase 3: Core Features (M9-M12)
Focus: Committees, documents with restore, events with calendar, admin console with bulk operations
Timeline: Third deliverable - full feature set
Deliverable:
- Committee system with many-to-many membership
- Document management (upload, publish, archive, delete, restore, trash)
- Event calendar with proper date filtering
- Admin console with bulk operations, SystemConfig management, EmailTemplate management

### Phase 4: Production Ready (M13-M20)
Focus: Security, deployment, operations, performance, monitoring
Timeline: Final deliverable - production deployment
Deliverable:
- Comprehensive audit logging to /data/logs volume
- SSO authentication (Google, Microsoft)
- Containerized deployment with persistent volumes
- Automated encrypted backups with recovery procedures
- DATABASE_MIGRATIONS.md for production deployments
- Security hardening
- Testing infrastructure and CI/CD
- Complete documentation (DATABASE.md already done)
- Performance optimization and monitoring/alerting system

---

## Priority and Dependencies

### Critical Path
M0 → M1 → M2 → M3 → M4 → M5 → M6 → M7 → M8 → M8.5

This critical path delivers the three requested initial milestones plus profile management:
1. **Anonymous user version (M1)**: Public site with events
2. **Bootstrap user with magic-link login (M2-M4)**: Bootstrap user ("IVM Bootstrap User") can log in, see logout in menu
3. **Verifier flow (M5-M8)**: Complete registration → verification → login flow
4. **Profile management (M8.5)**: Users can update profiles with re-verification

**Key Changes from Original Design**:
- M2: Added firstName, lastName, SystemConfig, EmailTemplate models
- M3: Added rate limiting, email recovery, basic audit logging, pending user login blocked
- M4: Removed Calendar link (added in M11)
- M5: Added firstName, lastName to registration
- M6: Enhanced verifier notification with more details
- M7: Added denial email with next steps
- M8: Clarified past events definition (calendar month)
- **M8.5: New milestone for profile management**
- M10: Added restore functionality and committee trash
- M11: Added Calendar link to menu, clarified date filtering
- M12: Added bulk operations, SystemConfig UI, EmailTemplate UI
- M13: Enhanced audit logging with volume storage, robot detection, retention
- M15: Added /data/logs volume
- M16: Added DATABASE_MIGRATIONS.md, migration rollback tests
- M18: Clarified E2E tests written with features
- M20: Added comprehensive monitoring and alerting

### Parallel Development Opportunities
After M8.5, these can be developed in parallel:
- M9 (Committees) + M10 (Documents with restore)
- M11 (Events with calendar link) independent
- M12 (Admin console enhanced) depends on M9
- M13 (Comprehensive audit logging) can be developed alongside features (basic in M3)
- M14 (SSO) can be added after M3
- M15 (Containerization) can be developed early

### Sequential Requirements
Some milestones must be sequential:
- M16 (Backup) requires M15 (Containers) - needs volumes defined
- M17 (Security) should review all prior milestones - comprehensive security audit
- M18 (Testing) covers all prior milestones - test infrastructure and CI/CD
- M19 (Documentation) covers final state - complete docs
- M20 (Performance + Monitoring) requires complete system - final optimization

### Recommended Implementation Order
1. **Phase 1** (M0-M4): Foundation - ~2-3 weeks
2. **Phase 2** (M5-M8.5): User Management - ~2-3 weeks
3. **Phase 3** (M9-M12): Core Features - ~3-4 weeks
   - M9, M10 in parallel
   - M11 independent
   - M12 after M9
4. **Phase 4** (M13-M20): Production Ready - ~3-4 weeks
   - M13 (audit logging) alongside earlier phases
   - M14 (SSO) when ready
   - M15, M16 (deployment/backup) in sequence
   - M17, M18, M19, M20 (security, testing, docs, monitoring) toward end

**Total Estimated Timeline**: 10-14 weeks for full implementation

---

## Summary of Key Updates

All user feedback incorporated:

1. ✅ User model includes firstName, lastName, phone (required), unitNumber (alphanumeric, max 6 chars)
2. ✅ Pending users CANNOT log in (blocked at auth level with appropriate messaging)
3. ✅ SystemConfig and EmailTemplate models added for runtime configuration
4. ✅ Rate limiting implemented in M3 (not just tested)
5. ✅ 90-day session timeout (configurable by dbadmin)
6. ✅ Email recovery flow (partial email challenge or unit lookup)
7. ✅ Denial email with next steps
8. ✅ Profile management with re-verification and cancel option (M8.5)
9. ✅ Document restore functionality with committee-specific trash
10. ✅ Bulk operations for dbadmin
11. ✅ EmailTemplate management UI for dbadmin
12. ✅ SystemConfig management UI for dbadmin
13. ✅ Basic audit logging in M3, comprehensive in M13
14. ✅ Audit logs written to /data/logs volume
15. ✅ Anonymous logging with robot detection
16. ✅ Calendar link added in M11 (not M4)
17. ✅ Past events defined as "before current calendar month"
18. ✅ Failed email notifications to dbadmin
19. ✅ DATABASE.md created with complete schema documentation
20. ✅ DATABASE_MIGRATIONS.md created with deployment strategy
21. ✅ Migration rollback tests added to M16
22. ✅ E2E tests written alongside features (M3-M13)
23. ✅ Monitoring and alerting system in M20 with email notifications to dbadmin
24. ✅ All documents reference DATABASE.md and DATABASE_MIGRATIONS.md
