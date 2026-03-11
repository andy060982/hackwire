import { CategoryId } from './categories'
import rawArticles from './articles-data.json'

export type Severity = 'critical' | 'high' | 'medium' | 'low' | null

export interface Article {
  slug: string
  headline: string
  summary: string
  body: string
  category: CategoryId
  source: string
  sourceUrl: string
  publishedAt: string
  severity: Severity
  tags: string[]
}

export const articles: Article[] = rawArticles as Article[]

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug)
}

export function getArticlesByCategory(category: string): Article[] {
  return articles.filter((a) => a.category === category)
}

export function getFeaturedArticle(): Article {
  return articles[0]
}

export function getLatestArticles(limit?: number): Article[] {
  const sorted = [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
  return limit ? sorted.slice(0, limit) : sorted
}

export function getRelatedArticles(article: Article, limit = 3): Article[] {
  return articles
    .filter((a) => a.slug !== article.slug && a.category === article.category)
    .slice(0, limit)
}

export function formatTimeAgo(dateString: string): string {
  const now = new Date('2025-01-14T12:00:00Z')
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return '1d ago'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
