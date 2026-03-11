import Link from 'next/link'
import { Article, formatTimeAgo } from '@/lib/articles'
import CategoryBadge from './CategoryBadge'

interface TrendingSidebarProps {
  articles: Article[]
}

export default function TrendingSidebar({ articles }: TrendingSidebarProps) {
  const trending = articles.slice(0, 6)

  return (
    <aside className="bg-[#0F0F1A] border border-[#1E1E2E] rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1E1E2E] bg-[#0A0A14]">
        <span className="text-[#00FF88] text-xs font-mono">▶</span>
        <h2 className="text-xs font-mono font-bold text-[#00FF88] tracking-widest uppercase">
          Trending Now
        </h2>
      </div>

      <div className="divide-y divide-[#1E1E2E]">
        {trending.map((article, index) => (
          <Link
            key={article.slug}
            href={`/news/${article.slug}`}
            className="flex gap-3 p-4 hover:bg-[#1A1A2A] transition-colors duration-200 group"
          >
            <span className="font-mono text-2xl font-bold text-[#1E1E2E] group-hover:text-[#00FF88]/20 transition-colors w-8 flex-shrink-0 leading-none mt-0.5">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <div className="mb-1.5">
                <CategoryBadge categoryId={article.category} size="sm" />
              </div>
              <p className="text-white text-xs font-mono font-medium leading-snug group-hover:text-[#00FF88] transition-colors line-clamp-2">
                {article.headline}
              </p>
              <time className="text-gray-600 text-xs font-mono mt-1 block">
                {formatTimeAgo(article.publishedAt)}
              </time>
            </div>
          </Link>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-[#1E1E2E]">
        <div className="text-xs font-mono text-gray-600 text-center">
          Updated every 15 minutes
        </div>
      </div>
    </aside>
  )
}
