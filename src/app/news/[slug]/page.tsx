import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getArticleBySlug, getRelatedArticles, formatTimeAgo, articles } from '@/lib/articles'
import CategoryBadge from '@/components/CategoryBadge'
import SeverityBadge from '@/components/SeverityBadge'
import NewsCard from '@/components/NewsCard'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) return {}

  return {
    title: article.headline,
    description: article.summary,
    openGraph: {
      title: article.headline,
      description: article.summary,
      url: `https://hackwire.news/news/${article.slug}`,
      type: 'article',
      publishedTime: article.publishedAt,
      tags: article.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.headline,
      description: article.summary,
    },
  }
}

function renderBody(body: string) {
  // Convert **bold**, ## headings, code blocks, and newlines to HTML
  const lines = body.split('\n')
  const htmlLines: string[] = []
  let inCodeBlock = false
  let codeContent: string[] = []

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        htmlLines.push(`<pre><code>${codeContent.join('\n')}</code></pre>`)
        codeContent = []
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeContent.push(line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
      continue
    }

    if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
      htmlLines.push(`<h2>${line.slice(2, -2)}</h2>`)
    } else if (line.startsWith('- ')) {
      htmlLines.push(`<li>${processInline(line.slice(2))}</li>`)
    } else if (line.trim() === '') {
      htmlLines.push('<br />')
    } else {
      htmlLines.push(`<p>${processInline(line)}</p>`)
    }
  }

  return htmlLines.join('')
}

function processInline(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) notFound()

  const related = getRelatedArticles(article)
  const articleDate = new Date(article.publishedAt)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.headline,
    description: article.summary,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    author: { '@type': 'Organization', name: 'HackWire Editorial' },
    publisher: {
      '@type': 'Organization',
      name: 'HackWire',
      url: 'https://hackwire.news',
    },
    url: `https://hackwire.news/news/${article.slug}`,
    keywords: article.tags.join(', '),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-mono text-gray-400 dark:text-gray-600 mb-6">
          <Link href="/" className="hover:text-[#059669] dark:hover:text-[#00FF88] transition-colors">HOME</Link>
          <span>/</span>
          <Link href={`/category/${article.category}`} className="hover:text-[#059669] dark:hover:text-[#00FF88] transition-colors uppercase">
            {article.category}
          </Link>
          <span>/</span>
          <span className="text-gray-500 truncate max-w-xs">{article.slug.toUpperCase()}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Article content */}
          <div className="lg:col-span-2">
            {/* Category + severity */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <CategoryBadge categoryId={article.category} />
              {article.severity && <SeverityBadge severity={article.severity} />}
            </div>

            {/* Headline */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 dark:text-white leading-tight font-mono mb-5">
              {article.headline}
            </h1>

            {/* Summary */}
            <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed mb-6 pb-6 border-b border-gray-200 dark:border-[#1E1E2E]">
              {article.summary}
            </p>

            {/* Meta */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4 text-sm">
                {article.sourceUrl ? <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[#059669]/80 dark:text-[#00FF88]/80 font-mono font-medium hover:underline">{article.source}</a> : <span className="text-[#059669]/80 dark:text-[#00FF88]/80 font-mono font-medium">{article.source}</span>}
                <span className="text-gray-400 dark:text-gray-600">·</span>
                <time dateTime={article.publishedAt} className="text-gray-500 font-mono">
                  {articleDate.toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </time>
                <span className="text-gray-400 dark:text-gray-600">·</span>
                <span className="text-gray-500 font-mono">{formatTimeAgo(article.publishedAt)}</span>
              </div>

              {/* Share buttons */}
              <div className="flex items-center gap-2">
                <span className="text-gray-400 dark:text-gray-600 text-xs font-mono">SHARE:</span>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.headline)}&url=${encodeURIComponent(`https://hackwire.news/news/${article.slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 border border-gray-200 dark:border-[#1E1E2E] text-gray-400 dark:text-gray-500 text-xs font-mono rounded hover:border-[#059669]/30 dark:hover:border-[#00FF88]/30 hover:text-[#059669] dark:hover:text-[#00FF88] transition-colors"
                >
                  𝕏
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://hackwire.news/news/${article.slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 border border-gray-200 dark:border-[#1E1E2E] text-gray-400 dark:text-gray-500 text-xs font-mono rounded hover:border-[#059669]/30 dark:hover:border-[#00FF88]/30 hover:text-[#059669] dark:hover:text-[#00FF88] transition-colors"
                >
                  IN
                </a>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 dark:bg-[#0F0F1A] border border-gray-200 dark:border-[#1E1E2E] text-gray-500 dark:text-gray-500 text-xs font-mono rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Article body */}
            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: renderBody(article.body) }}
            />

            {/* TL;DR Section */}
            {article.tldr && (
              <div className="mt-10 p-4 bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500 dark:border-blue-400 rounded">
                <div className="flex items-start gap-3">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-lg mt-0.5">⚡</span>
                  <div>
                    <h3 className="text-blue-900 dark:text-blue-300 font-mono font-bold text-sm uppercase mb-2">TL;DR – For the Busy Reader</h3>
                    <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                      {article.tldr}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Attribution */}
            <div className="mt-10 pt-6 border-t border-gray-200 dark:border-[#1E1E2E]">
              <p className="text-xs text-gray-400 dark:text-gray-600 font-mono">
                Source attribution: {article.source}. HackWire aggregates and contextualizes publicly reported cybersecurity news for informational purposes.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-32 space-y-6">
              {/* Quick facts */}
              <div className="bg-white dark:bg-[#0F0F1A] border border-gray-200 dark:border-[#1E1E2E] rounded-lg overflow-hidden shadow-sm dark:shadow-none">
                <div className="px-4 py-3 bg-gray-50 dark:bg-[#0A0A14] border-b border-gray-200 dark:border-[#1E1E2E]">
                  <span className="text-xs font-mono font-bold text-[#059669] dark:text-[#00FF88] tracking-widest uppercase">Quick Facts</span>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <span className="text-gray-400 dark:text-gray-600 text-xs font-mono block mb-1">Category</span>
                    <CategoryBadge categoryId={article.category} size="sm" />
                  </div>
                  {article.severity && (
                    <div>
                      <span className="text-gray-400 dark:text-gray-600 text-xs font-mono block mb-1">Severity</span>
                      <SeverityBadge severity={article.severity} />
                    </div>
                  )}
                  <div>
                    <span className="text-gray-400 dark:text-gray-600 text-xs font-mono block mb-1">Published</span>
                    <span className="text-slate-800 dark:text-white text-sm font-mono">
                      {articleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-600 text-xs font-mono block mb-1">Source</span>
                    {article.sourceUrl ? <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[#059669]/70 dark:text-[#00FF88]/70 text-sm font-mono hover:underline">{article.source}</a> : <span className="text-[#059669]/70 dark:text-[#00FF88]/70 text-sm font-mono">{article.source}</span>}
                  </div>
                </div>
              </div>

              {/* Related articles */}
              {related.length > 0 && (
                <div className="bg-white dark:bg-[#0F0F1A] border border-gray-200 dark:border-[#1E1E2E] rounded-lg overflow-hidden shadow-sm dark:shadow-none">
                  <div className="px-4 py-3 bg-gray-50 dark:bg-[#0A0A14] border-b border-gray-200 dark:border-[#1E1E2E]">
                    <span className="text-xs font-mono font-bold text-[#059669] dark:text-[#00FF88] tracking-widest uppercase">Related Stories</span>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-[#1E1E2E]">
                    {related.map((rel) => (
                      <div key={rel.slug} className="p-4">
                        <NewsCard article={rel} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </article>
    </>
  )
}
