# AI Orchestrator — הוראות התקנה

## דרישות
- Node.js 18+
- npm 9+

## התקנה מהירה

```bash
npm install
npm run dev
```

ואז פתח http://localhost:5173

## הגדרת API Keys

לחץ ⚙️ הגדרות ← מפתחות API, והזן את המפתחות שלך.
המפתחות נשמרים ב-localStorage בלבד.

### מפתחות נדרשים (לפחות אחד):
| ספק | איפה משיגים |
|-----|-------------|
| Claude (מחובר אוטומטית) | — |
| OpenAI (GPT-4o + DALL-E) | platform.openai.com |
| Google Gemini | aistudio.google.com |
| Groq | console.groq.com |
| OpenRouter | openrouter.ai |
| Mistral | console.mistral.ai |
| DeepSeek | platform.deepseek.com |
| Perplexity | perplexity.ai/settings/api |
| ElevenLabs | elevenlabs.io |

## Build לפרודקשן

```bash
npm run build
```

הפלט בתיקיית `dist/` — מוכן להעלאה לכל hosting סטטי.

## Deploy ל-GitHub Pages

1. Push ל-`main`
2. GitHub Actions בונה ומעלה אוטומטית

## Stack
- React 18 + TypeScript + Vite
- Tailwind CSS + Framer Motion
- Zustand (state)
- PWA (vite-plugin-pwa)
