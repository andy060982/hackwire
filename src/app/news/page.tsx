import type { Metadata } from 'next'
import Link from 'next/link'
import { getLatestArticles } from '@/lib/articles'
import NewsCard from '@/components/NewsCard'

const PER_PAGE = 24

interface Props {
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page } = await searchParams
  const pageNum = Math.max(1, parseInt(page ?? '1', 10) || 1)
  const base = 'https://www.hackwire.news/news'
  const canonical = pageNum > 1 ? `${base}?page=${pageNum}` : base
  return {
    title: pageNum > 1 ? `All Stories — Page ${pageNum} | HackWire` : 'All Stories | HackWire',
    description:
      'The full HackWire archive — every cybersecurity story on breaches, ransomware, malware, and vulnerabilities, newest first.',
    alternates: { canonical },
    openGraph: {
      title: 'All Stories | HackWire',
      description: 'The full HackWire cybersecurity news archive, newest first.',
      url: canonical,
      images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image' },
  }
}

export default async function NewsArchivePage({ searchParams }: Props) {
  const { page } = await searchParams
  const all = getLatestArticles()
  const totalPages = Math.max(1, Math.ceil(all.length / PER_PAGE))
  const pageNum = Math.min(totalPages, Math.max(1, parseInt(page ?? '1', 10) || 1))
  const start = (pageNum - 1) * PER_PAGE
  const pageArticles = all.slice(start, start + PER_PAGE)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold font-mono text-slate-800 dark:text-white mb-2">
          All Stories
        </h1>
        <p className="text-gray-500 dark:text-gray-500 text-sm">
          The full HackWire archive — {all.length.toLocaleString()} stories, newest first.
        </p>
        <div className="mt-4 h-px bg-gradient-to-r from-[#059669]/30 dark:from-[#00FF88]/30 to-transparent" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pageArticles.map((article) => (
          <NewsCard key={article.slug} article={article} />
        ))}
      </div>

      <nav className="mt-10 flex items-center justify-between gap-4" aria-label="Archive pagination">
        {pageNum > 1 ? (
          <Link
            href={pageNum - 1 === 1 ? '/news' : `/news?page=${pageNum - 1}`}
            rel="prev"
            className="px-5 py-2.5 rounded border border-[#059669]/30 dark:border-[#00FF88]/30 text-[#059669] dark:text-[#00FF88] text-sm font-mono hover:bg-[#059669]/5 dark:hover:bg-[#00FF88]/5 transition-colors"
          >
            &larr; Newer
          </Link>
        ) : (
          <span />
        )}

        <span className="text-gray-500 dark:text-gray-500 text-xs font-mono">
          Page {pageNum} of {totalPages}
        </span>

        {pageNum < totalPages ? (
          <Link
            href={`/news?page=${pageNum + 1}`}
            rel="next"
            className="px-5 py-2.5 rounded border border-[#059669]/30 dark:border-[#00FF88]/30 text-[#059669] dark:text-[#00FF88] text-sm font-mono hover:bg-[#059669]/5 dark:hover:bg-[#00FF88]/5 transition-colors"
          >
            Older &rarr;
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  )
}
