import type { TextChunk } from './DocumentTypes'

interface IndexEntry {
  chunk: TextChunk
  tfidf: Map<string, number>
  norm: number
}

/**
 * Local TF-IDF vector index — no server, no external API, no WASM.
 * Suitable for personal-use RAG on small-to-medium document sets
 * (< ~5 MB of text). Returns the N most semantically relevant chunks
 * for a query using cosine similarity on TF-IDF vectors.
 */
export class TFIDFVectorIndex {
  private entries: IndexEntry[] = []
  private idf = new Map<string, number>()

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s\u0590-\u05FF]/g, ' ')  // keep Hebrew chars
      .split(/\s+/)
      .filter((t) => t.length > 1)
  }

  private tf(tokens: string[]): Map<string, number> {
    const freq = new Map<string, number>()
    for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1)
    for (const [term, count] of freq) freq.set(term, count / tokens.length)
    return freq
  }

  private computeIDF(): void {
    const docCount = this.entries.length
    const df = new Map<string, number>()
    for (const entry of this.entries) {
      for (const term of entry.tfidf.keys()) {
        df.set(term, (df.get(term) ?? 0) + 1)
      }
    }
    this.idf.clear()
    for (const [term, count] of df) {
      this.idf.set(term, Math.log((docCount + 1) / (count + 1)) + 1) // smooth IDF
    }
  }

  private tfidfVector(tfMap: Map<string, number>): Map<string, number> {
    const vec = new Map<string, number>()
    for (const [term, tfScore] of tfMap) {
      const idfScore = this.idf.get(term) ?? 0
      vec.set(term, tfScore * idfScore)
    }
    return vec
  }

  private euclideanNorm(vec: Map<string, number>): number {
    let sum = 0
    for (const v of vec.values()) sum += v * v
    return Math.sqrt(sum)
  }

  private cosineSimilarity(a: Map<string, number>, aNorm: number, b: Map<string, number>, bNorm: number): number {
    if (aNorm === 0 || bNorm === 0) return 0
    let dot = 0
    for (const [term, aVal] of a) {
      const bVal = b.get(term)
      if (bVal !== undefined) dot += aVal * bVal
    }
    return dot / (aNorm * bNorm)
  }

  /** Add chunks to the index. Rebuilds IDF after insertion. */
  add(chunks: TextChunk[]): void {
    for (const chunk of chunks) {
      const tokens = this.tokenize(chunk.text)
      const tfMap = this.tf(tokens)
      this.entries.push({ chunk, tfidf: tfMap, norm: 0 })
    }
    this.computeIDF()
    // Recompute TF-IDF vectors and norms with updated IDF
    for (const entry of this.entries) {
      const vec = this.tfidfVector(entry.tfidf)
      entry.tfidf = vec
      entry.norm = this.euclideanNorm(vec)
    }
  }

  /** Remove all chunks belonging to a document. Rebuilds index. */
  remove(documentId: string): void {
    this.entries = this.entries.filter((e) => e.chunk.documentId !== documentId)
    if (this.entries.length > 0) {
      // Re-index from scratch
      const chunks = this.entries.map((e) => e.chunk)
      this.entries = []
      this.idf.clear()
      this.add(chunks)
    } else {
      this.idf.clear()
    }
  }

  /** Returns up to `topK` most relevant chunks for the query. */
  query(queryText: string, topK = 5): Array<{ chunk: TextChunk; score: number }> {
    if (this.entries.length === 0) return []

    const queryTokens = this.tokenize(queryText)
    const queryTF = this.tf(queryTokens)
    const queryVec = this.tfidfVector(queryTF)
    const queryNorm = this.euclideanNorm(queryVec)

    const scored = this.entries.map((entry) => ({
      chunk: entry.chunk,
      score: this.cosineSimilarity(queryVec, queryNorm, entry.tfidf, entry.norm),
    }))

    return scored.sort((a, b) => b.score - a.score).slice(0, topK).filter((r) => r.score > 0)
  }

  get size(): number {
    return this.entries.length
  }
}
