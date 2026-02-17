# Indian Village Manor - Design Specification

Purpose
-------
A concise, developer-oriented design document for the Indian Village Manor website (8120 E Jefferson Ave, Detroit, MI 48214). This replaces earlier drafts and is written so engineers can implement, test, and operate the system.

Summary (high level)
--------------------
- Static marketing site + authenticated resident/owner portal.
- Authentication: SSO (multiple providers) with email magic-link fallback.
- Roles: resident, owner, dbadmin, publisher, calendar, verifier.
- Features: user registration, document publishing per-committee, event calendar, audit logs, containerized deployment with persistent volume and backups.
- Tech stack (baseline): Next.js, NextAuth, TailwindCSS, Zod, PostgreSQL, Prisma, nodemailer.

Goals and Scope
---------------
- Public: marketing pages, current and future events, contact info, floorplans.
- Authenticated users: access to published documents, member-only past events, publisher and calendar management UIs.
- Admin: dbadmin can modify roles and committee membership.
- Persistent file storage via container-mounted volume; periodic off-site backups.

Primary Business Rules
----------------------
1. Registration requires: unit number, phone, email, and at least one of {resident, owner}.
2. Roles and committee membership can only be changed by dbadmin.
3. A user may belong to multiple committees.
4. Only published documents are visible to logged-in users; non-logged-in users cannot access user-only areas.
5. Public view: current and future events are public; past-month events require login.
6. Publisher role is scoped to committee(s) - publishers for a committee can upload, archive, or delete that committee's documents.
7. Menu behavior:
   - Non-logged-in: hamburger shows Login.
   - Logged-in: menu shows Calendar and links to committee pages that either (a) have at least one published document, or (b) the user is a publisher or member of (even if empty).
8. Audit log: every user action is recorded with user name and unit (or anonymous), action type, file(s), and extra metadata.
   - Anonymous logs exist only for access to the main page and externally linked documents (e.g., QR-linked newsletters).
9. Registration verification:
  - New registrations are placed in a pending verification state.
  - Verifiers can approve or deny a registration and leave a comment.
  - Verified users can access all user-only areas.

Data Model (recommended / Prisma style)
--------------------------------------

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  phone         String?
  unitNumber    String
  isResident    Boolean
  isOwner       Boolean
  verificationStatus String // pending, verified, denied
  verificationUpdatedAt DateTime?
  verificationUpdatedBy String?
  verificationComment  String?
  roles         Role[]   @relation("UserRoles")
  committees    Committee[] @relation("Memberships")
  createdAt     DateTime @default(now())
}

model Role {
  id    String @id @default(uuid())
  name  String @unique // dbadmin, publisher, calendar, verifier
}

model Committee {
  id          String   @id @default(uuid())
  name        String
  description String?
  members     User[]   @relation("Memberships")
  documents   Document[]
}

model Document {
  id           String   @id @default(uuid())
  committeeId  String   @relation(fields: [committeeId], references: [id])
  title        String
  filename     String   // path within mounted volume
  published    Boolean  @default(false)
  archived     Boolean  @default(false)
  uploadedBy   String
  uploadedAt   DateTime @default(now())
}

model Event {
  id          String   @id @default(uuid())
  title       String
  description String?
  startAt     DateTime
  endAt       DateTime?
  createdBy   String
  createdAt   DateTime @default(now())
}

model AuditLog {
  id         String   @id @default(uuid())
  actor      String?  // name and unit or "anonymous"
  unit       String?
  action     String
  target     String?  // filename / event id / api route
  meta       Json?
  createdAt  DateTime @default(now())
}

Key constraints
- Users must have isResident OR isOwner (validation at registration).
- Publisher permissions are scoped to specific committees.

Authentication and Authorization
--------------------------------
- Primary: OAuth SSO providers (configurable list) via NextAuth.
- Fallback: email magic-link (nodemailer).
- Registration flow:
  - Validate unit exists pattern (configurable regex or list).
  - Require email, phone, unit, and at least one of resident or owner.
  - New registrations are pending verification.
  - Email all users with verifier role about the registration attempt, including a link to verify or deny the user.
  - After initial registration, show a message that verification is required before full access.
  - Upon approval, send a verification email to the user and unlock all user-only areas.
- Session rules: secure HTTP-only cookies; session expiry configurable.
- Authorization: middleware in Next.js API routes and page-level checks using role membership and committee associations.

Document Lifecycle and Storage
-------------------------------
- Storage: mounted container volume (e.g., /data/documents) for persistent files.
- Published = accessible via public URL; archived = retained on volume but not listed publicly; deleted = moved to web-inaccessible area within the same volume.
- Upload controls: file type whitelist (pdf, jpg, png), size limit (e.g., 25 MB), virus/scan check recommended.
- UI: publisher on a committee sees Upload, Archive, and Delete actions on that committee's page.

Event Calendar
--------------
- Public: current and future events viewable by anyone.
- Protected: past events (older than start of current month) require login.
- Calendar role: full CRUD on events via UI and API.

Audit and Logging
-----------------
- Log structure: actor (or anonymous), unit (if any), action, target, meta, timestamp.
- Anonymous logs are limited to main-page and external-document access.
- Retention: configurable (recommend 12 months for audit logs; 90 days for anonymous access logs).

Backup and Deployment
---------------------
- Containerized deployment (Docker or Docker Compose).
- Nginx reverse proxy to route requests to the app and static assets.
- HTTPS: automatically configure and renew certificates via Let's Encrypt when HTTPS is not already enabled.
- Persistent external volume mounts for:
  - PostgreSQL data
  - Uploaded documents
  - Optional: server settings or config
- Backup strategy: periodic snapshot copy of mounted volume to off-site (e.g., Google Drive or S3). Recommend daily incremental and weekly full; keep 30-day rotation.
- Environment vars: DATABASE_URL, NEXTAUTH_URL, SMTP_URL, STORAGE_PATH, BACKUP_CRON, etc.


Testing, CI, and Quality
------------------------
- Unit tests: auth logic, role checks, form validation (Zod).
- Integration tests: document upload, event CRUD, menu visibility rules.
- E2E: registration and magic-link login, SSO flows.
- CI pipeline: lint, typecheck, tests, build, produce container image.

Operational and Security Notes
------------------------------
- Validate and sanitize all file names and user input.
- Rate-limit login and magic-link requests.
- Ensure backups are encrypted and access-controlled.
- Limit access to volumes and database credentials.
- Monitor disk usage for upload volume; alert when near capacity.

Migration and Reuse
-------------------
- Reuse code from IndianVillageManor/ivm_app (Next.js + NextAuth + Prisma).
- Provide scripts to migrate Users, Committees, Documents, and Events into the new schema.

MVP Checklist (priority)
------------------------
1. Public static site + current and future events display.
2. Registration + magic-link login flow.
3. Logged-in user access to published documents.
4. Publisher upload, archive, delete for committee documents.
5. Calendar CRUD for events.
6. Dbadmin console for role and committee assignments.
7. Containerized deployment + persistent volume + nightly backup.

Acceptance Criteria
-------------------
- Users can register and login via magic-link and SSO with fallback.
- New registrations are pending until a verifier approves or denies them.
- Verifiers receive email notifications with links to approve or deny registrations.
- Verified users receive a confirmation email and gain access to all user-only areas.
- Publishers can upload and archive documents for their committees only.
- Events: public current and future; past-month events require login.
- Audit logs record every publish, archive, delete, and login activity.
- Backups complete on the configured schedule and are restorable.

Open Questions / Configurable Items
-----------------------------------
- Exact list of SSO providers to support (Google, Microsoft, etc.).
- Retention and archival policy for audit logs and documents.
- Max allowed upload size and exact permitted file types.
- Unit-number validation rules or canonical unit list.

Implementation Notes / Next Tasks
---------------------------------
1. Create Prisma schema models and run migrations.
2. Implement NextAuth with SSO + magic-link and add validation on registration.
3. Build committee and document UI and APIs with role checks.
4. Add audit logging middleware for common actions.
5. Add container + volume compose file and backup cron job.
