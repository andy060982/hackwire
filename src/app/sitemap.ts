import { MetadataRoute } from 'next'
import { articles } from '@/lib/articles'
import { categories } from '@/lib/categories'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://hackwire.news'

  const articleUrls = articles.map((article) => ({
    url: `${base}/news/${article.slug}`,
    lastModified: new Date(article.publishedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const categoryUrls = categories.map((cat) => ({
    url: `${base}/category/${cat.id}`,
    lastModified: new Date(),
    changeFrequency: 'hourly' as const,
    priority: 0.7,
  }))

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${base}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    ...categoryUrls,
    ...articleUrls,
  ]
}
