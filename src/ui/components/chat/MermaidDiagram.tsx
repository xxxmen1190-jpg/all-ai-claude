import { useEffect, useRef, useState, useId } from 'react'

/** Mermaid is ~1 MB — imported dynamically so it only loads when needed. */
export function MermaidDiagram({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const id = useId().replace(/:/g, '')

  useEffect(() => {
    let cancelled = false
    async function render() {
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'strict' })
        const { svg } = await mermaid.render(`mermaid-${id}`, code)
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Mermaid render error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    render()
    return () => { cancelled = true }
  }, [code, id])

  if (loading) return <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground animate-pulse">טוען דיאגרמה...</div>
  if (error) return <pre className="bg-muted rounded-lg p-3 text-xs text-destructive">{error}</pre>
  return <div ref={containerRef} className="my-2 bg-card border border-border rounded-lg p-3 overflow-x-auto" />
}
