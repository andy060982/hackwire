import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllDeepDives } from '@/lib/articles'
import CategoryBadge from '@/components/CategoryBadge'
import SeverityBadge from '@/components/SeverityBadge'
import DateGroup from '@/components/DateGroup'

export const metadata: Metadata = {
  title: 'Featured Analysis Archive',
  description:
    'Browse all AI-enhanced deep-dive analysis articles from HackWire. In-depth cybersecurity coverage of breaches, vulnerabilities, malware, and more.',
  alternates: {
    canonical: 'https://www.hackwire.news/featured',
  },
  openGraph: {
    title: 'Featured Analysis Archive | HackWire',
    description:
      'Browse all AI-enhanced deep-dive analysis articles from HackWire.',
    url: 'https://www.hackwire.news/featured',
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
}

export default function FeaturedArchivePage() {
  const deepDives = getAllDeepDives()

  // Group by date
  const grouped: Record<string, typeof deepDives> = {}
  for (const article of deepDives) {
    const date = article.publishedAt.slice(0, 10)
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(article)
  }
  const sortedDates = Object.keys(grouped).sort().reverse()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[#059669] dark:text-[#00FF88] text-xs font-mono">▶</span>
          <h1 className="text-xs font-mono font-bold text-[#059669] dark:text-[#00FF88] tracking-widest uppercase">
            Featured Analysis Archive
          </h1>
          <div className="flex-1 h-px bg-gradient-to-r from-[#059669]/20 dark:from-[#00FF88]/20 to-transparent ml-2" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-mono">
          {deepDives.length} deep-dive articles across {sortedDates.length} days — click a date to collapse/expand
        </p>
      </div>

      {/* Date-grouped articles */}
      {sortedDates.map((date) => (
        <DateGroup key={date} date={date} count={grouped[date].length}>
          {grouped[date].map((article) => (
            <Link key={article.slug} href={`/news/${article.slug}`} className="block group">
              <article className="bg-white dark:bg-[#0F0F1A] border border-gray-200 dark:border-[#1E1E2E] rounded-lg p-4 hover:border-[#059669]/30 dark:hover:border-[#00FF88]/30 shadow-sm dark:shadow-none transition-all duration-200">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <CategoryBadge categoryId={article.category} size="sm" />
                  {article.severity && <SeverityBadge severity={article.severity} />}
                </div>
                <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-white group-hover:text-[#059669] dark:group-hover:text-[#00FF88] transition-colors duration-200 leading-snug mb-1.5 font-mono">
                  {article.headline}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed line-clamp-2 mb-2">
                  {article.summary}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-600 font-mono">
                  <span className="text-[#059669]/60 dark:text-[#00FF88]/50">{article.source}</span>
                  <span>&middot;</span>
                  <time dateTime={article.publishedAt}>
                    {new Date(article.publishedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </time>
                  <span className="ml-auto text-[#059669] dark:text-[#00FF88] opacity-0 group-hover:opacity-100 transition-opacity">
                    Read &rarr;
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </DateGroup>
      ))}

      {deepDives.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 dark:text-gray-600 text-sm font-mono">
            No featured analysis articles yet. Check back soon.
          </p>
        </div>
      )}
    </div>
  )
}
