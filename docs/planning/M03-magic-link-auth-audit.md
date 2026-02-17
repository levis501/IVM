# Milestone 3: Magic Link Authentication and Basic Audit Logging

**Goal**: Implement email magic-link authentication flow with rate limiting and basic audit logging.

**Features**:
- NextAuth configuration with email provider
- Magic-link email template (from EmailTemplate table)
- Login page with email input
- "Check your email" confirmation page
- Session management with secure HTTP-only cookies
- Session timeout: 90 days (configurable via SystemConfig)
- Logout functionality
- Email verification token generation and validation
- **Rate limiting implementation** for login and magic-link requests (not just testing)
- **Pending users CANNOT log in** - authentication blocks at login, shows appropriate message
- **Email recovery flow**:
  - Option 1: Partial email challenge (show some characters, user completes it)
  - Option 2: Unit number lookup (send reminder to all verified users in that unit)
- **Basic audit logging** (comprehensive logging in M13):
  - Write logs to /data/logs volume
  - Log login/logout actions
  - Log authentication attempts (successful and failed)
  - Track failed login attempts per user
  - Simple log format: userId, actor name, action, timestamp

**Manual Tests**:
1. Navigate to /login
2. Enter bootstrap user email
3. Receive magic-link email with customized template
4. Click magic-link - successfully authenticated
5. See hamburger menu with "Logout" option
6. Click logout - session ends, redirected to homepage
7. Verify expired/invalid tokens are rejected
8. **Test rate limiting** - attempt >5 magic-link requests rapidly, verify blocking
9. **Create pending user, attempt to log in** - verify blocked with "Verification required" message
10. **Test email recovery Option 1** - partial email challenge works
11. **Test email recovery Option 2** - unit number sends email to verified users in unit
12. Verify session persists for 90 days (or configured duration)
13. **Check /data/logs** - verify login/logout actions are logged

**Automated Tests**:
- NextAuth provider configuration is valid
- Magic-link token generation and validation
- Session creation and destruction
- Protected route middleware works
- Email sending (mock in tests)
- Token expiration logic
- **Rate limiting enforcement (login, magic-link)**
- **Pending user authentication blocked**
- **Email recovery flows (partial email, unit lookup)**
- **Session timeout respects SystemConfig setting**
- **Basic audit log writes to volume**
- **Failed login attempt tracking**

**E2E Tests**:
- Complete authentication flow from login to logout
