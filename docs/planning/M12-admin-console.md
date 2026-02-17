# Milestone 12: Database Admin Console

**Goal**: Dbadmin role can manage user roles, committee memberships, system configuration, email templates, and perform bulk operations.

**Features**:
- User list page with search/filter
- User detail/edit page showing firstName, lastName, email, phone, unit, roles, committees, verification status
- Role assignment interface
- Committee membership assignment interface
- **Bulk operations interface**:
  - Bulk role assignment (select multiple users, assign role)
  - Bulk committee membership (select multiple users, add to committee)
  - Bulk actions with confirmation dialogs
- **SystemConfig management UI**:
  - View/edit system configuration values
  - session_timeout_days, disk_alert_threshold_percent, max_upload_size_mb, etc.
  - Input validation for config values
  - Changes take effect immediately (or after restart, depending on config)
- **EmailTemplate management UI**:
  - View all email templates
  - Edit template subject and body
  - Preview template with sample variables
  - List of available variables for each template
  - Syntax validation for template variables
- Audit log for role/membership/config/template changes
- Only accessible to dbadmin role
- E2E test for admin operations

**Manual Tests**:
1. Log in as bootstrap user (dbadmin)
2. Navigate to admin console
3. **User Management**:
   - View list of all users (firstName, lastName, email, unit, status)
   - Select a user, assign publisher role
   - Assign user to a committee
   - Verify changes persisted
4. **Bulk Operations**:
   - Select 3 users
   - Bulk assign calendar role
   - Verify all 3 users now have calendar role
   - Bulk add users to "Social" committee
   - Verify all added successfully
5. **SystemConfig**:
   - Navigate to system configuration
   - Change session_timeout_days from 90 to 60
   - Change disk_alert_threshold_percent from 85 to 80
   - Verify changes saved
   - Test that next login uses new session timeout
6. **Email Templates**:
   - Navigate to email templates
   - Edit "approval" template subject
   - Preview template with sample data
   - Verify available variables listed ({{firstName}}, {{lastName}}, etc.)
   - Save changes
   - Trigger approval - verify email uses new template
7. **Audit Logs**:
   - Verify all admin actions logged
   - Check role assignment, config change, template edit all in audit log
8. **Access Control**:
   - Log in as non-dbadmin user
   - Attempt to access admin console - access denied

**Automated Tests**:
- Only dbadmin can access admin console
- Role assignment API works correctly
- Committee membership API works correctly
- Multiple role assignment per user
- Multiple committee membership per user
- **Bulk operations API**:
  - Bulk role assignment
  - Bulk committee membership
  - Validation prevents invalid assignments
- **SystemConfig API**:
  - CRUD operations on config
  - Validation enforces correct value types/ranges
  - Config changes reflected in application
- **EmailTemplate API**:
  - CRUD operations on templates
  - Template variable validation
  - Preview functionality works
- Audit log entries created for all admin actions
- Non-dbadmin cannot access admin endpoints
- E2E test: bulk assign roles → update config → edit template → verify audit log
