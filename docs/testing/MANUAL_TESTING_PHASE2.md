# Phase 2: User Management - Manual Testing Guide

This document covers manual testing procedures for all Phase 2 milestones (M05-M08.5).

**Prerequisites**:
- PostgreSQL running via Docker (`docker-compose up -d`)
- Database migrated and seeded (`npx prisma migrate dev && npx prisma db seed`)
- Dev server running (`scripts/kill3000_and_start_dev.sh` or `npm run dev`)
- Bootstrap user available: `indianvillagemanor+bootstrap@gmail.com` (pre-verified, has verifier + dbadmin roles)
- Email configuration working (check `.env` for EMAIL_SERVER or EMAIL_HOST/EMAIL_USER/EMAIL_PASSWORD)

---

## M05: User Registration Flow

### Test 1: Access Registration Page
1. Open http://localhost:3000 in an incognito/private browser window
2. Click the hamburger menu
3. Verify "Register" link is visible for unauthenticated users
4. Click "Register" - should navigate to `/register`
5. **Expected**: Registration form with fields for First Name, Last Name, Email, Phone, Unit Number, and checkboxes for Resident/Owner

### Test 2: Required Field Validation
1. On the registration form, click "Register" without filling any fields
2. **Expected**: Validation errors displayed for all required fields

### Test 3: Unit Number Validation
1. Enter all required fields
2. Enter a unit number longer than 6 characters (e.g., "ABCDEFG")
3. Click "Register"
4. **Expected**: Validation error for unit number (max 6 alphanumeric characters)

### Test 4: Role Selection Required
1. Fill all fields but leave both Resident and Owner unchecked
2. Click "Register"
3. **Expected**: Error message indicating at least one role must be selected

### Test 5: Successful Registration
1. Fill in all fields with valid data:
   - First Name: "Test"
   - Last Name: "User"
   - Email: a unique email address (e.g., `testuser1@example.com`)
   - Phone: "313-555-0101"
   - Unit Number: "101A"
   - Check "Resident"
2. Click "Register"
3. **Expected**: Redirected to confirmation page with message about pending verification
4. **Verify in database**: `npx prisma studio` - User created with verificationStatus = "pending"

### Test 6: Duplicate Email Prevention
1. Try to register again with the same email used in Test 5
2. **Expected**: Error message indicating an account with this email already exists

### Test 7: Pending User Cannot Log In
1. Navigate to `/auth/login`
2. Enter the email from Test 5
3. **Expected**: After clicking the magic link (or checking the auth flow), user is redirected to error page with "PendingVerification" message

### Test 8: Login Page has Register Link
1. Navigate to `/auth/login`
2. **Expected**: "Create an account" link visible, linking to `/register`

---

## M06: Verifier Notification System

### Test 9: Verifier Email Notification
1. Register a new user (Test 5 above)
2. Check the email inbox for the bootstrap user (`indianvillagemanor+bootstrap@gmail.com`)
3. **Expected**: Email with subject "New User Registration Pending Verification" containing:
   - New user's name, email, phone, unit number
   - Resident/Owner status
   - Link to `/admin/verify`

### Test 10: Check Audit Log
1. After registration, check `data/logs/auth-YYYY-MM-DD.log` (today's date)
2. **Expected**: Entry for `verifier_notification_sent` action
3. Also check `npx prisma studio` > AuditLog table for the notification event

---

## M07: Verifier Approval/Denial Flow

### Test 11: Access Verifier Dashboard
1. Log in as the bootstrap user (`indianvillagemanor+bootstrap@gmail.com`)
2. Open the hamburger menu
3. **Expected**: "Verify Users" link visible (bootstrap user has verifier role)
4. Click "Verify Users"
5. **Expected**: Navigate to `/admin/verify` showing pending registrations

### Test 12: Pending User Display
1. On the verifier dashboard, find the pending user from Test 5
2. **Expected**: Card showing:
   - First name and last name
   - "Resident" badge (and/or "Owner" badge)
   - Unit number badge
   - Email address
   - Phone number
   - Registration date
   - Comment text area
   - Approve and Deny buttons

### Test 13: Approve a User
1. On the pending user card, enter comment: "Verified as resident - unit number confirmed"
2. Click "Approve"
3. **Expected**:
   - Success message: "[Name] has been approved successfully"
   - User removed from pending list
   - User's verification status updated to "verified" in database
   - User assigned "user" role in database
   - `verificationUpdatedBy` set to bootstrap user's ID
   - `verificationComment` set to the entered comment
4. Check email for the test user: approval email received with login link
5. Check `AuditLog` table: entry for `user_approved` action

### Test 14: Approved User Can Log In
1. Open an incognito/private window
2. Navigate to `/auth/login`
3. Enter the approved user's email
4. Follow the magic link
5. **Expected**: User successfully logs in and sees Dashboard, Events, My Profile in the menu

### Test 15: Deny a User
1. Register another new user (e.g., `testuser2@example.com`)
2. Log in as bootstrap user, navigate to `/admin/verify`
3. Enter comment: "Incorrect unit number"
4. Click "Deny"
5. **Expected**:
   - Success message: "[Name] has been denied successfully"
   - User removed from pending list
   - User's verification status updated to "denied" in database
   - `verificationComment` set to the entered comment
6. Check email for the denied user: denial email received with contact information and reason
7. Check `AuditLog` table: entry for `user_denied` action

### Test 16: Denied User Cannot Log In
1. Try to log in with the denied user's email
2. **Expected**: Redirected to error page with "VerificationDenied" message

### Test 17: Non-Verifier Cannot Access Dashboard
1. Log in as a regular verified user (approved in Test 13)
2. Navigate directly to `/admin/verify`
3. **Expected**: Redirected away (to home page), not shown the dashboard

### Test 18: Non-Verifier Cannot Access API
1. While logged in as a regular user, use browser dev tools to call:
   ```
   fetch('/api/admin/verify').then(r => r.json()).then(console.log)
   ```
2. **Expected**: Response with status 403 and error "Forbidden: verifier role required"

### Test 19: Empty Pending List
1. Log in as bootstrap user, approve/deny all pending users
2. Navigate to `/admin/verify`
3. **Expected**: "No pending registrations to review" message displayed

---

## M08: Verified User Access

### Test 20: Middleware Redirects Unauthenticated Users
1. In an incognito/private window (not logged in), navigate to:
   - `/dashboard`
   - `/profile`
   - `/events`
2. **Expected**: Each redirects to `/auth/login` with callbackUrl parameter

### Test 21: Dashboard Access for Verified Users
1. Log in as an approved/verified user
2. Navigate to `/dashboard`
3. **Expected**: Dashboard shows:
   - Welcome message with user's name
   - Account status: "Verified" (green)
   - Roles list
   - Navigation cards for Events, My Profile
   - If user has verifier role: "Verify Users" card also shown

### Test 22: Dashboard Shows Pending Warning
1. Register a new user but do NOT approve them
2. This user cannot log in (tested in M03/M05), but if they could reach the dashboard:
   - The warning "Your account is pending verification" would be displayed
3. This is primarily a UI safeguard since pending users are blocked at login

### Test 23: Events Page - No Events
1. Log in as a verified user
2. Navigate to `/events`
3. **Expected**: "No events to display at this time" message
   (No events exist in the database yet since the Event Calendar System is M11)

### Test 24: Events Page - Past Event Filtering Logic
1. Use Prisma Studio or a script to create test events:
   ```sql
   -- Create a past event (before current month)
   INSERT INTO "Event" (id, title, description, "startAt", "createdBy", "updatedAt")
   VALUES (gen_random_uuid(), 'Past Board Meeting', 'Monthly meeting', '2026-01-15 18:00:00', '<bootstrap-user-id>', NOW());

   -- Create a current month event
   INSERT INTO "Event" (id, title, description, "startAt", "createdBy", "updatedAt")
   VALUES (gen_random_uuid(), 'February Community Event', 'Open to all', '2026-02-20 10:00:00', '<bootstrap-user-id>', NOW());
   ```
2. Visit `/events` while NOT logged in
3. **Expected**: Only the February (current month) event is shown
4. Log in as a verified user and visit `/events`
5. **Expected**: Both past (January) and current (February) events are shown
6. Log out and visit `/events` again
7. **Expected**: Only current month event shown, with info box about signing in for past events

### Test 25: Menu Links for Authenticated Users
1. Log in as a verified user
2. Open the hamburger menu
3. **Expected**: Menu contains:
   - Home, Floor Plans, Contact
   - (Committee links section, empty if no committees)
   - (Verify Users link, only if user has verifier role)
   - Dashboard, Events, My Profile
   - "Signed in as: [Name]"
   - Logout

---

## M08.5: User Profile Management

### Test 26: View Profile
1. Log in as a verified user
2. Navigate to `/profile` (or click "My Profile" in menu)
3. **Expected**: Profile page showing:
   - Verification status badge ("Verified" in green)
   - First Name, Last Name (read-only fields)
   - Email (read-only)
   - Phone, Unit Number (read-only)
   - Residency Status (Resident and/or Owner)
   - Member since date
   - "Edit Profile" button

### Test 27: Enter Edit Mode
1. Click "Edit Profile"
2. **Expected**:
   - First Name, Last Name, Phone, Unit Number fields become editable
   - Email remains read-only with note: "Email cannot be changed through profile edit"
   - Resident/Owner checkboxes become interactive
   - "Cancel" and "Save Changes" buttons appear
   - "Save Changes" is disabled (no changes yet)

### Test 28: Cancel Edit Without Changes
1. Click "Cancel" without making any changes
2. **Expected**: Returns to view mode, original values unchanged

### Test 29: Cancel Edit With Changes
1. Click "Edit Profile"
2. Change the first name
3. Click "Cancel"
4. **Expected**: Returns to view mode, original values restored (not the edited value)

### Test 30: Save Non-Reverifying Changes (Already Pending User)
1. If user is already in "pending" status, changes do not trigger re-verification
2. Edit a field (e.g., phone number)
3. Click "Save Changes"
4. **Expected**: Success message, profile updated, no re-verification warning

### Test 31: Re-verification Warning
1. Log in as a *verified* user
2. Click "Edit Profile"
3. Change the first name
4. **Expected**: Warning box appears: "These changes will require your account to be re-verified..."
5. Click "Save Changes"
6. **Expected**: Confirmation dialog appears with:
   - Title: "Re-verification Required"
   - Explanation of consequences (status becomes pending, lose access to protected content)
   - "Cancel" and "Proceed with Changes" buttons

### Test 32: Cancel Re-verification
1. In the confirmation dialog from Test 31, click "Cancel"
2. **Expected**: Dialog closes, still in edit mode, changes not saved, status still "Verified"

### Test 33: Proceed with Re-verification
1. Click "Save Changes" again, then click "Proceed with Changes" in the dialog
2. **Expected**:
   - Success message about pending re-verification
   - Profile page now shows "Pending" status badge (amber)
   - Database shows verificationStatus = "pending"
   - `verificationComment` records what changed
3. Check user's email: "Profile Update Requires Re-verification" email received
4. Check verifier's email: new verifier notification email received

### Test 34: Re-verify After Profile Update
1. Log in as the bootstrap user (verifier)
2. Navigate to `/admin/verify`
3. **Expected**: The user whose profile was updated appears as pending
4. Approve the user
5. **Expected**: User's status returns to "verified"

### Test 35: Validation - Role Required
1. Edit profile, uncheck both Resident and Owner
2. Click "Save Changes"
3. **Expected**: Error message: "At least one of Resident or Owner must be selected"

### Test 36: Validation - Required Fields
1. Edit profile, clear the First Name field
2. Click "Save Changes"
3. **Expected**: Error response from API about required fields

### Test 37: Audit Log
1. After any profile update, check the AuditLog table in Prisma Studio
2. **Expected**: Entry with action = "profile_updated" containing:
   - userId of the user who updated their profile
   - Details listing the specific changes made
   - Whether re-verification was triggered

---

## Cross-Milestone Integration Tests

### Test 38: Full Registration-to-Verified Flow
1. Start with a fresh incognito window
2. Register a new user at `/register`
3. Verify confirmation page shown
4. Verify the user cannot log in (pending status)
5. Log in as bootstrap user
6. Navigate to `/admin/verify`
7. Approve the new user with a comment
8. Log out as bootstrap user
9. Log in as the newly approved user
10. **Expected**: User can access Dashboard, Events, and Profile pages

### Test 39: Full Profile Update Re-verification Flow
1. Log in as a verified user
2. Navigate to `/profile`
3. Edit the unit number
4. Confirm re-verification in the dialog
5. **Expected**: User status changes to pending
6. Log in as bootstrap user, re-verify the user
7. Log in as the user again
8. **Expected**: User is verified again with the updated unit number

### Test 40: Registration → Denial → Re-Registration Flow
1. Register a new user
2. As verifier, deny the user with comment "Wrong unit number"
3. Verify denied user cannot log in
4. Register again with a different email (or after admin cleanup)
5. As verifier, approve the new registration
6. **Expected**: User can now log in

---

## Common Issues and Troubleshooting

### Email Not Sending
- Check `.env` for correct email configuration
- For Gmail: ensure you're using an App Password (not regular password)
- Verify EMAIL_SERVER format: `smtp://user:pass@host:port`
- Check server console for email error messages

### Database Connection Issues
- Ensure Docker is running: `docker-compose ps`
- Check DATABASE_URL in `.env`
- Try: `npx prisma db push` to verify connection

### Session Issues
- Clear browser cookies/storage
- Verify NEXTAUTH_URL and NEXTAUTH_SECRET in `.env`
- Check if JWT strategy is working: look at browser's cookie for `next-auth.session-token`

### Verifier Dashboard Empty
- Ensure there are users with verificationStatus = "pending"
- Verify the logged-in user has the "verifier" role: check in Prisma Studio

---

**Last Updated**: 2026-02-17
**Covers Milestones**: M05, M06, M07, M08, M08.5
