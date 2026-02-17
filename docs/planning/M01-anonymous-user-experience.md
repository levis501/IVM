# Milestone 1: Anonymous User Experience

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
