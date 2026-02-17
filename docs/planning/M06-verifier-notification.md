# Milestone 6: Verifier Notification System

**Goal**: Users with verifier role receive email notifications when new users register.

**Features**:
- Email notification to all verifiers on new registration
- Email template from EmailTemplate table (key: "verifier-notification")
- Email includes:
  - New user details (**firstName, lastName**, email, phone, unit, resident/owner status)
  - Link to verification page
- Queue system for email sending (or immediate with error handling)
- **Failed email notification to dbadmin** (basic implementation, enhanced in M20)

**Manual Tests**:
1. Ensure bootstrap user has verifier role
2. Register a new user
3. Check that bootstrap user email receives notification
4. Verify email contains:
   - firstName, lastName
   - Email, phone, unit number
   - Resident/owner status
   - Link to verification page
5. Test with multiple verifiers - all receive email
6. Simulate email failure - verify dbadmin is notified

**Automated Tests**:
- Email sent to all users with verifier role
- Email contains correct user information (firstName, lastName, etc.)
- Verification link format is correct
- Email sending errors are handled gracefully
- Failed email triggers dbadmin notification
- Mock email service in tests
