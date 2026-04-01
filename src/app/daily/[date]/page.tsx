import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBriefingBySlug, getAllBriefings } from '@/lib/briefings'

interface Props {
  params: Promise<{ date: string }>
}

export async function generateStaticParams() {
  return getAllBriefings().map((b) => ({ date: b.date }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params
  const briefing = getBriefingBySlug(`daily-${date}`)
  if (!briefing) return {}

  return {
    title: briefing.title,
    description: briefing.summary,
    alternates: {
      canonical: `https://www.hackwire.news/daily/${date}`,
    },
    openGraph: {
      title: briefing.title,
      description: briefing.summary,
      url: `https://www.hackwire.news/daily/${date}`,
      type: 'article',
      publishedTime: briefing.publishedAt,
    },
  }
}

function renderMarkdown(body: string) {
  // Simple markdown rendering — handles headers, bold, italic, links, bullets
  const lines = body.split('\n')
  const elements: React.ReactNode[] = []
  let inList = false
  let listItems: React.ReactNode[] = []

  function processInline(text: string): React.ReactNode[] {
    const parts: React.ReactNode[] = []
    // Process links, bold, italic
    const regex = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g
    let lastIndex = 0
    let match

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }
      if (match[1] && match[2]) {
        // Link
        parts.push(
          <Link key={match.index} href={match[2]} className="text-[#059669] dark:text-[#00FF88] hover:underline">
            {match[1]}
          </Link>
        )
      } else if (match[3]) {
        // Bold
        parts.push(<strong key={match.index}>{match[3]}</strong>)
      } else if (match[4]) {
        // Italic
        parts.push(<em key={match.index}>{match[4]}</em>)
      }
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }
    return parts.length > 0 ? parts : [text]
  }

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc pl-6 space-y-2 mb-6 text-slate-700 dark:text-gray-300">
          {listItems}
        </ul>
      )
      listItems = []
      inList = false
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed === '' || trimmed === '---') {
      flushList()
      continue
    }

    if (trimmed.startsWith('# ')) {
      flushList()
      // Skip H1 — we render the title separately
      continue
    }

    if (trimmed.startsWith('## ')) {
      flushList()
      elements.push(
        <h2 key={i} className="text-xl font-mono font-bold text-slate-800 dark:text-white mt-8 mb-4 border-b border-gray-200 dark:border-[#1E1E2E] pb-2">
          {trimmed.substring(3)}
        </h2>
      )
      continue
    }

    if (trimmed.startsWith('### ')) {
      flushList()
      elements.push(
        <h3 key={i} className="text-lg font-mono font-semibold text-slate-800 dark:text-white mt-6 mb-3">
          {trimmed.substring(4)}
        </h3>
      )
      continue
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true
      listItems.push(
        <li key={i} className="leading-relaxed">
          {processInline(trimmed.substring(2))}
        </li>
      )
      continue
    }

    if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) {
      flushList()
      elements.push(
        <p key={i} className="text-sm text-gray-500 dark:text-gray-500 italic mb-4">
          {trimmed.replace(/^\*|\*$/g, '')}
        </p>
      )
      continue
    }

    flushList()
    elements.push(
      <p key={i} className="text-base leading-relaxed text-slate-700 dark:text-gray-300 mb-4">
        {processInline(trimmed)}
      </p>
    )
  }

  flushList()
  return elements
}

export default async function DailyBriefingPage({ params }: Props) {
  const { date } = await params
  const briefing = getBriefingBySlug(`daily-${date}`)
  if (!briefing) notFound()

  const dateFormatted = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-gray-400 dark:text-gray-500 mb-6">
        <Link href="/" className="hover:text-[#059669] dark:hover:text-[#00FF88]">Home</Link>
        <span>/</span>
        <Link href="/daily" className="hover:text-[#059669] dark:hover:text-[#00FF88]">The Wire</Link>
        <span>/</span>
        <span>{date}</span>
      </div>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[#059669] dark:text-[#00FF88] text-xs font-mono">▶</span>
          <span className="text-xs font-mono font-bold text-[#059669] dark:text-[#00FF88] tracking-widest uppercase">
            The Wire — Daily Briefing
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-mono font-black text-slate-900 dark:text-white mb-3 leading-tight">
          {briefing.title.replace(/^#\s+/, '').replace(/^The Wire — \d{4}-\d{2}-\d{2}$/, `The Wire — ${dateFormatted}`)}
        </h1>
        {briefing.subtitle && (
          <p className="text-lg text-gray-600 dark:text-gray-400 font-mono mb-4">
            {briefing.subtitle}
          </p>
        )}
        <div className="flex items-center gap-4 text-xs font-mono text-gray-400 dark:text-gray-500">
          <time dateTime={briefing.publishedAt}>{dateFormatted}</time>
          <span className="text-[#059669] dark:text-[#00FF88]">{briefing.articleCount} stories analyzed</span>
        </div>
      </header>

      {/* Body */}
      <article className="prose-hackwire">
        {renderMarkdown(briefing.body)}
      </article>

      {/* Navigation */}
      <div className="mt-12 pt-6 border-t border-gray-200 dark:border-[#1E1E2E] flex justify-between">
        <Link href="/daily" className="text-sm font-mono text-[#059669] dark:text-[#00FF88] hover:underline">
          &larr; All briefings
        </Link>
        <Link href="/" className="text-sm font-mono text-[#059669] dark:text-[#00FF88] hover:underline">
          Latest news &rarr;
        </Link>
      </div>
    </div>
  )
}
