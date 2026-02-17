# Milestone 17: Security Hardening

**Goal**: Implement security best practices.

**Features**:
- Input validation and sanitization for all user input
- File upload security:
  - Virus scanning (ClamAV or similar)
  - File type validation beyond extension
  - Size limits enforced
- Rate limiting:
  - Login attempts
  - Magic-link requests
  - API endpoints
  - Document uploads
- CSRF protection
- XSS prevention
- SQL injection prevention (via Prisma)
- Secure session configuration
- Security headers (CSP, HSTS, etc.)
- Dependency vulnerability scanning

**Manual Tests**:
1. Test rate limiting on login - verify lockout after N attempts
2. Test file upload with malicious filename - verify sanitization
3. Attempt SQL injection in form inputs - verify prevention
4. Attempt XSS in text inputs - verify escaping
5. Check HTTP headers include security headers
6. Verify sessions use HTTP-only, secure cookies
7. Test CSRF protection on state-changing operations
8. Run dependency audit - verify no critical vulnerabilities

**Automated Tests**:
- Rate limiting tests
- Input validation tests (malicious inputs)
- File upload validation tests
- CSRF protection tests
- Security header tests
- Session security tests
- Dependency vulnerability scanning in CI
- Integration tests with malicious payloads
