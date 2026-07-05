import type { ParsedDocument, TextChunk } from './DocumentTypes'
import { TFIDFVectorIndex } from './TFIDFVectorIndex'
import type { AIService } from '../AIService'
import { Logger } from '../logging/Logger'

const TOP_K = 6            // chunks to retrieve per query
const MAX_CONTEXT_CHARS = 6000  // total chars of retrieved context to send

export interface RAGResult {
  answer: string
  sources: { chunk: TextChunk; score: number }[]
}

/**
 * Retrieval-Augmented Generation service.
 * 1. Indexes document chunks in a local TF-IDF vector index (no server).
 * 2. On query: retrieves top-K relevant chunks → injects into prompt → calls AIService.
 */
export class RAGService {
  private index = new TFIDFVectorIndex()
  private documents = new Map<string, ParsedDocument>()

  constructor(private aiService: AIService) {}

  addDocument(doc: ParsedDocument): void {
    if (this.documents.has(doc.id)) this.removeDocument(doc.id)
    this.documents.set(doc.id, doc)
    this.index.add(doc.chunks)
    Logger.info('RAGService', `indexed document: ${doc.name}`, { chunks: doc.chunks.length })
  }

  removeDocument(documentId: string): void {
    this.documents.delete(documentId)
    this.index.remove(documentId)
    Logger.info('RAGService', `removed document: ${documentId}`)
  }

  hasDocuments(): boolean {
    return this.documents.size > 0
  }

  getDocuments(): ParsedDocument[] {
    return Array.from(this.documents.values())
  }

  indexSize(): number {
    return this.index.size
  }

  async query(question: string, signal?: AbortSignal): Promise<RAGResult> {
    const retrieved = this.index.query(question, TOP_K)

    if (retrieved.length === 0) {
      // No relevant chunks — fall through to Claude without context
      const result = await this.aiService.complete({
        text: question,
        history: [],
        systemPrompt: 'You are a helpful assistant. Answer the user question.',
        model: 'claude',
        signal,
        useCache: false,
      })
      return { answer: result.content, sources: [] }
    }

    // Build context from retrieved chunks, respecting the character limit
    let contextChars = 0
    const usedChunks: typeof retrieved = []
    for (const r of retrieved) {
      if (contextChars + r.chunk.text.length > MAX_CONTEXT_CHARS) break
      usedChunks.push(r)
      contextChars += r.chunk.text.length
    }

    const context = usedChunks
      .map((r) => `[מקור: ${r.chunk.documentName}]\n${r.chunk.text}`)
      .join('\n\n---\n\n')

    const systemPrompt = `You are a helpful assistant that answers questions based on provided document context.
Answer ONLY based on the context below. If the answer is not in the context, say so clearly.
Answer in the same language as the question.

CONTEXT:
${context}`

    const result = await this.aiService.complete({
      text: question,
      history: [],
      systemPrompt,
      model: 'claude',
      signal,
      useCache: false,
    })

    Logger.info('RAGService', 'answered query', { question: question.slice(0, 60), chunks: usedChunks.length })

    return { answer: result.content, sources: usedChunks }
  }
}
