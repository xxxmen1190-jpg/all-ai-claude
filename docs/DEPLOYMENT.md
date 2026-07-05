# Deployment Guide — AI Orchestrator

## Prerequisites

- Node.js 18+ and npm 9+
- At least one AI API key (Claude works out of the box in the Artifact)

---

## Local Development

```bash
npm install
npm run dev
# → http://localhost:5173
```

## Production Build

```bash
npm run build
# → dist/
```

The `dist/` folder is a static site — no server required.

---

## StackBlitz

1. Go to [stackblitz.com](https://stackblitz.com)
2. Click **"Import from zip"** or drag the project folder in
3. StackBlitz auto-runs `npm install && npm run dev`
4. Click ⚙️ Settings → API Keys and enter your keys

---

## GitHub

```bash
git init
git add .
git commit -m "feat: AI Orchestrator v1.0"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-orchestrator.git
git push -u origin main
```

### GitHub Pages (auto-deploy)

The included `.github/workflows/deploy.yml` builds and deploys on every push to `main`.

1. Push to GitHub
2. Go to Settings → Pages → Source: **GitHub Actions**
3. Next push automatically deploys to `https://USERNAME.github.io/ai-orchestrator/`

---

## Vercel

```bash
npm i -g vercel
vercel --prod
```

Or connect the GitHub repo in the Vercel dashboard — auto-deploys on every push.

---

## Netlify

```bash
npm run build
```

Then drag `dist/` to [netlify.com/drop](https://netlify.com/drop).

Or connect via Netlify dashboard:
- Build command: `npm run build`
- Publish directory: `dist`

---

## Cloudflare Pages

```bash
npm run build
```

In Cloudflare Pages dashboard:
- Framework preset: **Vite**
- Build command: `npm run build`
- Build output directory: `dist`

---

## Environment Variables

This project uses **no environment variables** — all API keys are entered at runtime
through the Settings panel and stored in `localStorage`.

If you want to pre-fill keys for a team deployment, you can modify
`src/lib/constants.ts` → `DEFAULT_API_KEYS`, but this is not recommended for public repos.

---

## PWA Installation

Once deployed, users can install the app:

- **Android/Chrome**: Banner appears automatically → "Install"
- **iOS/Safari**: Share button → "Add to Home Screen"
- **Desktop/Chrome**: Install icon in address bar

The Service Worker (via Workbox) caches all static assets for offline shell support.
