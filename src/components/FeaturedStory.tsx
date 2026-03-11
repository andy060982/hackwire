import Link from 'next/link'
import { Article, formatTimeAgo } from '@/lib/articles'
import CategoryBadge from './CategoryBadge'
import SeverityBadge from './SeverityBadge'

interface FeaturedStoryProps {
  article: Article
}

export default function FeaturedStory({ article }: FeaturedStoryProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[#1E1E2E] bg-[#0A0A14]">
      {/* Green pulse accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00FF88] to-transparent" />

      <div className="relative p-6 md:p-10">
        {/* Terminal-style header */}
        <div className="flex items-center gap-2 mb-6 font-mono text-xs text-[#00FF88]/50">
          <span className="text-[#00FF88]">▶</span>
          <span>FEATURED_STORY</span>
          <span className="ml-auto flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
            LIVE
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <CategoryBadge categoryId={article.category} />
          {article.severity && <SeverityBadge severity={article.severity} />}
        </div>

        <Link href={`/news/${article.slug}`} className="group">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white group-hover:text-[#00FF88] transition-colors duration-300 leading-tight font-mono mb-4">
            {article.headline}
          </h1>
        </Link>

        <p className="text-gray-400 text-base md:text-lg leading-relaxed mb-6 max-w-3xl">
          {article.summary}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="text-[#00FF88]/70 font-mono font-medium">{article.source}</span>
            <span>·</span>
            <time dateTime={article.publishedAt} className="font-mono">
              {formatTimeAgo(article.publishedAt)}
            </time>
          </div>

          <Link
            href={`/news/${article.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#00FF88]/40 text-[#00FF88] text-sm font-mono font-semibold rounded hover:bg-[#00FF88]/10 transition-all duration-200"
          >
            READ FULL STORY
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
