# Folder Structure — AI Orchestrator

```
ai-orchestrator/
│
├── public/
│   └── icons/
│       ├── icon-192.png          PWA icon (192×192)
│       └── icon-512.png          PWA icon (512×512, maskable)
│
├── src/
│   │
│   ├── core/                     ← Pure TypeScript (no React)
│   │   │
│   │   ├── AIService.ts          Main facade — orchestrates all AI calls
│   │   ├── MediaService.ts       Image + voice generation (DALL-E, ElevenLabs)
│   │   │
│   │   ├── providers/
│   │   │   ├── BaseProvider.ts           Abstract base + readSSEStream helper
│   │   │   ├── OpenAICompatBase.ts       Shared base for OpenAI-format providers
│   │   │   ├── ClaudeProvider.ts         Anthropic Claude
│   │   │   ├── OpenAIProvider.ts         GPT-4o + DALL-E
│   │   │   ├── GeminiProvider.ts         Google Gemini
│   │   │   ├── GroqProvider.ts           Groq (Llama 3.3)
│   │   │   ├── OpenRouterProvider.ts     OpenRouter
│   │   │   ├── MistralProvider.ts        Mistral Large
│   │   │   ├── DeepSeekProvider.ts       DeepSeek
│   │   │   ├── PerplexityProvider.ts     Perplexity (web search)
│   │   │   ├── ElevenLabsProvider.ts     ElevenLabs TTS
│   │   │   └── ProviderRegistry.ts       Factory + lifecycle management
│   │   │
│   │   ├── router/
│   │   │   ├── AIRouter.ts               Picks provider per request
│   │   │   └── IntentClassifier.ts       Weighted keyword scoring (10 intents)
│   │   │
│   │   ├── agents/
│   │   │   ├── AgentRunner.ts            Multi-step pipeline executor
│   │   │   └── TaskPlanner.ts            Builds step list from goal text
│   │   │
│   │   ├── tools/
│   │   │   ├── ToolRegistry.ts           Central tool registry
│   │   │   ├── registerTools.ts          Wires all tools at startup
│   │   │   ├── WebSearchTool.ts          → Perplexity
│   │   │   ├── SummarizeTool.ts          → Claude
│   │   │   ├── TranslationTool.ts        → GPT
│   │   │   ├── CodeGenTool.ts            → DeepSeek
│   │   │   ├── ImageGenTool.ts           → DALL-E
│   │   │   ├── VoiceGenTool.ts           → ElevenLabs
│   │   │   └── FileReaderTool.ts         Text normalization
│   │   │
│   │   ├── documents/
│   │   │   ├── DocumentTypes.ts          Types + MIME mappings
│   │   │   ├── DocumentParser.ts         PDF/DOCX/CSV/Excel/text extraction
│   │   │   ├── ClaudeOCR.ts              Vision-based OCR
│   │   │   ├── TFIDFVectorIndex.ts       Local vector index (no API)
│   │   │   └── RAGService.ts             Retrieval + context injection
│   │   │
│   │   ├── memory/
│   │   │   └── MemoryManager.ts          Builds bounded conversation context
│   │   │
│   │   ├── logging/
│   │   │   └── Logger.ts                 Structured ring-buffer logger
│   │   │
│   │   └── services/
│   │       ├── CacheService.ts           Two-level LRU (memory + localStorage)
│   │       ├── RateLimitService.ts       Sliding window counter
│   │       ├── RetryService.ts           Exponential backoff with abort
│   │       ├── AnalyticsService.ts       Local event tracking (1000 events)
│   │       ├── BackupService.ts          5-snapshot rotation
│   │       └── ExportService.ts          JSON export/import
│   │
│   ├── ui/                       ← React layer
│   │   │
│   │   ├── components/
│   │   │   │
│   │   │   ├── chat/
│   │   │   │   ├── ChatWindow.tsx         Message list + auto-scroll + ARIA
│   │   │   │   ├── MessageBubble.tsx      User/assistant bubble + actions
│   │   │   │   ├── InputBar.tsx           Textarea + templates picker
│   │   │   │   ├── TemplatesPicker.tsx    Prompt template dropdown
│   │   │   │   ├── MarkdownRenderer.tsx   GFM + LaTeX + media detection
│   │   │   │   ├── CodeBlock.tsx          Syntax highlighting + copy
│   │   │   │   ├── MermaidDiagram.tsx     Mermaid (dynamic import)
│   │   │   │   └── StreamingText.tsx      Animated cursor during streaming
│   │   │   │
│   │   │   ├── sidebar/
│   │   │   │   ├── Sidebar.tsx            Nav + search + export/import
│   │   │   │   └── ConversationItem.tsx   Inline rename + delete confirm
│   │   │   │
│   │   │   ├── header/
│   │   │   │   └── ChatHeader.tsx         Files · Agent · Model · Theme
│   │   │   │
│   │   │   ├── model-selector/
│   │   │   │   └── ModelSelector.tsx      Auto / manual model picker
│   │   │   │
│   │   │   ├── agent/
│   │   │   │   ├── AgentProgress.tsx      Pipeline visualization
│   │   │   │   └── StepIndicator.tsx      Per-step status + retry button
│   │   │   │
│   │   │   ├── documents/
│   │   │   │   ├── FileManager.tsx        Slide-in panel + RAG toggle
│   │   │   │   ├── FileDropZone.tsx       Drag & drop upload
│   │   │   │   └── FilePreview.tsx        Image/audio/video/text preview modal
│   │   │   │
│   │   │   ├── settings/
│   │   │   │   └── SettingsPanel.tsx      7-tab bottom sheet
│   │   │   │                              (API Keys · Models · Templates ·
│   │   │   │                               Personas · Analytics · Shortcuts · Backup)
│   │   │   │
│   │   │   ├── pwa/
│   │   │   │   └── InstallPrompt.tsx      Android prompt + iOS instructions
│   │   │   │
│   │   │   ├── AppShell.tsx               Root ErrorBoundary + Toaster
│   │   │   └── ThemeProvider.tsx          Applies dark/light class to <html>
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAIService.ts            Bridges AIService → React + AbortController
│   │   │   ├── useAgent.ts                Bridges AgentRunner → React
│   │   │   ├── useDocuments.ts            Upload pipeline + OCR + blob cleanup
│   │   │   ├── useChat.ts                 Aggregates chat store selectors
│   │   │   ├── useClipboard.ts            Copy to clipboard with feedback
│   │   │   ├── useKeyboardShortcuts.ts    Global keyboard shortcuts
│   │   │   └── useTheme.ts                Syncs theme store → DOM class
│   │   │
│   │   └── store/
│   │       ├── chatStore.ts               Conversations + messages (persisted)
│   │       ├── settingsStore.ts           Keys, theme, templates, personas (persisted)
│   │       ├── uiStore.ts                 Sidebar/modal open state (session)
│   │       └── documentStore.ts           Document metadata (persisted, no text)
│   │
│   ├── pages/
│   │   └── ChatPage.tsx                  Main page (lazy loaded)
│   │
│   ├── types/
│   │   └── index.ts                      All TypeScript types
│   │
│   ├── lib/
│   │   ├── constants.ts                  PROVIDER_META, defaults, shortcuts
│   │   └── utils.ts                      cn(), generateId(), truncate(), …
│   │
│   ├── App.tsx                           Root: ThemeProvider + Router + lazy pages
│   ├── main.tsx                          React DOM mount
│   ├── index.css                         Tailwind directives + CSS variables
│   └── vite-env.d.ts                     Vite type reference
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   └── FOLDER_STRUCTURE.md              (this file)
│
├── .github/
│   └── workflows/
│       └── deploy.yml                   CI/CD: lint → build → gh-pages
│
├── index.html                            Entry + PWA meta + SEO
├── vite.config.ts                        Vite + PWA + manual chunks
├── tailwind.config.ts                    Tailwind + CSS variables
├── tsconfig.json
├── tsconfig.node.json
├── postcss.config.js
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── package.json
├── README.md
└── SETUP.md                             Quick-start in Hebrew
```
