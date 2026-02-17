# Milestone 9: Committee System

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
