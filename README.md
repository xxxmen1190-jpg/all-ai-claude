<div align="center">
  <h1>🤖 AI Orchestrator</h1>
  <p><strong>ממשק צ'אט אחד לכל מודלי ה-AI</strong></p>
  <p>
    <img src="https://img.shields.io/badge/React-18-blue?logo=react" />
    <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" />
    <img src="https://img.shields.io/badge/Vite-5-purple?logo=vite" />
    <img src="https://img.shields.io/badge/PWA-ready-green" />
    <img src="https://img.shields.io/badge/License-MIT-yellow" />
  </p>
</div>

---

## מה זה?

**AI Orchestrator** הוא ממשק צ'אט Production-ready שמחבר בין 10 ספקי AI שונים בממשק אחד אחיד. הוא בוחר אוטומטית את המודל הטוב ביותר לכל בקשה, תומך ב-Agents מרובי שלבים, RAG על מסמכים, ו-PWA להתקנה בטלפון.

---

## תכונות עיקריות

### 🧠 AI חכם
| תכונה | פרטים |
|--------|--------|
| **Auto Routing** | ניתוח כוונה + בחירת המודל הטוב ביותר לכל בקשה |
| **9 ספקים** | Claude, GPT-4o, Gemini, Groq, OpenRouter, Mistral, DeepSeek, Perplexity, ElevenLabs |
| **Streaming** | תשובות בזמן אמת token-by-token |
| **Fallback** | אוטומטי — אם ספק נכשל עובר לבא בתור |
| **Agents** | Pipeline מרובי שלבים: Search→Analyze→Summarize→Write |

### 📄 מסמכים
| תכונה | פרטים |
|--------|--------|
| **PDF, DOCX, TXT, CSV, Excel** | חילוץ טקסט אוטומטי |
| **OCR** | חילוץ טקסט מתמונות דרך Claude Vision |
| **RAG** | TF-IDF vector index מקומי, ללא שרת |
| **Chat with Documents** | שאלות מבוססות על מסמכים שהועלו |
| **Drag & Drop** | גרירת קבצים ישירות לממשק |

### 💬 ממשק
| תכונה | פרטים |
|--------|--------|
| **Markdown מלא** | GFM, LaTeX (KaTeX), Syntax Highlighting, Mermaid |
| **Edit / Regenerate** | עריכת הודעות ויצירה מחדש |
| **Pin Messages** | הצמדת הודעות חשובות |
| **Templates** | תבניות Prompt לשימוש חוזר |
| **Personas** | דמויות AI עם אופי מוגדר |
| **Dark / Light / System** | ערכות צבע |
| **PWA** | התקנה כאפליקציה בטלפון |
| **Keyboard Shortcuts** | Ctrl+K, Ctrl+B, Ctrl+, |

### 🔒 פרטיות ואבטחה
- כל ה-API Keys נשמרים ב-`localStorage` בלבד
- אין שרת — הכל רץ בדפדפן
- אין שמירת נתונים חיצונית
- Open Source לחלוטין

---

## התחלה מהירה

### StackBlitz (הכי פשוט)
1. היכנס ל-[stackblitz.com](https://stackblitz.com)
2. גרור את תיקיית הפרויקט לתוך StackBlitz
3. StackBlitz מריץ `npm install` אוטומטית
4. לחץ ⚙️ הגדרות ← מפתחות API

### מקומי
```bash
npm install
npm run dev
# פתח http://localhost:5173
```

### Build לפרודקשן
```bash
npm run build
# dist/ מוכן להעלאה לכל hosting סטטי
```

---

## ספקי AI ומפתחות

| ספק | איפה משיגים | חינמי? |
|-----|-------------|--------|
| **Claude** | — | מחובר אוטומטית (דרך Artifact) |
| **GPT-4o + DALL-E** | [platform.openai.com](https://platform.openai.com/api-keys) | ❌ |
| **Gemini** | [aistudio.google.com](https://aistudio.google.com/app/apikey) | ✅ |
| **Groq** | [console.groq.com](https://console.groq.com/keys) | ✅ |
| **OpenRouter** | [openrouter.ai/keys](https://openrouter.ai/keys) | ✅ (חלקי) |
| **Mistral** | [console.mistral.ai](https://console.mistral.ai) | ✅ (ניסיון) |
| **DeepSeek** | [platform.deepseek.com](https://platform.deepseek.com) | ✅ ($) |
| **Perplexity** | [perplexity.ai/settings/api](https://perplexity.ai/settings/api) | ❌ |
| **ElevenLabs** | [elevenlabs.io](https://elevenlabs.io) | ✅ (10K תווים) |

---

## Deploy

### Vercel
```bash
npm install -g vercel
vercel --prod
```

### GitHub Pages
1. Push ל-`main`
2. GitHub Actions בונה ומעלה אוטומטית (ראה `.github/workflows/deploy.yml`)
3. הפעל GitHub Pages ב-Settings → Pages → Branch: `gh-pages`

### Netlify
```bash
npm run build
# גרור את dist/ ל-netlify.com/drop
```

---

## Stack טכנולוגי

```
Frontend:  React 18 + TypeScript + Vite 5
Styling:   Tailwind CSS + Framer Motion
State:     Zustand (persisted to localStorage)
Routing:   React Router 6 (Hash mode)
Markdown:  react-markdown + remark-gfm + remark-math + rehype-katex
Code:      react-syntax-highlighter (Prism)
Diagrams:  Mermaid (dynamic import)
PDF:       pdfjs-dist (dynamic import)
DOCX:      mammoth (dynamic import)
CSV/Excel: papaparse + xlsx (dynamic import)
PWA:       vite-plugin-pwa + Workbox
```

---

## מבנה הפרויקט

```
src/
├── core/                    # לוגיקה עסקית טהורה (ללא React)
│   ├── providers/           # 9 ספקי AI + BaseProvider + Registry
│   ├── router/              # AIRouter + IntentClassifier
│   ├── agents/              # AgentRunner + TaskPlanner
│   ├── tools/               # 7 Tools + ToolRegistry
│   ├── documents/           # Parser + OCR + TF-IDF + RAG
│   ├── memory/              # MemoryManager (context window)
│   ├── logging/             # Logger (structured, buffered)
│   └── services/            # Cache, RateLimit, Retry, Export, Backup, Analytics
│
├── ui/                      # שכבת React
│   ├── components/
│   │   ├── chat/            # ChatWindow, MessageBubble, InputBar, MarkdownRenderer
│   │   ├── sidebar/         # Sidebar, ConversationItem
│   │   ├── header/          # ChatHeader
│   │   ├── agent/           # AgentProgress, StepIndicator
│   │   ├── documents/       # FileManager, FileDropZone, FilePreview
│   │   ├── settings/        # SettingsPanel (7 tabs)
│   │   ├── model-selector/  # ModelSelector
│   │   ├── pwa/             # InstallPrompt
│   │   └── shared/          # ErrorBoundary, TypingIndicator, ModelBadge
│   ├── hooks/               # useAIService, useAgent, useDocuments, useChat, ...
│   └── store/               # chatStore, settingsStore, uiStore, documentStore
│
├── pages/                   # ChatPage (lazy loaded)
├── types/                   # כל ה-TypeScript types
└── lib/                     # constants, utils
```

---

## קיצורי מקלדת

| קיצור | פעולה |
|-------|-------|
| `Ctrl+K` | שיחה חדשה |
| `Ctrl+B` | פתח/סגור Sidebar |
| `Ctrl+,` | הגדרות |
| `Enter` | שלח הודעה |
| `Shift+Enter` | שורה חדשה |

---

## רישיון

MIT © 2024 AI Orchestrator
