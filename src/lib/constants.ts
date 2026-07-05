import type { ProviderKey, ProviderMeta, ApiKeys, PromptTemplate, Persona, ModelPreset, KeyboardShortcut } from '../types'

export const PROVIDER_META: Record<ProviderKey, ProviderMeta> = {
  claude:      { name: 'Claude',      emoji: '🟠', color: '#D97706', desc: 'חשיבה עמוקה ויצירתיות',  supportsStreaming: true },
  gpt:         { name: 'GPT-4o',      emoji: '🟢', color: '#10B981', desc: 'יצירתיות ושפה',          supportsStreaming: true, supportsImages: true },
  gemini:      { name: 'Gemini',      emoji: '🔵', color: '#3B82F6', desc: 'Google – עדכני',         supportsStreaming: true },
  groq:        { name: 'Groq',        emoji: '⚡', color: '#8B5CF6', desc: 'מהירות גבוהה',           supportsStreaming: true },
  openrouter:  { name: 'OpenRouter',  emoji: '🌐', color: '#06B6D4', desc: '100+ מודלים',            supportsStreaming: true },
  mistral:     { name: 'Mistral',     emoji: '🌪️', color: '#F97316', desc: 'אירופי, רב-לשוני',      supportsStreaming: true },
  deepseek:    { name: 'DeepSeek',    emoji: '🐋', color: '#6366F1', desc: 'מצוין לקוד',            supportsStreaming: true },
  perplexity:  { name: 'Perplexity',  emoji: '🔍', color: '#14B8A6', desc: 'חיפוש אינטרנט',         supportsStreaming: true },
  elevenlabs:  { name: 'ElevenLabs',  emoji: '🎙️', color: '#F59E0B', desc: 'טקסט לקול',            supportsStreaming: false, supportsVoice: true },
  dalle:       { name: 'DALL-E 3',    emoji: '🎨', color: '#EC4899', desc: 'יצירת תמונות',          supportsStreaming: false, supportsImages: true },
}

export const DEFAULT_API_KEYS: ApiKeys = {
  claude: '', gpt: '', gemini: '', groq: '',
  openrouter: '', mistral: '', deepseek: '',
  perplexity: '', elevenlabs: '', dalle: '',
}

export const DEFAULT_SYSTEM_PROMPT =
  'You are a powerful AI orchestrator. Be helpful, concise, and accurate. Answer in the user\'s language.'

export const STORAGE_KEYS = {
  CONVERSATIONS: 'aio_conversations_v1',
  SETTINGS: 'aio_settings_v1',
  CACHE: 'aio_cache_v1',
} as const

export const RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE: 30,
  WINDOW_MS: 60_000,
} as const

export const CACHE_TTL = {
  SHORT: 5 * 60 * 1000,
  MEDIUM: 30 * 60 * 1000,
  LONG: 24 * 60 * 60 * 1000,
} as const

// ── Default Prompt Templates ───────────────────────────────

export const DEFAULT_TEMPLATES: PromptTemplate[] = [
  { id: 'tpl-1', name: 'סיכום מסמך', description: 'מסכם מסמך ארוך לנקודות עיקריות', content: 'אנא סכם את הטקסט הבא בנקודות עיקריות, תוך שמירה על המידע החשוב ביותר:\n\n{{input}}', category: 'analysis', icon: '📝', createdAt: 0 },
  { id: 'tpl-2', name: 'בדיקת קוד', description: 'מנתח קוד ומוצא בעיות', content: 'אנא בדוק את הקוד הבא, מצא באגים, בעיות ביצועים, ואמור לי כיצד לשפר אותו:\n\n```\n{{input}}\n```', category: 'coding', icon: '🔍', createdAt: 0 },
  { id: 'tpl-3', name: 'כתיבת מייל מקצועי', description: 'כותב מייל עסקי ברור ומקצועי', content: 'כתוב מייל מקצועי על הנושא הבא. הטון צריך להיות {{tone}} והמייל צריך להיות קצר ולעניין:\n\nנושא: {{input}}', category: 'writing', icon: '✉️', createdAt: 0 },
  { id: 'tpl-4', name: 'הסבר פשוט', description: 'מסביר רעיון מורכב בשפה פשוטה', content: 'הסבר את הנושא הבא בצורה פשוטה מאוד, כאילו אתה מסביר לאדם שאין לו ידע מוקדם בתחום:\n\n{{input}}', category: 'general', icon: '💡', createdAt: 0 },
  { id: 'tpl-5', name: 'רעיונות סיעור מוחות', description: 'מייצר רעיונות יצירתיים', content: 'תן לי 10 רעיונות יצירתיים ומגוונים על הנושא הבא. חשוב מחוץ לקופסה:\n\n{{input}}', category: 'general', icon: '🧠', createdAt: 0 },
  { id: 'tpl-6', name: 'תיעוד קוד', description: 'כותב תיעוד מפורט לקוד', content: 'כתוב תיעוד מקצועי לקוד הבא כולל: תיאור, פרמטרים, ערכי החזרה ודוגמאות שימוש:\n\n```\n{{input}}\n```', category: 'coding', icon: '📖', createdAt: 0 },
]

export const DEFAULT_PERSONAS: Persona[] = [
  { id: 'per-1', name: 'מומחה קוד', description: 'עוזר מקצועי לפיתוח תוכנה', systemPrompt: 'You are an expert software engineer with deep knowledge in modern web development, system design, and best practices. Be precise, provide working code examples, and explain your reasoning. Prefer TypeScript, React, and modern patterns.', icon: '👨‍💻', color: '#6366F1', preferredModel: 'deepseek', createdAt: 0 },
  { id: 'per-2', name: 'מורה מסביר', description: 'מסביר נושאים מורכבים בצורה פשוטה', systemPrompt: 'You are a patient and creative teacher. Explain complex concepts using simple language, real-world analogies, and step-by-step breakdowns. Always check understanding and encourage questions. Adapt explanations to the student\'s level.', icon: '👩‍🏫', color: '#10B981', preferredModel: 'claude', createdAt: 0 },
  { id: 'per-3', name: 'יועץ עסקי', description: 'ניתוח עסקי ואסטרטגי', systemPrompt: 'You are a senior business consultant with expertise in strategy, operations, and market analysis. Provide data-driven insights, practical recommendations, and consider multiple stakeholder perspectives. Be direct and action-oriented.', icon: '💼', color: '#D97706', preferredModel: 'gpt', createdAt: 0 },
  { id: 'per-4', name: 'כותב יצירתי', description: 'עוזר לכתיבה יצירתית ותוכן', systemPrompt: 'You are a creative writer and content creator with a flair for engaging storytelling and persuasive writing. Help craft compelling narratives, catchy copy, and imaginative content. Offer multiple styles and variations when appropriate.', icon: '✍️', color: '#EC4899', preferredModel: 'claude', createdAt: 0 },
  { id: 'per-5', name: 'חוקר מידע', description: 'חיפוש וניתוח מידע עדכני', systemPrompt: 'You are a thorough research assistant. Search for accurate, up-to-date information, cite sources when possible, and present findings in a clear structured format. Always acknowledge uncertainty and distinguish between facts and opinions.', icon: '🔬', color: '#14B8A6', preferredModel: 'perplexity', createdAt: 0 },
]

export const DEFAULT_MODEL_PRESETS: ModelPreset[] = [
  { id: 'pre-1', name: 'מהיר וקצר', description: 'תשובות מהירות לשאלות פשוטות', model: 'groq', systemPrompt: 'Be concise and direct. Answer in 1-3 sentences when possible. Use the user\'s language.', icon: '⚡' },
  { id: 'pre-2', name: 'ניתוח מעמיק', description: 'ניתוח מפורט ומקצועי', model: 'claude', systemPrompt: 'Provide thorough, nuanced analysis. Consider multiple perspectives. Structure your response with clear sections. Use the user\'s language.', icon: '🧠' },
  { id: 'pre-3', name: 'חיפוש אינטרנט', description: 'מידע עדכני מהאינטרנט', model: 'perplexity', systemPrompt: 'Search for current information. Cite sources. Provide accurate and up-to-date answers. Use the user\'s language.', icon: '🔍' },
  { id: 'pre-4', name: 'קוד מקצועי', description: 'כתיבת קוד איכותי', model: 'deepseek', systemPrompt: 'Write clean, production-ready code with comments. Follow best practices. Explain your implementation choices. Prefer TypeScript.', icon: '💻' },
]

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'k', modifier: 'ctrl', description: 'שיחה חדשה', action: 'new_conversation' },
  { key: 'k', modifier: 'meta', description: 'שיחה חדשה', action: 'new_conversation' },
  { key: '/', modifier: 'ctrl', description: 'פקודות מהירות', action: 'command_palette' },
  { key: 'b', modifier: 'ctrl', description: 'פתח/סגור Sidebar', action: 'toggle_sidebar' },
  { key: ',', modifier: 'ctrl', description: 'הגדרות', action: 'open_settings' },
  { key: 'Escape', modifier: 'none', description: 'סגור פאנל / בטל', action: 'close_panel' },
  { key: 'Enter', modifier: 'none', description: 'שלח הודעה', action: 'send_message' },
  { key: 'Enter', modifier: 'shift', description: 'שורה חדשה', action: 'new_line' },
]
