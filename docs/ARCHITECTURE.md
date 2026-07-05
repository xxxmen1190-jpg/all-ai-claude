# Architecture — AI Orchestrator

## Overview

Client-only React app. No backend. All AI calls go directly from browser to provider APIs.
State persists to localStorage. Core layer is pure TypeScript — no React imports.

---

## Layers

```
┌─────────────────────────────────────────────────────┐
│  UI LAYER  (React, Zustand, Framer Motion)          │
│  pages/ · ui/components/ · ui/hooks/ · ui/store/   │
└───────────────────────┬─────────────────────────────┘
                        │ hooks → services
┌───────────────────────▼─────────────────────────────┐
│  CORE LAYER  (pure TypeScript)                      │
│                                                     │
│  AIService  →  AIRouter  →  ProviderRegistry        │
│       ↓            ↓              ↓                 │
│  AgentRunner    IntentClassifier  9 Providers       │
│       ↓                                             │
│  ToolRegistry (7 tools)                             │
│                                                     │
│  RAGService  →  TFIDFVectorIndex                    │
│  DocumentParser  →  ClaudeOCR                      │
│                                                     │
│  Services: Cache · RateLimit · Retry               │
│            Analytics · Backup · Export · Logger     │
└───────────────────────┬─────────────────────────────┘
                        │ HTTPS
              Provider APIs (Anthropic, OpenAI …)
```

---

## Request Flow

```
User message
  ↓
RateLimitService.check()
  ↓
CacheService.get()          ← cache hit → return immediately
  ↓
AIRouter.route()
  ↓ IntentClassifier.classify() [weighted keyword scoring]
  ↓ pick first available provider from fallback chain
  ↓
MemoryManager.buildContext()   [last 20 msgs + system prompt]
  ↓
Provider.stream()              [SSE token-by-token]
  ↓ [on error] fallback to next provider in chain
  ↓
AnalyticsService.track()
CacheService.set()
```

---

## Provider Contract

```typescript
abstract class BaseProvider {
  abstract complete(messages, options?): Promise<string>
  abstract stream(messages, options?): AsyncGenerator<string>
  generateImage?(prompt, options?): Promise<{ url: string }>   // optional
  generateVoice?(text, options?): Promise<{ audioUrl: string }> // optional
}
```

Adding a provider: create file → register in ProviderRegistry → add to PROVIDER_META. Nothing else changes.

---

## Agent Pipeline

```
goal text
  ↓ TaskPlanner.plan()      [keyword → step list]
  ↓
for each step:
  ↓ STEP_TOOL_MAP[type]?
    → ToolRegistry.execute()    [web_search / summarize / translate / …]
  else
    → AIService.complete()      [analyze / write]
  ↓ append result to workingContext
  ↓ next step sees all prior results
```

---

## RAG Pipeline

```
Upload → DocumentParser → text chunks (500 words, 50 overlap)
                               ↓
                    TFIDFVectorIndex.add()    [local, no API]

Query → TFIDFVectorIndex.query(topK=6)
              ↓ cosine similarity on TF-IDF vectors
         chunks → inject into system prompt (≤6000 chars)
              ↓
         AIService.complete()
```

---

## State Stores

| Store | Contents | Persisted |
|-------|----------|-----------|
| chatStore | conversations, messages | ✅ |
| settingsStore | keys, theme, templates, personas | ✅ |
| uiStore | sidebar/panel open state | ❌ |
| documentStore | document metadata | ✅ (no chunk text) |

---

## Performance

| Decision | Reason |
|----------|--------|
| Lazy-load ChatPage, SettingsPanel, FileManager, AgentProgress | Reduce initial bundle |
| Dynamic import: mermaid, pdfjs, mammoth, xlsx | Load only when needed |
| Shared `readSSEStream` in BaseProvider | One SSE implementation |
| React.memo on ChatWindow, MessageBubble, Sidebar | Prevent cascade re-renders |
| TF-IDF (no embedding API) | No latency, no cost, works offline |
| Hash routing | Works on any static host |
