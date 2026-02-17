# Milestone 5: User Registration Flow

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
