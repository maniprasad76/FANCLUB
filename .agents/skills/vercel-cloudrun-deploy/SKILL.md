---
name: vercel-cloudrun-deploy
description: "Deployment automation for TFI Club. ACTIVATE when: deploying frontend/admin to Vercel, deploying backend to Cloud Run, configuring vercel.json, writing Dockerfiles for NestJS, setting up GitHub Actions CI/CD, configuring environment variables for production, troubleshooting deployment failures, managing preview deployments, or setting up custom domains. Triggers: Vercel, Cloud Run, deploy, Dockerfile, GitHub Actions, CI/CD, production, build, vercel.json, preview deployment."
metadata:
  author: tfi-team
  version: "1.0.0"
---

# Deployment Automation — TFI Club

## Deployment Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   Frontend       │     │   Admin          │     │   Backend         │
│   React + Vite   │     │   React + Vite   │     │   NestJS + Prisma │
│                  │     │                  │     │                   │
│   Vercel         │     │   Vercel         │     │   Cloud Run       │
│   :5173 (dev)    │     │   :5174 (dev)    │     │   :3001 (dev)     │
└────────┬─────────┘     └────────┬─────────┘     └────────┬──────────┘
         │                        │                         │
         │   tfi-frontend-        │   tfi-admin-            │   Cloud Run
         │   kappa.vercel.app     │   six.vercel.app        │   service
         └────────────────────────┴─────────────────────────┘
                              ↕
                    ┌──────────────────┐
                    │  Supabase        │
                    │  PostgreSQL      │
                    │  Auth + Storage  │
                    └──────────────────┘
```

---

## Vercel Deployment (Frontend & Admin)

### vercel.json Configuration

The frontend and admin apps use SPA routing rewrites:

```json
{
  "rewrites": [
    { "source": "/((?!assets|public).*)", "destination": "/index.html" }
  ]
}
```

This ensures all routes (e.g., `/shop`, `/product/slug`, `/profile`) are handled by React Router instead of returning 404.

### Vercel Environment Variables

Set these in the Vercel dashboard under **Settings → Environment Variables**:

| Variable | Frontend Value | Admin Value |
|----------|---------------|-------------|
| `VITE_API_URL` | `https://your-backend-url.run.app/api` | `https://your-backend-url.run.app/api` |
| `VITE_SUPABASE_URL` | `https://<ref>.supabase.co` | `https://<ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | Supabase anon key |

### Vercel Build Settings

| Setting | Frontend | Admin |
|---------|----------|-------|
| **Framework Preset** | Vite | Vite |
| **Build Command** | `tsc && vite build` | `tsc && vite build` |
| **Output Directory** | `dist` | `dist` |
| **Install Command** | `npm install` | `npm install` |
| **Root Directory** | `frontend` | `admin` |

### Deploying via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel

# Deploy admin
cd admin
vercel

# Deploy to production
vercel --prod
```

### Preview Deployments

Vercel automatically creates preview deployments for every PR/branch push. Each preview gets a unique URL like `tfi-frontend-abc123.vercel.app`.

### Custom Domain Setup

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add your custom domain (e.g., `shop.tficlub.com`)
3. Configure DNS: Add CNAME record pointing to `cname.vercel-dns.com`
4. Vercel auto-provisions SSL certificate

---

## Cloud Run Deployment (Backend)

### Dockerfile for NestJS + Prisma

```dockerfile
# Multi-stage build for smaller production image
FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build
RUN npm run build

# ── Production stage ──
FROM node:20-slim AS production

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy Prisma client and schema
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Cloud Run uses PORT env variable
ENV PORT=8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/main.js"]
```

### Cloud Run Deploy via CLI

```bash
# Build and push container
gcloud builds submit --tag gcr.io/PROJECT_ID/tfi-backend

# Deploy to Cloud Run
gcloud run deploy tfi-backend \
  --image gcr.io/PROJECT_ID/tfi-backend \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=production" \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,SUPABASE_URL=SUPABASE_URL:latest,..."
```

### Cloud Run via MCP Server

You can also use the `cloudrun` MCP server tools:
```
cloudrun → deploy_local_folder    # Deploy backend directory directly
cloudrun → list_services          # Check deployment status
cloudrun → get_service            # Get service details
cloudrun → get_service_log        # Debug deployment issues
```

### Cloud Run Environment Variables

Set these as **secrets** in Google Secret Manager:

```
DATABASE_URL
DIRECT_URL
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD
FRONTEND_URL
ADMIN_URL
PORT=8080
```

### Production Migrations

Run migrations as a pre-deploy step or a Cloud Build step:
```bash
# Before deploying, run migrations using DIRECT_URL:
DATABASE_URL=$DIRECT_URL npx prisma migrate deploy
```

> **IMPORTANT:** Use `DIRECT_URL` for migrations (direct DB connection), not `DATABASE_URL` (pooler connection). Pooler connections don't support DDL operations reliably.

---

## GitHub Actions CI/CD

### Backend CI/CD

```yaml
# .github/workflows/deploy-backend.yml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths: ['backend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: backend
        run: npm ci

      - name: Generate Prisma Client
        working-directory: backend
        run: npx prisma generate

      - name: Run tests
        working-directory: backend
        run: npm test

      - name: Build
        working-directory: backend
        run: npm run build

      - name: Auth to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Deploy to Cloud Run
        uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: tfi-backend
          region: asia-south1
          source: backend
```

### Frontend CI/CD (Vercel handles this automatically)

Vercel auto-deploys on push to main. No GitHub Actions needed unless you want custom CI steps.

```yaml
# .github/workflows/ci-frontend.yml (optional — for type checking)
name: Frontend CI

on:
  pull_request:
    paths: ['frontend/**']

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
        working-directory: frontend
      - run: npx tsc --noEmit
        working-directory: frontend
```

---

## Cold Start Optimization (Cloud Run)

1. **Set `min-instances: 1`** in production to avoid cold starts for the first request
2. **Use multi-stage Docker builds** to keep image size small (<300MB)
3. **Lazy-load heavy modules** (e.g., Razorpay, Stripe SDKs) only when needed
4. **Health check endpoint** (`/api/health`) should return fast — no DB queries
5. **Connection pooling** via Supabase Session Mode Pooler handles connection management

---

## Troubleshooting

### Vercel Build Fails
| Error | Fix |
|-------|-----|
| `Type error: ...` | Fix TypeScript errors locally first: `npx tsc --noEmit` |
| `Module not found` | Check import paths — Vercel is case-sensitive (Linux) |
| `VITE_API_URL is undefined` | Set environment variable in Vercel dashboard |
| `404 on refresh` | Check `vercel.json` has SPA rewrites |

### Cloud Run Deploy Fails
| Error | Fix |
|-------|-----|
| `Container failed to start` | Check PORT env var is `8080`, check health endpoint |
| `Permission denied` | Service account needs `Cloud Run Admin` + `Secret Manager Accessor` |
| `prisma: command not found` | Ensure `prisma` is in `dependencies`, not just `devDependencies` |
| `Database connection timeout` | Use Session Mode Pooler URL, not direct connection |
| `Migration failed` | Use `DIRECT_URL` for migrations, not pooler URL |

### CORS Errors in Production
1. Verify `FRONTEND_URL` and `ADMIN_URL` are set correctly in Cloud Run secrets
2. URLs must include protocol: `https://tfi-frontend-kappa.vercel.app` (no trailing slash)
3. Check that hardcoded Vercel domains in `main.ts` match actual deployment URLs
