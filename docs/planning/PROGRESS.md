# Indian Village Manor - Development Progress

## Overview
This document tracks the completion status of all milestones in the Indian Village Manor project implementation.

**Last Updated**: 2026-02-17

---

## Phase 1: Foundation (M0-M4)

### M00: Project Setup
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17
**Key Deliverables**:
- [x] Next.js project with TypeScript
- [x] TailwindCSS configuration
- [x] PostgreSQL database (local + Docker)
- [x] Prisma initialization
- [x] Nodemailer configuration
- [x] Basic project structure
- [x] docker-compose.yml

---

### M01: Anonymous User Experience
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17

**Goal**: Create a single long scrollable home page matching the reference project exactly in look, feel, and responsive behavior.

**Key Deliverables**:
- [x] Responsive grid layout system (WindowContext, WindowWithSize, 6 grid components)
- [x] Hamburger menu navigation with fixed header
- [x] Six content sections (Home, Interiors1, Amenities, Floor Plans, Interiors2, Contact)
- [x] Modal component for zooming floor plan graphics
- [x] All image assets copied from reference (18 images)
- [x] Exact styling match (IVM green theme, Noto Serif font, responsive behavior)
- [x] Stub authentication (login menu item disabled)

**Reference**: `/home/levis/Development/IVM/IndianVillageManor/ivm_app`

**Issues Resolved**:
- next-auth peer dependency conflict (resolved with --legacy-peer-deps)
- React hydration mismatch in WindowWithSize (fixed with default rendering)
- NextAuth SESSION_FETCH_ERROR (fixed with stub API route)
- Modal image 400 error (fixed with early return)
- Tailwind border-border class error (removed from CSS)

**Details**: See [M01-anonymous-user-experience.md](./M01-anonymous-user-experience.md)

---

### M02: Database Schema and Seed Data
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17

**Goal**: Complete database schema with initial bootstrap user and seed data.

**Key Deliverables**:
- [x] Complete Prisma schema with all models (User, Role, Committee, Document, Event, AuditLog, SystemConfig, EmailTemplate)
- [x] Migration files (removed isResident/isOwner boolean fields, replaced with role-based approach)
- [x] Seed script with bootstrap user
- [x] 7 standard roles (dbadmin, publisher, calendar, verifier, user, owner, resident)
- [x] 8 SystemConfig defaults
- [x] 6 EmailTemplate defaults
- [x] Idempotent seed script (can run multiple times safely)

**Issues Resolved**:
- Schema alignment: Removed `isResident` and `isOwner` boolean fields in favor of role-based approach
- Created migration: `20260217190845_remove_is_resident_is_owner_fields`
- Seed script successfully creates bootstrap user with email: indianvillagemanor+bootstrap@gmail.com
- All database indexes properly configured for performance
- Verified idempotency of seed script (no duplicates on repeated runs)

**Details**: See [M02-database-schema-seed.md](./M02-database-schema-seed.md)

---

### M03: Magic Link Authentication and Basic Audit Logging
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17

**Goal**: Implement email magic-link authentication flow with rate limiting and basic audit logging.

**Key Deliverables**:
- [x] NextAuth configuration with email provider
- [x] Magic-link email template (from EmailTemplate table)
- [x] Login page with email input
- [x] "Check your email" confirmation page
- [x] Auth error page for pending/denied users
- [x] Session management with secure HTTP-only cookies
- [x] Logout functionality in header menu
- [x] Email verification token generation and validation
- [x] Rate limiting for login and magic-link requests
- [x] Pending users blocked from logging in with appropriate message
- [x] Email recovery flow (unit number lookup)
- [x] Basic audit logging to /data/logs volume
- [x] Failed login attempt tracking
- [x] Session timeout configured via SystemConfig (90 days)

**Database Changes**:
- Added NextAuth tables: Account, Session, VerificationToken
- Updated User model with accounts and sessions relations
- Updated AuditLog model schema (entityType, entityId, details, ipAddress, userAgent)

**New Files Created**:
- `lib/auth.ts` - NextAuth configuration and callbacks
- `lib/audit.ts` - Audit logging utility with file and database writes
- `types/next-auth.d.ts` - TypeScript type declarations for NextAuth
- `app/auth/login/page.tsx` - Login page with email input
- `app/auth/verify-request/page.tsx` - Confirmation page after magic link sent
- `app/auth/error/page.tsx` - Error page for auth failures
- `app/auth/forgot-email/page.tsx` - Email recovery by unit number
- `app/api/auth/recover-email/route.ts` - Email recovery API endpoint

**Issues Resolved**:
- Fixed Prisma import to use named exports `{ prisma }`
- Fixed TypeScript linting errors (removed `any` types, unused parameters)
- Fixed ESLint errors (replaced `<a>` with `<Link>`, escaped entities)
- Wrapped useSearchParams in Suspense boundary for error page
- Fixed Prisma JSON type casting for audit log details

**Details**: See [M03-magic-link-auth-audit.md](./M03-magic-link-auth-audit.md)

---

### M04: Basic Menu and Navigation for Authenticated Users
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17

**Goal**: Authenticated users see appropriate menu items based on their roles and verification status.

**Key Deliverables**:
- [x] Dynamic menu items based on authentication status
- [x] Logout functionality in hamburger menu
- [x] User info displayed when signed in
- [x] Committee links infrastructure (API endpoint for visible committees)
- [x] Role-based committee visibility rules implemented
- [x] Verified Calendar link is NOT present (will be added in M11)
- [x] Improved menu UX (full-width clickable areas, hover states, click-outside-to-close)
- [x] Session-based auto-open menu on fresh login

**New Files Created**:
- `app/api/committees/visible/route.ts` - API endpoint for fetching user's visible committees

**Files Modified**:
- `components/site_menu.tsx` - Added committee fetching and display logic, improved UX
- `components/SessionProviderWrapper.tsx` - Added SessionTracker for fresh login detection

**Committee Visibility Rules Implemented**:
- Show committees with published documents (visible to all verified users)
- Show committees where user is a member (visible even if no published docs)
- Show committees where user has publisher role (visible even if no published docs)

**Manual Test Results**:
- ✅ Bootstrap user can log in and see Logout button
- ✅ Calendar link is NOT present (will be added in M11)
- ✅ Unauthenticated users see only Login link
- ✅ Menu is responsive on mobile and desktop
- ✅ Pending users cannot log in (tested in M03)
- ✅ Click outside menu closes it
- ✅ Menu auto-opens only on fresh login, not on every page load

**Notes**:
- No committees exist yet in seed data (will be created in M09)
- Committee links section will appear empty until committees are created
- Menu UX significantly improved with full-width hit areas and hover feedback
- Semi-transparent overlay provides clear visual feedback

**Details**: See [M04-menu-navigation.md](./M04-menu-navigation.md)

---

## Phase 2: User Management (M5-M8.5)

### M05: User Registration Flow
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17

**Goal**: New users can register with required information and receive confirmation of pending verification status.

**Key Deliverables**:
- [x] Registration form with validation (firstName, lastName, email, phone, unit, resident/owner checkboxes)
- [x] Zod schema for registration data validation
- [x] Required fields validation enforced
- [x] Unit number validation (alphanumeric, max 6 characters)
- [x] At least one role (resident/owner) required
- [x] Create user with verificationStatus = "pending"
- [x] Registration confirmation page with clear messaging
- [x] Form validation and error handling
- [x] Duplicate email detection
- [x] Register link added to site menu for unauthenticated users
- [x] Register link added to login page

**New Files Created**:
- `lib/validation.ts` - Zod validation schema for registration
- `app/register/page.tsx` - Registration form
- `app/register/confirmation/page.tsx` - Registration confirmation page
- `app/api/auth/register/route.ts` - Registration API endpoint

**Files Modified**:
- `components/site_menu.tsx` - Added Register link for unauthenticated users
- `app/auth/login/page.tsx` - Added "Create an account" link

**Technical Notes**:
- Uses role-based system (resident/owner roles) instead of boolean fields (isResident/isOwner)
- Unit numbers are normalized to uppercase during registration
- Roles are assigned via many-to-many relationship with Role table
- Zod safeParse used for validation with detailed error messages
- All validation errors properly displayed to users

**Manual Test Results**:
- ✅ Registration form accessible at /register
- ✅ All required fields validated (firstName, lastName, email, phone, unit)
- ✅ At least one of resident/owner checkbox required
- ✅ Unit number validation works (alphanumeric, max 6 chars)
- ✅ Duplicate email detection works
- ✅ Users created with pending verification status
- ✅ Roles (resident, owner, or both) properly assigned
- ✅ Confirmation page displays appropriate message
- ✅ Pending users cannot log in (enforced by M03)

**Issues Resolved**:
- Fixed Zod validation error handling by using safeParse instead of parse
- Corrected Zod error property (issues instead of errors)
- Added zod package to dependencies

**Details**: See [M05-user-registration.md](./M05-user-registration.md)

---

### M06: Verifier Notification System
**Status**: ✅ Completed
**Started**: 2026-02-17
**Completed**: 2026-02-17
**Key Deliverables**:
- [x] `lib/notifications.ts` with `sendVerifierNotification` function
- [x] Email notification to all verified users with verifier role on new registration
- [x] Email uses `verifier-notification` template from EmailTemplate table
- [x] Notification includes: firstName, lastName, email, phone, unit, resident/owner status, verification link
- [x] Verification link points to `/admin/verify` (to be implemented in M07)
- [x] Failed email notification sent to all dbadmin users
- [x] All notification actions logged to AuditLog
- [x] Notification is non-blocking (registration succeeds even if email fails)

**New Files Created**:
- `lib/notifications.ts` - `sendVerifierNotification` and `notifyDbAdminOfEmailFailure` functions

**Files Modified**:
- `app/api/auth/register/route.ts` - Added `sendVerifierNotification` call after user creation; fixed pre-existing missing `success` field in `logAuditEvent` call

**Technical Notes**:
- Notification is fire-and-forget (non-blocking) so registration API response is not delayed by email sending
- Only `verified` users with `verifier` role receive notifications (not pending/denied verifiers)
- isResident/isOwner status derived from user's roles array (matches role-based schema)
- dbadmin fallback alert uses inline email body (no template required for this edge case)

**Issues Resolved**:
- Pre-existing TypeScript error in `register/route.ts`: `logAuditEvent` call was missing required `success: boolean` field (fixed as part of this milestone)

---

### M07: Verifier Approval/Denial Flow
**Status**: ⬜ Not Started
**Started**: -
**Completed**: -
**Key Deliverables**:
- [ ] Approval workflow
- [ ] Denial workflow with email
- [ ] Status updates

---

### M08: Verified User Access
**Status**: ⬜ Not Started
**Started**: -
**Completed**: -
**Key Deliverables**:
- [ ] Verified user access controls
- [ ] Past events access (calendar month)

---

### M08.5: User Profile Management
**Status**: ⬜ Not Started
**Started**: -
**Completed**: -
**Key Deliverables**:
- [ ] Profile edit page
- [ ] Re-verification on email/phone change
- [ ] Profile update validation

---

## Phase 3: Core Features (M9-M12)

### M09: Committee System
**Status**: ⬜ Not Started
**Started**: -
**Completed**: -
**Key Deliverables**:
- [ ] Committee CRUD operations
- [ ] Many-to-many membership
- [ ] Committee permissions

---

### M10: Document Publishing System
**Status**: ⬜ Not Started
**Started**: -
**Completed**: -
**Key Deliverables**:
- [ ] Document upload
- [ ] Publish/archive/delete workflow
- [ ] Restore functionality
- [ ] Committee trash

---

### M11: Event Calendar System
**Status**: ⬜ Not Started
**Started**: -
**Completed**: -
**Key Deliverables**:
- [ ] Event CRUD operations
- [ ] Calendar view with date filtering
- [ ] Calendar link in menu

---

### M12: Database Admin Console
**Status**: ⬜ Not Started
**Started**: -
**Completed**: -
**Key Deliverables**:
- [ ] Admin console interface
- [ ] Bulk operations
- [ ] SystemConfig management UI
- [ ] EmailTemplate management UI

---

## Phase 4: Production Ready (M13-M20)

### M13: Comprehensive Audit Logging System
**Status**: ⬜ Not Started
**Started**: -
**Completed**: -
**Key Deliverables**:
- [ ] Enhanced audit logging
- [ ] Volume storage (/data/logs)
- [ ] Robot detection
- [ ] Log retention policy

---

### M14: SSO Authentication
**Status**: ⬜ Not Started
**Started**: -
**Completed**: -
**Key Deliverables**:
- [ ] Google SSO
- [ ] Microsoft SSO
- [ ] SSO configuration

---

### M15: Containerization and Deployment
**Status**: ⬜ Not Started
**Started**: -
**Completed**: -
**Key Deliverables**:
- [ ] Docker containerization
- [ ] Persistent volumes
- [ ] /data/logs volume
- [ ] Deployment configuration

---

### M16: Backup and Recovery
**Status**: ⬜ Not Started
**Started**: -
**Completed**: -
**Key Deliverables**:
- [ ] Automated encrypted backups
- [ ] Recovery procedures
- [ ] DATABASE_MIGRATIONS.md
- [ ] Migration rollback tests

---

### M17: Security Hardening
**Status**: ⬜ Not Started
**Started**: -
**Completed**: -
**Key Deliverables**:
- [ ] Comprehensive security audit
- [ ] Security hardening implementation
- [ ] Security documentation

---

### M18: Testing Infrastructure and Coverage
**Status**: ⬜ Not Started
**Started**: -
**Completed**: -
**Key Deliverables**:
- [ ] Test infrastructure setup
- [ ] CI/CD pipeline
- [ ] E2E tests for all features
- [ ] Test coverage reporting

---

### M19: Documentation and Operations Guide
**Status**: ⬜ Not Started
**Started**: -
**Completed**: -
**Key Deliverables**:
- [ ] Complete documentation
- [ ] Operations guide
- [ ] DATABASE.md (already complete)
- [ ] Deployment procedures

---

### M20: Performance Optimization and Monitoring
**Status**: ⬜ Not Started
**Started**: -
**Completed**: -
**Key Deliverables**:
- [ ] Performance optimization
- [ ] Monitoring system
- [ ] Alerting system
- [ ] Performance benchmarks

---

## Summary Statistics

**Total Milestones**: 21 (M00-M20)
**Completed**: 7 (M00, M01, M02, M03, M04, M05, M06)
**In Progress**: 0
**Not Started**: 14
**Overall Progress**: 33%

---

## Current Phase
**Phase 2: User Management** - In progress. Registration and verifier notification complete.

## Next Steps
1. Continue Phase 2: User Management
2. Start M07: Verifier Approval/Denial Flow
   - Build verifier interface at `/admin/verify`
   - Allow verifiers to approve or deny pending users
   - Send approval/denial email to user (templates already seeded in EmailTemplate table)

---

## Status Legend
- ⬜ Not Started
- 🔄 In Progress
- ✅ Completed
- ⚠️ Blocked
- 🔍 Under Review
