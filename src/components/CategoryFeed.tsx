import Link from 'next/link'
import { Article, formatTimeAgo } from '@/lib/articles'
import { getCategoryById } from '@/lib/categories'

interface CategoryFeedProps {
  categoryId: string
  articles: Article[]
  limit?: number
}

const severityDotColors: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-400',
}

export default function CategoryFeed({ categoryId, articles, limit = 8 }: CategoryFeedProps) {
  const category = getCategoryById(categoryId)
  if (!category) return null

  const items = articles.slice(0, limit)

  return (
    <div
      id={categoryId}
      className="bg-white dark:bg-[#0f0f1a] border border-gray-200 dark:border-[#1e1e2e] rounded-lg overflow-hidden shadow-sm dark:shadow-none"
    >
      {/* Category header */}
      <div className="px-4 py-2.5 border-b border-gray-200 dark:border-[#1e1e2e] bg-gray-50 dark:bg-[#0a0a14] flex items-center justify-between">
        <Link href={`/category/${categoryId}`} className="flex items-center gap-2 group">
          <span>{category.emoji}</span>
          <h3 className="text-sm font-mono font-bold text-slate-800 dark:text-white group-hover:text-[#059669] dark:group-hover:text-[#00FF88] transition-colors">
            {category.label}
          </h3>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-gray-400 dark:text-gray-600">{articles.length} items</span>
          <Link
            href={`/category/${categoryId}`}
            className="text-[10px] font-mono text-[#059669] dark:text-[#00FF88] hover:underline"
          >
            View all
          </Link>
        </div>
      </div>

      {/* Items list */}
      <div className="divide-y divide-gray-100 dark:divide-[#1e1e2e]/60">
        {items.map((article) => (
            <div key={article.slug} className="group">
              <Link
                href={`/news/${article.slug}`}
                className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-[#1a1a2e]/50 transition-colors"
              >
                <span
                  className={`mt-1.5 flex-shrink-0 w-2 h-2 rounded-full ${severityDotColors[article.severity || 'medium']}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 dark:text-gray-300 leading-snug group-hover:text-[#059669] dark:group-hover:text-white transition-colors line-clamp-2">
                    {article.headline}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-gray-400 dark:text-gray-600">
                    <span className="text-[#059669]/60 dark:text-[#00FF88]/50">{article.source}</span>
                    <span>&middot;</span>
                    <span>{formatTimeAgo(article.publishedAt)}</span>
                    <span className="ml-auto text-[#059669] dark:text-[#00FF88] opacity-0 group-hover:opacity-100 transition-opacity">
                      Read &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
      </div>
    </div>
  )
}
