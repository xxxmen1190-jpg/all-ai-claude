import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { CodeBlock } from './CodeBlock'
import 'katex/dist/katex.min.css'

interface Props {
  content: string
}

const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg)$/i
const AUDIO_EXTENSIONS = /\.(mp3|wav|m4a)$/i

/**
 * Full Markdown pipeline: GFM (tables, strikethrough), math (LaTeX via KaTeX),
 * fenced code with syntax highlighting + Mermaid diagram detection,
 * and automatic media preview (image/video/audio) for direct media links.
 */
export function MarkdownRenderer({ content }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '')
          const isBlock = Boolean(match)
          const raw = String(children).replace(/\n$/, '')

          if (isBlock) {
            return <CodeBlock language={match![1]} code={raw} />
          }
          return (
            <code className="bg-muted px-1.5 py-0.5 rounded text-[12px] font-mono" {...props}>
              {children}
            </code>
          )
        },
        a({ href, children }) {
          if (href && VIDEO_EXTENSIONS.test(href)) {
            return <video controls src={href} className="my-2 rounded-lg max-w-full border border-border" />
          }
          if (href && AUDIO_EXTENSIONS.test(href)) {
            return <audio controls src={href} className="my-2 w-full" />
          }
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:opacity-80">
              {children}
            </a>
          )
        },
        img({ src, alt }) {
          return (
            <img
              src={src}
              alt={alt || 'image'}
              loading="lazy"
              className="my-2 rounded-lg max-w-full border border-border"
            />
          )
        },
        table({ children }) {
          return (
            <div className="my-2 overflow-x-auto">
              <table className="w-full text-xs border-collapse">{children}</table>
            </div>
          )
        },
        thead({ children }) {
          return <thead className="bg-muted">{children}</thead>
        },
        th({ children }) {
          return <th className="border border-border px-2 py-1.5 text-right font-semibold">{children}</th>
        },
        td({ children }) {
          return <td className="border border-border px-2 py-1.5">{children}</td>
        },
        p({ children }) {
          return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
        },
        ul({ children }) {
          return <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
        },
        ol({ children }) {
          return <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
        },
        h1({ children }) {
          return <h1 className="text-base font-bold mb-2 mt-1">{children}</h1>
        },
        h2({ children }) {
          return <h2 className="text-sm font-bold mb-2 mt-1">{children}</h2>
        },
        h3({ children }) {
          return <h3 className="text-sm font-semibold mb-1">{children}</h3>
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-r-2 border-primary pr-3 my-2 text-muted-foreground italic">
              {children}
            </blockquote>
          )
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
