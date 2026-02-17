# Milestone 0: Project Setup

**Goal**: Establish the development environment and foundational infrastructure.

**Tasks**:
- Initialize Next.js project with TypeScript
- Configure TailwindCSS
- Set up PostgreSQL database (local + Docker)
- Initialize Prisma with schema models
- Configure nodemailer for email
- Set up basic project structure (app/, components/, lib/, prisma/)
- Create docker-compose.yml for local development

**Manual Tests**:
- Project builds without errors (`npm run build`)
- Database migrations run successfully (`npx prisma migrate dev`)
- Dev server starts and shows Next.js welcome page

**Automated Tests**:
- Build script succeeds in CI
- Database connection test
- Environment variable validation test
