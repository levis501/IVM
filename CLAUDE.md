# CLAUDE.md - Agent Navigation Guide

This document helps AI agents quickly understand and navigate the Indian Village Manor (IVM) project.

## Project Overview

**Indian Village Manor Community Website** - A Next.js-based HOA community website with role-based access control, document management, event calendar, and user verification workflows.

**Project Type**: Private HOA community portal
**Current Status**: Phase 1 - Foundation (3 of 21 milestones completed)
**Current Branch**: `m00`
**Bootstrap User Email**: `indianvillagemanor+bootstrap@gmail.com`

## Quick Reference

### Essential Files
- `README.md` - Setup instructions and basic project info
- `DESIGN.md` - Complete design specification
- `DATABASE.md` - Comprehensive database schema documentation
- `docs/planning/PROGRESS.md` - Current milestone status and next steps
- `docs/planning/00-overview.md` - All milestone descriptions
- `prisma/schema.prisma` - Database schema (User, Role, Committee, Document, Event, AuditLog, SystemConfig, EmailTemplate)

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (via Docker) + Prisma ORM
- **Styling**: TailwindCSS
- **Email**: Nodemailer
- **Authentication**: NextAuth (magic link + SSO planned for M14)

### Project Structure
```
/home/levis/Development/IVM/
├── app/                    # Next.js App Router pages
│   ├── globals.css        # TailwindCSS styles (IVM green theme)
│   ├── layout.tsx         # Root layout with WindowContext
│   └── page.tsx           # Home page (long scroll, 6 sections)
├── components/            # React components
│   ├── Logo.tsx          # IVM logo component
│   ├── Modal.tsx         # Zoom modal for images
│   ├── HeaderSection.tsx # Fixed header with hamburger menu
│   └── window/           # Grid system components
├── lib/                   # Utilities
│   ├── prisma.ts         # Prisma client singleton
│   └── email.ts          # Nodemailer setup
├── prisma/               # Database
│   ├── schema.prisma     # Schema (8 models)
│   ├── seed.ts           # Idempotent seed script
│   └── migrations/       # Migration history
├── docs/planning/        # Milestone documentation (M00-M20)
└── public/images/        # Image assets (18 images from reference)
```

## Development Workflow

### Starting Development
```bash
docker-compose up -d           # Start PostgreSQL
npm install                    # Install dependencies
npx prisma migrate dev         # Run migrations
npx prisma db seed             # Seed database (idempotent)
npx prisma generate            # Generate Prisma client
npm run dev                    # Start dev server (localhost:3000)
```

### Database Management
```bash
npx prisma studio              # View data in browser
npx prisma migrate dev --name <name>  # Create new migration
npx prisma db seed             # Re-run seed (safe, idempotent)
```

### Git Workflow
- Main branch is not configured yet (empty)
- Current working branch: `m00`
- Use feature branches for milestones: `m03`, `m04`, etc.
- Git auto-approve is enabled in VSCode settings

## Milestone System

The project follows a **21-milestone** implementation plan (M00-M20) across 4 phases:

### Phase 1: Foundation (M00-M04)
- **M00**: Project Setup ✅
- **M01**: Anonymous User Experience ✅
- **M02**: Database Schema and Seed Data ✅
- **M03**: Magic Link Authentication ⬜ *(NEXT)*
- **M04**: Menu and Navigation ⬜

### Phase 2: User Management (M05-M08.5)
Covers registration, verification workflow, profile management

### Phase 3: Core Features (M09-M12)
Committees, documents, calendar, admin console

### Phase 4: Production Ready (M13-M20)
Audit logging, SSO, containerization, security, testing, monitoring

**See**: `docs/planning/PROGRESS.md` for complete status and `docs/planning/00-overview.md` for all milestones.

## Database Schema Overview

### Core Models
1. **User** - firstName, lastName, email, phone, unitNumber, verificationStatus (pending/verified/denied)
2. **Role** - name (dbadmin, publisher, calendar, verifier, user, owner, resident)
3. **Committee** - name, description, members (many-to-many with User)
4. **Document** - committeeId, title, description, file path, status (draft/published/archived/deleted)
5. **Event** - title, description, start/end times, location
6. **AuditLog** - Tracks all important actions (userId, action, entityType, entityId, details, ipAddress, userAgent)
7. **SystemConfig** - Key-value config (site title, email settings, rate limits, etc.)
8. **EmailTemplate** - Reusable email templates (magic link, verification, approval, denial, etc.)

**Important**: Users have roles via many-to-many relationship. No `isResident` or `isOwner` boolean fields (removed in migration `20260217190845`).

## Key Design Patterns

### Role-Based Access Control
- 7 standard roles seeded automatically
- Many-to-many User-Role relationship
- Check role membership in middleware/API routes

### Verification Workflow
1. User registers (status: "pending")
2. Verifier receives notification
3. Verifier approves/denies user
4. User status updates to "verified" or "denied"
5. Email sent to user with outcome

### Document Lifecycle
- States: draft → published → archived → deleted
- Deleted documents go to "committee trash" (restorable)
- Uses soft delete pattern

### Audit Logging
- Log all sensitive operations
- Track: userId, action, entityType, entityId, metadata JSON
- Include ipAddress and userAgent for security
- Will move to volume storage (/data/logs) in M13

## Reference Project

The UI design is based on an existing Angular project:
- **Location**: `/home/levis/Development/IVM/IndianVillageManor/ivm_app` (symlinked as `./IndianVillageManor`)
- **Goal**: Match look, feel, and responsive behavior exactly
- **Current Status**: M01 completed with exact visual match

## Common Tasks for Agents

### Reading Project Status
1. Check `docs/planning/PROGRESS.md` for current milestone
2. Read the specific milestone doc in `docs/planning/M##-*.md`
3. Review DATABASE.md if database changes needed

### Starting a New Milestone
1. Read milestone doc: `docs/planning/M##-*.md`
2. Update PROGRESS.md status to "In Progress"
3. Create feature branch if needed
4. Implement features per milestone requirements
5. Run manual tests listed in milestone doc
6. Update PROGRESS.md with completion status

### Database Changes
1. Modify `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name descriptive_name`
3. Update `DATABASE.md` if schema significantly changes
4. Update seed script if needed for new data
5. Test migration with fresh database

### Adding Features
1. Follow Next.js App Router conventions
2. Use TypeScript strictly
3. Use TailwindCSS for styling (IVM green: `#2d5016`)
4. Follow responsive design patterns from M01
5. Add audit logging for sensitive operations

## Important Conventions

### Code Style
- TypeScript with strict type checking
- Functional components with hooks
- Use Prisma for all database access
- Email templates stored in database (not hardcoded)
- Rate limiting on authentication endpoints

### Security
- Never expose sensitive data in client components
- Validate all user inputs
- Use prepared statements (Prisma handles this)
- Log authentication events to AuditLog
- Check verificationStatus before granting access

### Testing
- Manual test procedures in each milestone doc
- Automated tests coming in M18
- E2E tests for critical workflows
- See `docs/planning/90-testing-strategy.md`

## Environment Setup

### Required Environment Variables (.env)
```env
DATABASE_URL="postgresql://ivm_user:ivm_password@localhost:5432/ivm_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate-random-secret>"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="465"
EMAIL_USER="<your-email>"
EMAIL_PASS="<app-password>"
EMAIL_FROM="noreply@indianvillagemanor.com"
```

See `.env.example` for template.

## Known Issues & Resolutions

All major issues from M01 and M02 have been resolved:
- ✅ next-auth peer dependency (use --legacy-peer-deps)
- ✅ React hydration mismatch (default rendering in WindowWithSize)
- ✅ NextAuth SESSION_FETCH_ERROR (stub API route created)
- ✅ Modal image 400 error (early return fix)
- ✅ Tailwind border-border class (removed from CSS)
- ✅ Schema alignment (removed isResident/isOwner fields)
- ✅ Idempotent seed script (safe to run multiple times)

## Next Steps (M03)

The next milestone is **M03: Magic Link Authentication and Basic Audit Logging**.

**Key Tasks**:
1. Implement magic link login flow with NextAuth
2. Set up email delivery system (Nodemailer already configured)
3. Add rate limiting for login attempts and magic link requests
4. Implement basic audit logging for authentication events
5. Block pending users from logging in
6. Add logout functionality

**See**: `docs/planning/M03-magic-link-authentication.md` for detailed requirements

## Tips for Future Agents

1. **Always check PROGRESS.md first** to understand current state
2. **Read the milestone doc** before starting work on a milestone
3. **Don't skip manual testing** - each milestone has specific test procedures
4. **Update PROGRESS.md** when completing milestones
5. **Follow existing patterns** - UI patterns in M01, data patterns in M02
6. **Database changes require migrations** - never edit schema.prisma without migrating
7. **Seed script is idempotent** - safe to run repeatedly
8. **Reference project exists** - check `IndianVillageManor/ivm_app` when in doubt about UI
9. **Audit logging is critical** - log all sensitive operations
10. **Security matters** - this is a real HOA site, not a toy project

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth Docs](https://next-auth.js.org)
- [TailwindCSS Docs](https://tailwindcss.com/docs)

## Contact & Support

This is a private project for Indian Village Manor HOA.

---

**Last Updated**: 2026-02-17 (M02 completion)
**Document Version**: 1.0
**For**: Future AI agents working on this project
