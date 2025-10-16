# Polyrepo Setup - Frontend

This repository is part of a **polyrepo architecture** where the backend and frontend are separated into individual repositories.

## Repository Structure

- **Backend**: https://github.com/walaywashere/ledger-v2-backend
- **Frontend** (this repo): https://github.com/walaywashere/ledger-v2-frontend
- **Original Monorepo** (archived): https://github.com/walaywashere/ledger-v2

## Why Polyrepo?

**Benefits:**
1. ✅ **Lighter Pushes** - No need to push backend code when only frontend changes
2. ✅ **Independent Versioning** - Backend and frontend can have separate release cycles
3. ✅ **Easier CI/CD** - Deploy backend and frontend independently
4. ✅ **Cleaner Git History** - Each repo focuses on its own changes
5. ✅ **Better Permissions** - Can grant different access levels to each repo
6. ✅ **Faster Clones** - Clone only what you need to work on

## Development Workflow

### Initial Setup
```bash
# Clone frontend
git clone https://github.com/walaywashere/ledger-v2-frontend.git
cd ledger-v2-frontend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Or create .env manually:
echo "VITE_API_URL=http://localhost:3000/api" > .env

# Start dev server
npm run dev
```

### Working with Backend
The frontend requires the backend API to be running:

1. **Start Backend First**:
   ```bash
   # In backend-v2 directory
   npm run dev
   ```
   Backend runs on: `http://localhost:3000`

2. **Configure API URL**:
   Edit `.env`:
   ```
   VITE_API_URL=http://localhost:3000/api
   ```

3. **Start Frontend**:
   ```bash
   npm run dev
   ```
   Frontend runs on: `http://localhost:5173`

### Build & Deployment
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy (Vercel example)
vercel --prod
```

## Environment Variables

Create `.env` file:
```bash
# Backend API URL
VITE_API_URL=http://localhost:3000/api

# Production example:
# VITE_API_URL=https://your-backend.railway.app/api
```

## Deployment

Frontend and backend deploy independently:
- **Backend**: Railway, Heroku, or any Node.js host
- **Frontend**: Vercel, Netlify, or any static host

**Important**: Update `VITE_API_URL` in production to point to your deployed backend.

## Related Repositories

- [Backend Repository](https://github.com/walaywashere/ledger-v2-backend)
