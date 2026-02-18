# Milestone 9: Committee System

**Status**: ✅ Completed (2026-02-17)

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

**Implementation Notes**:
- `/committees` page shows all committees to dbadmin; others see only accessible ones
- `/committees/[id]` detail page shows published documents to all authorized viewers
- `/admin/committees/[id]` handles both create (`new`) and edit modes
- Delete is blocked when committee has documents (must remove documents first)
- dbadmin sees all committees via the admin list API; visibility API used for non-admin
- Committees and Admin Console links added to site menu for dbadmin users
- Middleware updated: `/committees` requires auth; `/admin/committees` for dbadmin

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
