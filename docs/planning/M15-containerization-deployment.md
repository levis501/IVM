# Milestone 15: Containerization and Deployment

**Goal**: Complete Docker setup for production deployment.

**Features**:
- Dockerfile for Next.js app
- docker-compose.yml with:
  - Next.js app container
  - PostgreSQL container
  - Nginx reverse proxy container
- Persistent volumes for:
  - PostgreSQL data
  - Uploaded documents (/data/documents)
  - **Audit logs (/data/logs)**
  - Optional: configuration
- Environment variable configuration
- HTTPS setup with Let's Encrypt (certbot)
- Health checks for containers
- Production-ready configuration

**Manual Tests**:
1. Build Docker images
2. Start with docker-compose up
3. Verify all containers start successfully
4. Access application via reverse proxy
5. Verify HTTPS works (or HTTP is properly configured)
6. Upload a document - verify it persists after container restart in /data/documents
7. **Perform actions - verify audit logs persist in /data/logs**
8. Create database data - verify it persists after container restart
9. Stop and start containers - verify all data persistence
10. Check health endpoints
11. Verify volume mounts correct: /data/documents, /data/logs, postgres data

**Automated Tests**:
- Docker build succeeds
- docker-compose validation
- Container health checks pass
- Volume mounts work correctly (documents, logs, database)
- Environment variables are loaded
- Application starts and responds to requests
