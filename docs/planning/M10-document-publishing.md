# Milestone 10: Document Publishing System

**Goal**: Publishers can upload, publish, archive, delete, and restore documents for their committees.

**Features**:
- Document storage setup (mounted volume /data/documents with committee subdirectories)
- Document upload API with validation:
  - File type whitelist (pdf, jpg, png)
  - Size limit (25 MB, configurable via SystemConfig)
  - Filename sanitization
- Publisher interface for document management (**must be committee member**)
- Document states:
  - **Published**: Listed on committee page, accessible to verified users
  - **Archived**: Not listed, but existing links work
  - **Deleted**: Moved to committee-specific trash (`/data/documents/<committee-id>/.trash/`)
- **Restore functionality**: Publishers can restore archived or deleted documents for their committees
- Published documents visible to all verified users
- Trash management: View deleted documents, restore, or permanently delete
- Audit log for all document actions (upload, publish, archive, delete, restore)
- E2E test for document lifecycle

**Manual Tests**:
1. Log in as bootstrap user (dbadmin)
2. Assign bootstrap user publisher role AND add as member of "Board" committee
3. Navigate to Board committee page
4. **Upload a PDF document** - verify stored in /data/documents/board-id/
5. Mark document as published - verify appears on committee page
6. Log in as different verified user - verify document is visible
7. Log back in as publisher
8. **Archive the document**:
   - Verify no longer listed on committee page
   - Verify direct link still works
9. **Delete a document**:
   - Upload second document
   - Delete it
   - Verify moved to /data/documents/board-id/.trash/
   - Verify not accessible via public URL
10. **Restore deleted document**:
    - View trash for committee
    - Restore document
    - Verify it reappears as published (or archived, based on previous state)
11. **Restore archived document**:
    - Restore previously archived document
    - Verify it reappears as published
12. Verify audit logs record all actions (upload, publish, archive, delete, restore)
13. Test file validation:
    - Reject .exe file
    - Reject file over 25 MB
    - Accept valid PDF
14. Test publisher without committee membership cannot upload to that committee
15. Check size limit from SystemConfig (max_upload_size_mb)

**Automated Tests**:
- File upload validation (type, size)
- Filename sanitization
- Only publishers **with committee membership** can upload
- Published documents query returns correct results (deleted=false, published=true)
- Archived documents are excluded from listings but accessible
- Deleted files are moved to committee .trash directory
- Restore function works for both archived and deleted documents
- Audit log entries created for all document actions (including restore)
- Storage path configuration works
- E2E test: upload → publish → archive → restore → delete → restore
