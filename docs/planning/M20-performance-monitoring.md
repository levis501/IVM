# Milestone 20: Performance Optimization and Monitoring

**Goal**: Optimize application performance for production use and implement monitoring/alerting system.

**Features**:
- **Performance Optimization**:
  - Database query optimization:
    - Proper indexes (see DATABASE.md)
    - Query analysis and optimization
    - N+1 query prevention (use Prisma includes)
  - Caching strategy:
    - Static page caching (Next.js ISR)
    - API response caching (where appropriate)
    - Database query caching
  - Image optimization
  - Code splitting and lazy loading
  - CDN setup for static assets (optional)
- **Monitoring and Alerting System**:
  - **Metrics collection**:
    - Failed login attempts per user
    - Pending verifications count
    - Document upload success/failure rates
    - Email delivery success/failure rates
    - Disk usage for document and log volumes
    - Database connection pool status
    - API response times
    - Error rates
  - **Email alerting to dbadmin** for:
    - Failed email deliveries (magic-link, verifications, notifications)
    - Failed login attempts by a user > 3 (configurable via System Config)
    - Pending verifications count increase
    - Disk usage above configurable threshold (default: 85%, configurable via SystemConfig)
    - Application errors and warnings
    - Database connection issues
    - Backup failures
  - **Alert configuration UI** (dbadmin):
    - Configure alert thresholds via SystemConfig
    - failed_login_alert_threshold (default: 3)
    - disk_alert_threshold_percent (default: 85)
    - pending_verification_alert_count (default: 5)
  - Monitoring dashboard (optional, or use external tool like Grafana)
  - Health check endpoints for uptime monitoring

**Manual Tests**:
1. **Performance Testing**:
   - Use Lighthouse to audit performance (score >90)
   - Test page load times (<2s for main pages)
   - Monitor database query performance (no queries >100ms)
   - Upload large document (within limit) - verify reasonable upload time
   - Load page with many documents - verify performant
   - Check memory usage over time - no leaks
2. **Monitoring Testing**:
   - Trigger >3 failed logins - verify dbadmin receives alert email
   - Register 5+ new users - verify pending verification alert sent
   - Upload documents until disk usage >85% - verify alert sent
   - Simulate email delivery failure - verify dbadmin notified
   - Check application error - verify error alert sent
3. **Alert Configuration**:
   - Log in as dbadmin
   - Navigate to SystemConfig
   - Change disk_alert_threshold_percent to 75
   - Verify new threshold takes effect
   - Change failed_login_alert_threshold to 5
   - Trigger 5 failed logins - verify alert sent

**Automated Tests**:
- Performance benchmarks for critical paths:
  - Homepage load time <2s
  - API endpoints respond <200ms
  - Database queries <100ms
- Database query performance tests (use explain analyze)
- Load testing for API endpoints (Artillery or k6)
  - 100 concurrent users
  - Sustained load for 5 minutes
- Memory leak tests (monitor for 1 hour under load)
- **Monitoring tests**:
  - Failed login alert triggers correctly
  - Disk usage alert triggers at threshold
  - Email failure alert works
  - Pending verification alert works
  - Alert configuration updates reflected
- Health check endpoint returns correct status

**Monitoring Metrics Dashboard** (if implemented):
- Active users (last 24h)
- Failed login attempts (last 24h)
- Pending verifications
- Document uploads (last 7 days)
- Disk usage (documents, logs, database)
- Database connection pool utilization
- API response times (p50, p95, p99)
- Error rate
