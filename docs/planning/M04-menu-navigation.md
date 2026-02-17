# Milestone 4: Basic Menu and Navigation for Authenticated Users

**Goal**: Authenticated users see appropriate menu items based on their roles and verification status.

**Features**:
- Hamburger menu component
- Dynamic menu items based on authentication status:
  - Unauthenticated: "Login"
  - Authenticated verified users: "Logout", committee links (if applicable)
  - **Calendar link added later when events exist** (not in this milestone)
- User context/session hook
- Role-based menu item visibility
- Committee visibility rules:
  - Show committees with published documents (all verified users)
  - Show committees where user is member or publisher (even if no published docs)

**Manual Tests**:
1. Log in as bootstrap user (verified)
2. Open hamburger menu
3. Verify "Logout" is visible
4. **Verify "Calendar" link is NOT yet visible** (will be added in M11)
5. Log out and verify menu shows only "Login"
6. Test menu on mobile and desktop
7. Create pending user, verify they cannot access menu (cannot log in)

**Automated Tests**:
- Menu renders correct items for unauthenticated users
- Menu renders correct items for authenticated verified users
- Pending users cannot authenticate (tested in M3)
- Session hook returns correct user data (firstName, lastName, email, unit, roles)
- Component tests for menu with different user states
