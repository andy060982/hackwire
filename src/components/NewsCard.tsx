import Link from 'next/link'
import { Article, formatTimeAgo } from '@/lib/articles'
import CategoryBadge from './CategoryBadge'
import SeverityBadge from './SeverityBadge'

interface NewsCardProps {
  article: Article
  featured?: boolean
}

export default function NewsCard({ article, featured = false }: NewsCardProps) {
  if (featured) {
    return (
      <Link href={`/news/${article.slug}`} className="block group">
        <div className="bg-[#0F0F1A] border border-[#1E1E2E] rounded-lg overflow-hidden hover:border-[#00FF88]/30 transition-all duration-300">
          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <CategoryBadge categoryId={article.category} />
              {article.severity && <SeverityBadge severity={article.severity} />}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white group-hover:text-[#00FF88] transition-colors duration-200 leading-tight mb-3 font-mono">
              {article.headline}
            </h2>
            <p className="text-gray-400 text-base leading-relaxed line-clamp-3 mb-4">
              {article.summary}
            </p>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="text-[#00FF88]/70 font-mono">{article.source}</span>
              <span>·</span>
              <time dateTime={article.publishedAt}>{formatTimeAgo(article.publishedAt)}</time>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/news/${article.slug}`} className="block group">
      <article className="bg-[#0F0F1A] border border-[#1E1E2E] rounded-lg p-4 hover:border-[#00FF88]/20 transition-all duration-300 hover:bg-[#0F0F1A]/80">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <CategoryBadge categoryId={article.category} size="sm" />
          {article.severity && <SeverityBadge severity={article.severity} />}
        </div>
        <h3 className="text-white font-semibold text-sm md:text-base group-hover:text-[#00FF88] transition-colors duration-200 leading-snug mb-2 font-mono">
          {article.headline}
        </h3>
        <p className="text-gray-500 text-xs md:text-sm leading-relaxed line-clamp-2 mb-3">
          {article.summary}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="text-[#00FF88]/50 font-mono">{article.source}</span>
          <span>·</span>
          <time dateTime={article.publishedAt}>{formatTimeAgo(article.publishedAt)}</time>
        </div>
      </article>
    </Link>
  )
}
