# Milestone 7: Verifier Approval/Denial Flow

**Goal**: Verifiers can approve or deny pending user registrations.

**Features**:
- Verifier dashboard listing pending registrations
- Verification page for individual registration:
  - Show user details (firstName, lastName, email, phone, unit, resident/owner)
  - Approve button
  - Deny button
  - Comment field (optional but recommended)
- Update user verificationStatus to "verified" or "denied"
- Record verificationUpdatedAt, verificationUpdatedBy (User.id reference), verificationComment
- **Send approval email** to user (EmailTemplate: "approval")
- **Send denial email** to user with next steps (EmailTemplate: "denial"):
  - Explain registration was denied
  - Suggest contacting office for assistance
  - Suggest re-registering with correct information
- Audit log entry for verification action (uses basic logging from M3)
- E2E test for complete verifier flow

**Manual Tests**:
1. Log in as bootstrap user (verifier)
2. Navigate to verifier dashboard
3. See pending registration(s) from Milestone 5
4. Click on a pending user
5. Add comment "Verified as resident - unit number confirmed"
6. Click "Approve"
7. Verify user status updated to "verified" in database
8. Verify verificationUpdatedBy stores bootstrap user's ID
9. Verify user receives confirmation email
10. User can now log in successfully
11. Create another pending user, deny with comment "Incorrect unit number"
12. Verify denial is recorded correctly
13. **Verify denied user receives denial email with next steps**
14. Denied user still cannot log in
15. Verify audit log records both approval and denial actions

**Automated Tests**:
- Only users with verifier role can access verifier dashboard
- Approve action updates user status correctly
- Deny action updates user status correctly
- Verification metadata (updatedAt, updatedBy User.id, comment) is recorded
- Approval email is sent (EmailTemplate: "approval")
- **Denial email is sent with next steps** (EmailTemplate: "denial")
- Audit log entry is created for both approve and deny
- Non-verifiers cannot access verification endpoints
- **E2E test: complete flow from registration → verification → login**
