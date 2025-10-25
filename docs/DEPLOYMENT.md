# Deployment Guide

## Overview

Dr. Sbaitso Recreated is a static Vite + React application that requires environment variable configuration for the Gemini API key. This guide covers deployment to various platforms.

## Prerequisites

- Node.js 18+ installed locally
- Gemini API key from https://aistudio.google.com/apikey
- Git repository (for automated deployments)

## Local Development

### 1. Clone Repository

```bash
git clone <repository-url>
cd DrSbaitso-Recreated
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create `.env.local` in project root:

```bash
GEMINI_API_KEY=your_api_key_here
```

### 4. Run Development Server

```bash
npm run dev
```

Application runs at: http://localhost:3000

### 5. Build for Production

```bash
npm run build
```

Output directory: `dist/`

### 6. Preview Production Build

```bash
npm run preview
```

Preview server runs at: http://localhost:4173

## Deployment Platforms

### Vercel (Recommended)

**Features:**
- Zero-config deployment
- Automatic HTTPS
- Global CDN
- Environment variable management
- GitHub integration

**Steps:**

1. **Install Vercel CLI** (optional)
   ```bash
   npm install -g vercel
   ```

2. **Deploy via CLI**
   ```bash
   vercel
   ```

3. **Configure Environment Variable**
   - Go to Project Settings → Environment Variables
   - Add: `GEMINI_API_KEY` = `your_api_key`
   - Scope: Production, Preview, Development

4. **Deploy via GitHub**
   - Push to GitHub repository
   - Connect repository at https://vercel.com/new
   - Configure environment variables
   - Auto-deploys on every push

**Vercel Configuration** (optional `vercel.json`):

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install"
}
```

### Netlify

**Features:**
- Continuous deployment
- Custom domains
- Built-in forms (not used)
- Serverless functions (not used)

**Steps:**

1. **Deploy via Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod
   ```

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Environment Variables**
   - Site Settings → Environment → Environment Variables
   - Add: `GEMINI_API_KEY` = `your_api_key`

4. **Deploy via GitHub**
   - Connect repository at https://app.netlify.com/start
   - Configure build settings
   - Add environment variables
   - Auto-deploys on push

**Netlify Configuration** (`netlify.toml`):

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Cloudflare Pages

**Features:**
- Global edge network
- Unlimited bandwidth
- DDoS protection
- GitHub integration

**Steps:**

1. **Create Cloudflare Pages Project**
   - Go to https://pages.cloudflare.com/
   - Connect GitHub repository

2. **Build Configuration**
   - Framework preset: Vite
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node version: 18

3. **Environment Variables**
   - Settings → Environment Variables
   - Add: `GEMINI_API_KEY` = `your_api_key`
   - Production and Preview

4. **Deploy**
   - Automatic on git push
   - Manual via Wrangler CLI:
     ```bash
     npm install -g wrangler
     wrangler pages publish dist
     ```

### GitHub Pages

**Limitations:**
- ⚠️ Not recommended for this project
- No environment variable support
- API key must be hardcoded (security risk)
- No HTTPS redirect for custom domains

**Alternative Approach:**
Use GitHub Actions to deploy to other platforms.

### AWS S3 + CloudFront

**Features:**
- High scalability
- Pay-as-you-go pricing
- Full control

**Steps:**

1. **Build Application**
   ```bash
   npm run build
   ```

2. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://dr-sbaitso-bucket
   aws s3 website s3://dr-sbaitso-bucket --index-document index.html
   ```

3. **Upload Build**
   ```bash
   aws s3 sync dist/ s3://dr-sbaitso-bucket
   ```

4. **Configure CloudFront**
   - Create distribution pointing to S3 bucket
   - Enable HTTPS
   - Set default root object: `index.html`

5. **Environment Variable Handling**
   - Option 1: Build with API key injected during CI/CD
   - Option 2: Use AWS Secrets Manager + custom loader

### Docker Deployment

**Features:**
- Consistent environment
- Self-hosted deployment
- Easy scaling

**Dockerfile:**

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf:**

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Build and Run:**

```bash
# Build image
docker build --build-arg GEMINI_API_KEY=your_api_key -t dr-sbaitso .

# Run container
docker run -p 8080:80 dr-sbaitso

# Access at http://localhost:8080
```

**Docker Compose** (`docker-compose.yml`):

```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      args:
        GEMINI_API_KEY: ${GEMINI_API_KEY}
    ports:
      - "8080:80"
    restart: unless-stopped
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSyC...` |

### Platform-Specific Configuration

**Vercel:**
```
Dashboard → Settings → Environment Variables
```

**Netlify:**
```
Site Settings → Environment → Environment Variables
```

**Cloudflare Pages:**
```
Settings → Environment Variables
```

**Docker:**
```bash
docker build --build-arg GEMINI_API_KEY=your_key
```

**AWS:**
```bash
export GEMINI_API_KEY=your_key
npm run build
```

## Build Configuration

### Vite Build Settings

**vite.config.ts:**
```typescript
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    }
  };
});
```

### Build Output

**Production build produces:**
- `dist/index.html` - Main HTML file
- `dist/assets/` - JS, CSS, and other assets
- All assets are fingerprinted (e.g., `index-a1b2c3d4.js`)

**Build Size:**
- Total: ~500KB (including React + dependencies)
- Gzipped: ~150KB
- Initial load: ~200KB

### Build Optimization

**Vite automatically:**
- Minifies JavaScript and CSS
- Tree-shakes unused code
- Code-splits by route (if configured)
- Generates source maps (for debugging)

**Additional optimizations:**

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'gemini-vendor': ['@google/genai'],
        }
      }
    }
  }
});
```

## Custom Domain Configuration

### Vercel

1. Go to Project Settings → Domains
2. Add custom domain (e.g., `drsbaitso.example.com`)
3. Configure DNS:
   - Type: CNAME
   - Name: `drsbaitso`
   - Value: `cname.vercel-dns.com`

### Netlify

1. Site Settings → Domain Management → Custom Domains
2. Add domain
3. Configure DNS:
   - Type: CNAME
   - Name: `drsbaitso`
   - Value: `<your-site>.netlify.app`

### Cloudflare Pages

1. Custom Domains → Set up a custom domain
2. Add domain (Cloudflare automatically handles DNS)

## CI/CD Pipeline

### GitHub Actions

**`.github/workflows/deploy.yml`:**

```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./
```

**Required Secrets:**
- `GEMINI_API_KEY` - Gemini API key
- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

## Security Considerations

### API Key Protection

⚠️ **Warning:** API key is embedded in client-side JavaScript after build.

**Current Setup:**
- Vite injects API key at build time
- Key is visible in browser DevTools
- Suitable for demo/personal projects

**For Production:**

1. **Backend Proxy (Recommended)**
   ```
   Browser → Your Backend → Gemini API
   ```
   - Backend validates requests
   - API key never exposed
   - Rate limiting possible

2. **API Key Restrictions**
   - Restrict by domain (Google Cloud Console)
   - Set daily quota limits
   - Monitor usage

3. **Environment-Specific Keys**
   - Development: Personal key
   - Production: Restricted key with quotas

### HTTPS Enforcement

All major platforms (Vercel, Netlify, Cloudflare) automatically provide:
- Free SSL certificates (Let's Encrypt)
- Automatic HTTPS redirect
- HTTP/2 support

### Content Security Policy

Add CSP headers for enhanced security:

```nginx
# nginx.conf
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://aistudiocdn.com; connect-src 'self' https://generativelanguage.googleapis.com; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com;" always;
```

## Performance Optimization

### CDN Configuration

All recommended platforms use global CDNs:
- **Vercel:** Edge Network (70+ locations)
- **Netlify:** Edge Network (global)
- **Cloudflare:** 200+ edge locations

### Caching Strategy

**Static Assets:**
- Cache-Control: `public, max-age=31536000, immutable`
- Fingerprinted filenames prevent stale caches

**index.html:**
- Cache-Control: `no-cache` or `max-age=3600`
- Forces browser to revalidate

### Compression

All platforms automatically enable:
- Gzip compression (legacy browsers)
- Brotli compression (modern browsers)

**Example:**
- Original JS: 500KB
- Gzip: 150KB (70% reduction)
- Brotli: 130KB (74% reduction)

## Monitoring and Analytics

### Vercel Analytics

```bash
npm install @vercel/analytics
```

```typescript
// index.tsx
import { Analytics } from '@vercel/analytics/react';

root.render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>
);
```

### Error Tracking

**Sentry Integration:**

```bash
npm install @sentry/react
```

```typescript
// index.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.MODE,
});
```

## Rollback Procedures

### Vercel

1. Go to Deployments
2. Find previous successful deployment
3. Click "..." → "Promote to Production"

### Netlify

1. Go to Deploys
2. Find previous deploy
3. Click "Publish deploy"

### Docker

```bash
# Tag stable versions
docker tag dr-sbaitso dr-sbaitso:stable

# Rollback
docker stop dr-sbaitso-container
docker run -d --name dr-sbaitso-container dr-sbaitso:stable
```

## Troubleshooting Deployment

### Build Failures

**Error: "Cannot find module"**
- Solution: Run `npm ci` instead of `npm install`
- Ensure `package-lock.json` is committed

**Error: "GEMINI_API_KEY is not defined"**
- Solution: Add environment variable in platform settings
- Verify variable name matches `vite.config.ts`

### Runtime Errors

**"API_KEY environment variable is not set"**
- Environment variable not injected during build
- Check Vite config `define` section

**CORS errors**
- Not applicable (API calls from client)
- If using backend proxy, configure CORS headers

### Performance Issues

**Slow initial load**
- Enable compression (automatic on most platforms)
- Check CDN configuration
- Review bundle size with `npm run build -- --mode=analyze`

**Audio playback delays**
- Expected behavior (TTS API latency)
- Check network connection
- Verify API quota not exceeded

## Cost Estimation

### Hosting Costs

**Vercel (Free Tier):**
- 100 GB bandwidth/month
- Unlimited projects
- **Cost: $0**

**Netlify (Free Tier):**
- 100 GB bandwidth/month
- 300 build minutes/month
- **Cost: $0**

**Cloudflare Pages (Free):**
- Unlimited bandwidth
- 500 builds/month
- **Cost: $0**

### API Costs

See [API.md](./API.md) for Gemini API cost estimation.

**Typical:** ~$0.01 per session × 100 sessions = $1/day = ~$30/month

## Best Practices

1. **Version Control:** Always commit `package-lock.json`
2. **Environment Variables:** Never commit `.env.local`
3. **Testing:** Test production build locally with `npm run preview`
4. **Monitoring:** Set up error tracking and analytics
5. **Backups:** Keep deployment configuration in version control
6. **Documentation:** Update this guide when adding new deployment targets
