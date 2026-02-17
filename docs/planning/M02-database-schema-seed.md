# Milestone 2: Database Schema and Seed Data

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
