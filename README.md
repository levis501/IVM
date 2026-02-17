# Indian Village Manor - Community Website

A Next.js-based community website for Indian Village Manor HOA.

## Prerequisites

- Node.js 18+
- Docker (for local PostgreSQL database)
- npm or yarn

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start PostgreSQL Database

```bash
docker-compose up -d
```

This will start a PostgreSQL database on `localhost:5432`.

### 3. Set Up Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Update the email configuration in `.env` with your SMTP credentials.

### 4. Run Database Migrations

```bash
npx prisma migrate dev
```

### 5. (Optional) Seed Database

```bash
npx prisma db seed
```

Note: Seed data will be implemented in Milestone M02.

### 6. Generate Prisma Client

```bash
npx prisma generate
```

### 7. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
.
├── app/                 # Next.js app directory
│   ├── globals.css     # Global styles with TailwindCSS
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
├── lib/                # Utility libraries
│   ├── prisma.ts      # Prisma client instance
│   └── email.ts       # Email utilities (nodemailer)
├── prisma/             # Database schema and migrations
│   ├── schema.prisma  # Database schema
│   └── seed.ts        # Seed script
├── docs/               # Project documentation
└── docker-compose.yml  # Docker configuration for PostgreSQL
```

## Development

### Build for Production

```bash
npm run build
```

### Run Production Server

```bash
npm start
```

### Lint Code

```bash
npm run lint
```

### Database Management

View database in Prisma Studio:

```bash
npx prisma studio
```

Create a new migration:

```bash
npx prisma migrate dev --name <migration-name>
```

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Database**: PostgreSQL with Prisma ORM
- **Email**: Nodemailer
- **Development**: Docker for local database

## Milestones

Development follows a milestone-based approach. See `docs/planning/PROGRESS.md` for current progress.

**Current Status**: M00 - Project Setup

## Documentation

- [Database Schema](./DATABASE.md)
- [Database Migrations](./DATABASE_MIGRATIONS.md)
- [Design Document](./DESIGN.md)
- [Development Progress](./docs/planning/PROGRESS.md)

## License

Private project for Indian Village Manor HOA.
