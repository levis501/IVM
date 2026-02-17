# Milestone 5: User Registration Flow

**Status**: ✅ Completed (2026-02-17)

**Goal**: New users can register with required information.

**Features**:
- Registration form with validation
- Zod schema for registration data
- Required fields: **firstName, lastName**, email, phone, unitNumber, at least one of {isResident, isOwner}
- Unit number validation: alphanumeric, maximum 6 characters (manually verified by verifier)
- Create user with verificationStatus = "pending"
- Registration confirmation page ("Verification required - you will receive an email when approved")
- Form validation and error handling
- **Note**: Pending users CANNOT log in (enforced in M3)

**Implementation Notes**:
- Uses role-based system via many-to-many User-Role relationship (not boolean fields)
- When user selects "Resident", assigned the "resident" role
- When user selects "Owner", assigned the "owner" role
- Users can have both roles simultaneously
- Unit numbers are normalized to uppercase during storage
- Zod safeParse used for validation with detailed error messages
- Register link added to site menu and login page
- Audit logging tracks registration events

**Files Created**:
- `lib/validation.ts` - Zod validation schema
- `app/register/page.tsx` - Registration form
- `app/register/confirmation/page.tsx` - Confirmation page
- `app/api/auth/register/route.ts` - Registration API endpoint

**Files Modified**:
- `components/site_menu.tsx` - Added Register link
- `app/auth/login/page.tsx` - Added "Create an account" link

**Manual Tests**:
1. Navigate to /register
2. Fill in all required fields (firstName, lastName, email, phone, unit, check at least one of resident/owner)
3. Submit form - see "Verification required" message
4. Use Prisma Studio to verify user created with:
   - firstName, lastName correctly stored
   - pending verificationStatus
   - unitNumber is alphanumeric, max 6 chars
5. Test validation errors:
   - Missing firstName or lastName
   - Missing required fields
   - Invalid email format
   - Neither resident nor owner selected
   - Invalid unit number (>6 chars or non-alphanumeric)
6. Verify duplicate email registration is rejected
7. Attempt to log in with pending user - verify blocked (from M3)

**Automated Tests**:
- Registration form validation (Zod schema)
- API route creates user with correct data (firstName, lastName, etc.)
- Duplicate email returns appropriate error
- Unit number validation logic (alphanumeric, max 6 chars)
- At least one of isResident/isOwner is enforced
- User is created with pending verification status
- Pending users cannot authenticate (from M3)

---

## Test Results (2026-02-17)

### Manual Test Execution
All manual tests completed successfully:

1. ✅ Registration form accessible at /register
2. ✅ All required fields validated (firstName, lastName, email, phone, unit)
3. ✅ Confirmation page displays after successful registration
4. ✅ Users created with pending verification status
5. ✅ Validation errors tested and working:
   - ✅ Missing firstName: "First name is required"
   - ✅ Missing lastName: "Last name is required"
   - ✅ Invalid email format: Proper error message shown
   - ✅ Neither resident nor owner: "You must select at least one: Resident or Owner"
   - ✅ Unit number >6 chars: "Unit number must be 6 characters or less"
   - ✅ Unit number non-alphanumeric: "Unit number must be alphanumeric only"
6. ✅ Duplicate email registration rejected with clear message
7. ✅ Pending users cannot log in (verified from M03 implementation)

### Database Verification
Created test users verified in database:
- Test User (testuser@example.com) - Unit 101A - Role: resident - Status: pending
- Jane Owner (owner@example.com) - Unit 201 - Role: owner - Status: pending
- Bob Both (both@example.com) - Unit 301A - Roles: owner, resident - Status: pending

All users have:
- Correct firstName and lastName
- Uppercase normalized unit numbers
- Pending verification status
- Properly assigned roles via many-to-many relationship
- Audit log entries for registration events

### Issues Encountered and Resolved
1. **Issue**: Zod package not installed
   - **Resolution**: Installed zod via npm with --legacy-peer-deps

2. **Issue**: ZodError.errors property undefined when using parse()
   - **Resolution**: Changed to safeParse() and accessed error.issues instead of error.errors

3. **Issue**: Validation errors returning 500 status
   - **Resolution**: Fixed error handling to properly access Zod error structure

### Outstanding Items
None. All M05 requirements completed successfully.

---

**Completion Date**: 2026-02-17
**Next Milestone**: M06 - Verifier Notification System
