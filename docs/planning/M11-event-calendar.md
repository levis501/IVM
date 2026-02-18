# Milestone 11: Event Calendar System

**Status**: ✅ Completed (2026-02-17)

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
