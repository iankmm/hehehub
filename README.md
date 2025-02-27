# Hehe - A Meme Sharing Platform

A TikTok-style meme sharing platform built with Next.js, where users can scroll through memes, like them with "hehe" reactions, and share their own memes.

## TODO
- ethstorage for posts
-

## potential bounties
- track: impact + public goods
- maybe ai agent on eigenlayer



## Complete Setup Guide

### 1. Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- pnpm (v8 or higher)

### 2. Initial Setup

```bash
# Install Node.js (using nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Install pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.bashrc  # or source ~/.zshrc for macOS

# Install PostgreSQL (macOS)
brew install postgresql@14
brew services start postgresql@14

# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# WSL:
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo service postgresql start

```

### 3. Project Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd hehe

# Install dependencies
pnpm install

# Install Prisma CLI globally (optional but recommended)
pnpm add -g prisma
```

### 4. Database Setup

```bash
# Create database
createdb hehe

# Set up Prisma
pnpm add @prisma/client prisma
npx prisma init

# Create a new user (optional, if not using default postgres user)
sudo -u postgres createuser -P -s -e your_username
```

### 5. Environment Configuration

Create a `.env` file:
```bash
cp .env.example .env
```

Add the following to `.env`:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/hehe?schema=public"

# Authentication
JWT_SECRET="your-secure-jwt-secret"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 6. Initialize Database Schema

```bash
# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed database with test data
npx tsx scripts/create-test-user.ts
npx tsx scripts/seed-memes.ts
```

### 7. Start Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Development

### Available Commands

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run linting
pnpm type-check   # Run type checking

# Database
npx prisma studio        # Open database GUI
npx prisma db push      # Push schema changes
npx prisma migrate dev  # Create migration
npx prisma generate     # Generate client

# Testing
pnpm test         # Run tests
pnpm test:watch   # Run tests in watch mode
```

### Project Structure

```
hehe/
├── prisma/                # Database schema and migrations
├── public/               # Static assets
│   └── uploads/         # Uploaded memes
├── src/
│   ├── app/             # Next.js app router pages
│   ├── components/      # React components
│   ├── lib/            # Utility functions
│   └── styles/         # CSS styles
├── scripts/            # Utility scripts
└── tests/             # Test files
```

## Troubleshooting

### Database Issues

1. Connection errors:
```bash
# Check PostgreSQL status
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Verify connection
psql -d hehe -U your_username
```

2. Reset database:
```bash
dropdb hehe
createdb hehe
npx prisma migrate reset --force
```

### Image Upload Issues

1. Check uploads directory:
```bash
# Create uploads directory if missing
mkdir -p public/uploads
chmod 755 public/uploads
```

2. Verify file permissions:
```bash
ls -la public/uploads
```

### Authentication Issues

1. Clear browser data:
```bash
# In Chrome/Firefox dev tools
localStorage.clear()
```

2. Verify JWT token:
```bash
# Check token in browser console
localStorage.getItem('token')
```

## Security Best Practices

1. Never commit `.env` files
2. Use strong JWT secrets
3. Keep dependencies updated
4. Validate all user inputs
5. Use HTTPS in production
6. Implement rate limiting
7. Regular security audits

## License

MIT