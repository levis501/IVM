# Milestone 2: Database Schema and Seed Data

**Status**: ✅ COMPLETED (2026-02-17)

**Goal**: Complete database schema with initial bootstrap user.

**Features**:
- Complete Prisma schema (User, Role, Committee, Document, Event, AuditLog, SystemConfig, EmailTemplate)
- User model includes: id, firstName, lastName, email, phone (required), unitNumber (alphanumeric max 6 chars), verificationStatus, roles, committees, timestamps
- Owner and resident status managed through roles (not boolean fields)
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
- User must have at least one role assigned

---

## Implementation Summary

**Completed**: 2026-02-17

### Database Schema
- Removed `isResident` and `isOwner` boolean fields from User model
- Owner and resident status now managed through roles ("owner" and "resident")
- All models properly indexed for performance
- Created migration: `20260217190845_remove_is_resident_is_owner_fields`

### Seed Data
Implemented idempotent seed script (`prisma/seed.ts`) that creates:

1. **7 Roles**:
   - dbadmin
   - publisher
   - calendar
   - verifier
   - user
   - owner
   - resident

2. **Bootstrap User**:
   - Name: IVM Bootstrap User
   - Email: indianvillagemanor+bootstrap@gmail.com
   - Unit: None
   - Roles: dbadmin, user, owner, verifier
   - Status: verified

3. **8 SystemConfig entries**:
   - session_timeout_days (90)
   - disk_alert_threshold_percent (85)
   - max_upload_size_mb (25)
   - audit_log_retention_days (365)
   - anonymous_log_retention_days (90)
   - rate_limit_login_attempts (5)
   - rate_limit_magic_link_requests (3)
   - failed_login_alert_threshold (3)

4. **6 EmailTemplate entries**:
   - magic-link
   - verifier-notification
   - approval
   - denial
   - profile-update-reverify
   - email-recovery-unit

### Verification
- All seed data created successfully
- Bootstrap user has correct name: firstName="IVM Bootstrap", lastName="User"
- All roles present in database
- Seed script is idempotent (tested with multiple runs)
- No duplicates created on repeated runs
