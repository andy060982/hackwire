import { articles } from '@/lib/articles'

const searchData = articles.map(a => ({
  slug: a.slug,
  headline: a.headline,
  summary: a.summary,
  category: a.category,
}))

export function GET() {
  return Response.json(searchData, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
