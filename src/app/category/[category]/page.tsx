import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getArticlesByCategory } from '@/lib/articles'
import { categories, getCategoryById } from '@/lib/categories'
import NewsCard from '@/components/NewsCard'
import CategoryBadge from '@/components/CategoryBadge'

interface Props {
  params: Promise<{ category: string }>
}

export async function generateStaticParams() {
  return categories.map((c) => ({ category: c.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  const cat = getCategoryById(category)
  if (!cat) return {}

  return {
    title: `${cat.label} — HackWire`,
    description: `Latest cybersecurity ${cat.label.toLowerCase()} news and analysis from HackWire.`,
    openGraph: {
      title: `${cat.label} | HackWire`,
      description: `Cybersecurity ${cat.label.toLowerCase()} coverage, decoded.`,
      url: `https://hackwire.news/category/${category}`,
    },
  }
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params
  const cat = getCategoryById(category)
  if (!cat) notFound()

  const catArticles = getArticlesByCategory(category)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Category header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <CategoryBadge categoryId={category} />
          <span className="text-gray-400 dark:text-gray-600 text-xs font-mono">{catArticles.length} stories</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold font-mono text-slate-800 dark:text-white mb-2">
          {cat.label}
        </h1>
        <p className="text-gray-500 dark:text-gray-500 text-sm">
          Latest cybersecurity {cat.label.toLowerCase()} news, analysis, and intelligence.
        </p>
        <div className="mt-4 h-px bg-gradient-to-r from-[#059669]/30 dark:from-[#00FF88]/30 to-transparent" />
      </div>

      {/* Category nav */}
      <nav className="flex flex-wrap items-center gap-2 mb-8">
        {categories.map((c) => (
          <a
            key={c.id}
            href={`/category/${c.id}`}
            className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-all border ${
              c.id === category
                ? `${c.color} ${c.bgColor} ${c.borderColor}`
                : 'text-gray-500 dark:text-gray-600 bg-transparent border-gray-200 dark:border-[#1E1E2E] hover:border-gray-400 dark:hover:border-gray-600'
            }`}
          >
            {c.emoji} {c.label.toUpperCase()}
          </a>
        ))}
      </nav>

      {catArticles.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 dark:text-gray-600 font-mono text-sm">No articles found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {catArticles.map((article) => (
            <NewsCard key={article.slug} article={article} />
          ))}
        </div>
      )}
    </div>
  )
}
