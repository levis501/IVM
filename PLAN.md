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
- Complete Prisma schema (User, Role, Committee, Document, Event, AuditLog)
- Seed script to create initial bootstrap user:
  - Name: "IVM bootstrap user"
  - Email: "indianvillagemanor+bootstrap@gmail.com"
  - Unit: "None"
  - Roles: dbadmin, user, owner, verifier
  - verificationStatus: "verified"
- Seed script to create initial roles in database
- Database constraints and validations

**Manual Tests**:
1. Run `npx prisma migrate dev` - migrations succeed
2. Run `npx prisma db seed` - seed data created
3. Use Prisma Studio to verify bootstrap user exists with correct attributes
4. Verify all roles exist in Role table
5. Verify all model relationships work correctly

**Automated Tests**:
- Migration scripts run without errors
- Seed script is idempotent (can run multiple times)
- Database constraints are enforced (unique email, required fields)
- Relationship queries work (user -> roles, committee -> documents, etc.)

---

## Milestone 3: Magic Link Authentication

**Goal**: Implement email magic-link authentication flow.

**Features**:
- NextAuth configuration with email provider
- Magic-link email template
- Login page with email input
- "Check your email" confirmation page
- Session management with secure cookies
- Logout functionality
- Email verification token generation and validation

**Manual Tests**:
1. Navigate to /login
2. Enter bootstrap user email
3. Receive magic-link email
4. Click magic-link - successfully authenticated
5. See hamburger menu with "Logout" option
6. Click logout - session ends, redirected to homepage
7. Verify expired/invalid tokens are rejected
8. Verify rate limiting on magic-link requests

**Automated Tests**:
- NextAuth provider configuration is valid
- Magic-link token generation and validation
- Session creation and destruction
- Protected route middleware works
- Email sending (mock in tests)
- Token expiration logic
- Rate limiting enforcement

---

## Milestone 4: Basic Menu and Navigation for Authenticated Users

**Goal**: Authenticated users see appropriate menu items based on their roles.

**Features**:
- Hamburger menu component
- Dynamic menu items based on authentication status:
  - Unauthenticated: "Login"
  - Authenticated: "Calendar", "Logout", committee links (if applicable)
- User context/session hook
- Role-based menu item visibility

**Manual Tests**:
1. Log in as bootstrap user
2. Open hamburger menu
3. Verify "Logout" is visible
4. Verify "Calendar" link is visible
5. Log out and verify menu shows only "Login"
6. Test menu on mobile and desktop

**Automated Tests**:
- Menu renders correct items for unauthenticated users
- Menu renders correct items for authenticated users
- Session hook returns correct user data
- Component tests for menu with different user states

---

## Milestone 5: User Registration Flow

**Goal**: New users can register with email, phone, unit number, and resident/owner status.

**Features**:
- Registration form with validation
- Zod schema for registration data
- Unit number validation (configurable pattern)
- Require at least one of isResident or isOwner
- Create user with verificationStatus = "pending"
- Registration confirmation page ("Verification required")
- Form validation and error handling

**Manual Tests**:
1. Navigate to /register
2. Fill in all required fields (email, phone, unit, check at least one of resident/owner)
3. Submit form - see "Verification required" message
4. Use Prisma Studio to verify user created with pending status
5. Test validation errors:
   - Missing required fields
   - Invalid email format
   - Neither resident nor owner selected
   - Invalid unit number
6. Verify duplicate email registration is rejected

**Automated Tests**:
- Registration form validation (Zod schema)
- API route creates user with correct data
- Duplicate email returns appropriate error
- Unit number validation logic
- At least one of isResident/isOwner is enforced
- User is created with pending verification status

---

## Milestone 6: Verifier Notification System

**Goal**: Users with verifier role receive email notifications when new users register.

**Features**:
- Email notification to all verifiers on new registration
- Email includes:
  - New user details (name, email, phone, unit, resident/owner)
  - Link to verification page
- Email template for verifier notification
- Queue system for email sending (or immediate with error handling)

**Manual Tests**:
1. Ensure bootstrap user has verifier role
2. Register a new user
3. Check that bootstrap user email receives notification
4. Verify email contains:
   - New user information
   - Link to verification page
5. Test with multiple verifiers - all receive email

**Automated Tests**:
- Email sent to all users with verifier role
- Email contains correct user information
- Verification link format is correct
- Email sending errors are handled gracefully
- Mock email service in tests

---

## Milestone 7: Verifier Approval/Denial Flow

**Goal**: Verifiers can approve or deny pending user registrations.

**Features**:
- Verifier dashboard listing pending registrations
- Verification page for individual registration:
  - Show user details
  - Approve button
  - Deny button
  - Comment field (optional)
- Update user verificationStatus to "verified" or "denied"
- Record verificationUpdatedAt, verificationUpdatedBy, verificationComment
- Send confirmation email to user upon approval
- Audit log entry for verification action

**Manual Tests**:
1. Log in as bootstrap user (verifier)
2. Navigate to verifier dashboard
3. See pending registration(s) from Milestone 5
4. Click on a pending user
5. Add comment "Verified as resident"
6. Click "Approve"
7. Verify user status updated to "verified" in database
8. Verify user receives confirmation email
9. Create another pending user, deny with comment
10. Verify denial is recorded correctly

**Automated Tests**:
- Only users with verifier role can access verifier dashboard
- Approve action updates user status correctly
- Deny action updates user status correctly
- Verification metadata (updatedAt, updatedBy, comment) is recorded
- Approval email is sent
- Audit log entry is created
- Non-verifiers cannot access verification endpoints

---

## Milestone 8: Verified User Access

**Goal**: Verified users can access protected areas of the site.

**Features**:
- Middleware to check verification status
- Verified users can access:
  - Published documents (when committees exist)
  - Past events (older than current month start)
  - User-only pages
- Pending/denied users see "Verification pending" or "Access denied" message
- Graceful error handling for unverified users

**Manual Tests**:
1. Log in as newly verified user from Milestone 7
2. Navigate to events - see all events (past and future)
3. Attempt to access user-only content - access granted
4. Log out and log in as a pending user
5. Attempt to access user-only content - see "Verification pending"
6. Log in as a denied user
7. Attempt to access user-only content - see appropriate message

**Automated Tests**:
- Middleware allows verified users through
- Middleware blocks pending users
- Middleware blocks denied users
- API routes respect verification status
- Correct error messages for unverified users

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

**Goal**: Publishers can upload, publish, archive, and delete documents for their committees.

**Features**:
- Document storage setup (mounted volume /data/documents)
- Document upload API with validation:
  - File type whitelist (pdf, jpg, png)
  - Size limit (25 MB)
  - Filename sanitization
- Publisher interface for document management
- Published documents visible to all verified users
- Archived documents hidden from public but retained
- Deleted documents moved to inaccessible area
- Audit log for all document actions

**Manual Tests**:
1. Log in as bootstrap user
2. Assign bootstrap user publisher role for "Board" committee
3. Navigate to Board committee page
4. Upload a PDF document
5. Mark document as published
6. Log in as different verified user - verify document is visible
7. Archive the document - verify it's no longer listed
8. Upload and delete a document - verify it's moved to deleted area
9. Verify audit logs record all actions
10. Test file validation:
    - Reject .exe file
    - Reject file over 25 MB
    - Accept valid PDF

**Automated Tests**:
- File upload validation (type, size)
- Filename sanitization
- Only publishers for committee can upload
- Published documents query returns correct results
- Archived documents are excluded from listings
- Deleted files are moved to correct location
- Audit log entries created for all document actions
- Storage path configuration works

---

## Milestone 11: Event Calendar System

**Goal**: Calendar role can manage events; public can view current/future events.

**Features**:
- Event CRUD interface for calendar role
- Event list page (public for current/future, authenticated for past)
- Event detail page
- Calendar view (optional - can be simple list first)
- Event creation/edit form with validation
- Date-based filtering for public vs. authenticated access
- Audit log for event actions

**Manual Tests**:
1. Log in as bootstrap user
2. Assign bootstrap user calendar role
3. Create a future event
4. Log out - verify future event is visible on public site
5. Log in and create a past event (last month)
6. Log out - verify past event is NOT visible
7. Log in as verified user - verify past event IS visible
8. Edit and delete events as calendar user
9. Verify non-calendar users cannot create/edit/delete events

**Automated Tests**:
- Only calendar role can create/edit/delete events
- Public API returns only current/future events
- Authenticated API returns all events for verified users
- Event date filtering logic
- Event validation (required fields, valid dates)
- Audit log entries for event actions
- Non-calendar users cannot access event management endpoints

---

## Milestone 12: Database Admin Console

**Goal**: Dbadmin role can manage user roles and committee memberships.

**Features**:
- User list page with search/filter
- User detail/edit page
- Role assignment interface
- Committee membership assignment interface
- Audit log for role/membership changes
- Only accessible to dbadmin role

**Manual Tests**:
1. Log in as bootstrap user (dbadmin)
2. Navigate to admin console
3. View list of all users
4. Select a user
5. Assign publisher role to user
6. Assign user to a committee
7. Verify changes are persisted
8. Verify audit log records changes
9. Log in as non-dbadmin user
10. Attempt to access admin console - access denied

**Automated Tests**:
- Only dbadmin can access admin console
- Role assignment API works correctly
- Committee membership API works correctly
- Multiple role assignment per user
- Multiple committee membership per user
- Audit log entries created
- Non-dbadmin cannot access admin endpoints
- Validation prevents invalid role/committee assignments

---

## Milestone 13: Audit Logging System

**Goal**: Comprehensive audit logging for all user actions and anonymous access.

**Features**:
- Middleware to log API requests
- Log structure: actor, unit, action, target, meta, timestamp
- Anonymous logging for:
  - Main page access
  - Public document access (e.g., QR-linked newsletters)
- Authenticated logging for:
  - Login/logout
  - Document actions (upload, publish, archive, delete)
  - Event actions (create, edit, delete)
  - Admin actions (role changes, membership changes)
  - Verification actions
- Audit log viewing interface (dbadmin only)
- Log retention configuration

**Manual Tests**:
1. Perform various actions as authenticated user
2. Access public pages as anonymous user
3. Log in as bootstrap user (dbadmin)
4. View audit logs
5. Verify logs contain:
   - Actor information (or "anonymous")
   - Action type
   - Target (document/event/user)
   - Timestamp
6. Filter logs by date, user, action type
7. Verify log retention configuration works

**Automated Tests**:
- Audit middleware logs all specified actions
- Anonymous logs include minimal data
- Authenticated logs include user and unit
- Log query functions work correctly
- Only dbadmin can view audit logs
- Log retention cleanup works (if implemented)

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
  - Uploaded documents
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
6. Upload a document - verify it persists after container restart
7. Create database data - verify it persists after container restart
8. Stop and start containers - verify data persistence
9. Check health endpoints

**Automated Tests**:
- Docker build succeeds
- docker-compose validation
- Container health checks pass
- Volume mounts work correctly
- Environment variables are loaded
- Application starts and responds to requests

---

## Milestone 16: Backup and Recovery

**Goal**: Automated backup of database and documents with recovery procedures.

**Features**:
- Backup script for:
  - PostgreSQL dump
  - Document volume snapshot
- Configurable backup schedule (cron)
- Off-site backup storage (Google Drive, S3, or similar)
- Backup retention policy (30-day rotation)
- Recovery documentation and scripts
- Backup verification (periodic restore tests)
- Encrypted backups

**Manual Tests**:
1. Run backup script manually
2. Verify backup files created in expected location
3. Verify backups uploaded to off-site storage
4. Perform recovery test:
   - Stop containers
   - Clear volumes
   - Restore from backup
   - Start containers
   - Verify data is restored correctly
5. Test automated backup schedule (wait for cron trigger)
6. Verify old backups are cleaned up per retention policy

**Automated Tests**:
- Backup script completes successfully
- Backup files have expected format and content
- Database restore from backup works
- File restoration from backup works
- Backup verification logic
- Retention cleanup removes old backups
- Encryption of backups (if implemented)

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

## Milestone 18: Testing Infrastructure

**Goal**: Comprehensive test suite with good coverage.

**Features**:
- Unit tests for:
  - Validation schemas (Zod)
  - Utility functions
  - Role checking logic
  - Date filtering logic
- Integration tests for:
  - API routes
  - Database operations
  - Authentication flows
  - Authorization checks
- E2E tests for:
  - Registration flow
  - Magic-link login
  - SSO login
  - Document upload
  - Event creation
  - Verifier flow
  - Admin operations
- Test coverage reporting
- CI pipeline integration

**Manual Tests**:
1. Run `npm test` - all tests pass
2. Run `npm run test:e2e` - E2E tests pass
3. Review coverage report - verify >80% coverage
4. Run tests in CI - verify pipeline passes

**Automated Tests**:
- (This milestone IS the automated tests)
- All critical paths have test coverage
- Tests run in CI on every commit
- Coverage thresholds enforced

---

## Milestone 19: Documentation and Operations Guide

**Goal**: Complete documentation for developers and operators.

**Features**:
- README.md with:
  - Project overview
  - Setup instructions
  - Environment variables
  - Development workflow
- DEPLOYMENT.md with:
  - Deployment steps
  - Environment configuration
  - Docker commands
  - Troubleshooting
- OPERATIONS.md with:
  - Backup and recovery procedures
  - Monitoring recommendations
  - Log locations
  - Common administrative tasks
- API documentation
- Database schema documentation
- Code comments for complex logic

**Manual Tests**:
1. Follow README setup instructions on fresh machine
2. Follow DEPLOYMENT.md to deploy to staging environment
3. Use OPERATIONS.md to perform common tasks
4. Verify all environment variables are documented
5. Review API documentation for completeness

**Automated Tests**:
- Documentation link checker
- Code examples in docs are valid
- Environment variable documentation matches code

---

## Milestone 20: Performance and Optimization

**Goal**: Optimize application performance for production use.

**Features**:
- Database query optimization
  - Proper indexes
  - Query analysis and optimization
  - N+1 query prevention
- Caching strategy:
  - Static page caching
  - API response caching (where appropriate)
  - Database query caching
- Image optimization
- Code splitting and lazy loading
- CDN setup for static assets (optional)
- Performance monitoring
- Disk usage monitoring and alerts

**Manual Tests**:
1. Use Lighthouse to audit performance
2. Test page load times
3. Monitor database query performance
4. Upload large document (within limit) - verify reasonable upload time
5. Load page with many documents - verify performant
6. Check memory usage over time
7. Monitor disk usage with many uploads

**Automated Tests**:
- Performance benchmarks for critical paths
- Database query performance tests
- Load testing for API endpoints
- Memory leak tests

---

## Testing Strategy Summary

### Manual Testing Checklist
Each milestone includes specific manual test steps. For acceptance testing:
1. Start with anonymous user experience (M1)
2. Verify bootstrap user login (M2-4)
3. Complete full verifier flow (M5-8)
4. Test all role-specific features (M9-12)
5. Verify security features (M17)
6. Perform backup/recovery test (M16)

### Automated Testing Approach
- Unit tests: Run on every commit
- Integration tests: Run on every commit
- E2E tests: Run before deployment
- CI pipeline: Lint → TypeCheck → Unit Tests → Integration Tests → Build → E2E Tests
- Coverage requirements: >80% for critical paths

### Acceptance Criteria for Completion
- [ ] All milestones completed and tested
- [ ] All automated tests passing
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Backup/recovery procedures tested
- [ ] Production deployment successful
- [ ] User acceptance testing passed by stakeholders

---

## Development Phases

### Phase 1: Foundation (M0-M4)
Focus: Basic infrastructure and authentication
Timeline: First deliverable for user acceptance testing

### Phase 2: User Management (M5-M8)
Focus: Registration and verification flows
Timeline: Second deliverable - verifier workflow testable

### Phase 3: Core Features (M9-M12)
Focus: Committees, documents, events, admin
Timeline: Third deliverable - full feature set

### Phase 4: Production Ready (M13-M20)
Focus: Security, deployment, operations, performance
Timeline: Final deliverable - production deployment

---

## Priority and Dependencies

### Critical Path
M0 → M1 → M2 → M3 → M4 → M5 → M6 → M7 → M8

This critical path delivers the three requested initial milestones:
1. Anonymous user version (M1)
2. Bootstrap user with magic-link login (M2-M4)
3. Verifier flow (M5-M8)

### Parallel Development Opportunities
After M8, these can be developed in parallel:
- M9 (Committees) + M10 (Documents)
- M11 (Events) independent
- M13 (Audit Logging) can be developed alongside features
- M15 (Containerization) can be developed early
- M14 (SSO) can be added after M3

### Final Phase Requirements
M17 (Security) should review all prior milestones
M18 (Testing) covers all prior milestones
M16 (Backup) requires M15 (Containers)
M19 (Documentation) covers final state
M20 (Performance) requires complete system
