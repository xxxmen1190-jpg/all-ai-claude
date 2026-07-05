import type { Intent } from '../../types'

interface IntentRule {
  intent: Intent
  keywords: string[]
  weight: number
}

interface ClassificationResult {
  intent: Intent
  confidence: number
  scores: Partial<Record<Intent, number>>
}

/**
 * Keyword-weighted scoring classifier (no regex chains, no single if/else ladder).
 * Each rule contributes a score; the highest-scoring intent wins.
 * Designed so new intents/keywords can be added without touching logic.
 */
export class IntentClassifier {
  private readonly rules: IntentRule[] = [
    {
      intent: 'image',
      weight: 3,
      keywords: ['תמונ', 'צייר', 'image', 'draw', 'generate image', 'דמות', 'ויזואל', 'איור', 'picture', 'photo of'],
    },
    {
      intent: 'voice',
      weight: 3,
      keywords: ['קול', 'דבר בקול', 'voice', 'read aloud', 'audio', 'תשמיע', 'האזן', 'text to speech', 'tts'],
    },
    {
      intent: 'search',
      weight: 2,
      keywords: ['חפש', 'מה קורה', 'חדשות', 'search', 'news', 'latest', 'עדכון', 'עכשיו', 'today', 'current', 'מי זה', 'מה זה', 'who is', 'what is'],
    },
    {
      intent: 'code',
      weight: 2,
      keywords: ['קוד', 'code', 'פונקצי', 'function', 'debug', 'error', 'script', 'python', 'javascript', 'typescript', 'תכנת', 'באג', 'שגיאה', 'algorithm', 'refactor'],
    },
    {
      intent: 'translate',
      weight: 2.5,
      keywords: ['תרגם', 'translate', 'translation', 'בשפה', 'in english', 'בעברית', 'in hebrew'],
    },
    {
      intent: 'summarize',
      weight: 2,
      keywords: ['סכם', 'summarize', 'summary', 'תמצית', 'tldr', 'בקצרה', 'תקציר'],
    },
    {
      intent: 'fast',
      weight: 1.5,
      keywords: ['מהיר', 'quick', 'fast', 'asap', 'instant'],
    },
    {
      intent: 'creative',
      weight: 1.5,
      keywords: ['כתוב', 'סיפור', 'שיר', 'write a', 'story', 'poem', 'יצירת', 'המצא', 'פרסומת', 'תסריט', 'creative'],
    },
    {
      intent: 'reasoning',
      weight: 1.5,
      keywords: ['למה', 'הסבר', 'נתח', 'השווה', 'why', 'explain', 'analyze', 'compare', 'תחשוב', 'מה דעתך', 'pros and cons', 'reasoning'],
    },
    {
      intent: 'agent',
      weight: 2.5,
      keywords: ['חקור ותכתוב', 'research and write', 'מצא ותסכם', 'find and summarize', 'multi-step', 'תהליך מלא'],
    },
  ]

  classify(text: string): ClassificationResult {
    const normalized = text.toLowerCase()
    const scores: Partial<Record<Intent, number>> = {}

    for (const rule of this.rules) {
      const matches = rule.keywords.filter((kw) => normalized.includes(kw)).length
      if (matches > 0) {
        scores[rule.intent] = (scores[rule.intent] ?? 0) + matches * rule.weight
      }
    }

    const entries = Object.entries(scores) as [Intent, number][]
    if (entries.length === 0) {
      return { intent: 'general', confidence: 1, scores: {} }
    }

    entries.sort((a, b) => b[1] - a[1])
    const [topIntent, topScore] = entries[0]
    const totalScore = entries.reduce((sum, [, s]) => sum + s, 0)
    const confidence = totalScore > 0 ? topScore / totalScore : 0

    return { intent: topIntent, confidence, scores }
  }
}
