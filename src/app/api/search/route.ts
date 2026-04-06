import { NextRequest } from 'next/server'
import { articles } from '@/lib/articles'

const PAGE_SIZE = 50

const searchData = articles.map(a => ({
  slug: a.slug,
  headline: a.headline,
  summary: a.summary,
  category: a.category,
}))

export function GET(request: NextRequest) {
  const pageParam = request.nextUrl.searchParams.get('page')
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)

  const totalItems = searchData.length
  const totalPages = Math.ceil(totalItems / PAGE_SIZE)
  const start = (page - 1) * PAGE_SIZE
  const paginatedData = searchData.slice(start, start + PAGE_SIZE)

  return Response.json(
    {
      data: paginatedData,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        totalItems,
        totalPages,
      },
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    }
  )
}
