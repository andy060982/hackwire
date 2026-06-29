import type { Metadata } from 'next'
import Link from 'next/link'
import { getLatestArticles, getFeaturedArticle, getFeaturedDeepDives, formatTimeAgo } from '@/lib/articles'
import FeaturedStory from '@/components/FeaturedStory'
import NewsCard from '@/components/NewsCard'
import TrendingSidebar from '@/components/TrendingSidebar'
import NewsletterSignup from '@/components/NewsletterSignup'
import CategoryBadge from '@/components/CategoryBadge'
import SeverityBadge from '@/components/SeverityBadge'

export const metadata: Metadata = {
  title: 'HackWire — Cybersecurity News, Decoded',
  description:
    'HackWire delivers real-time cybersecurity news covering breaches, ransomware, malware, and vulnerabilities — decoded for security professionals. Updated 3x daily from 15 sources.',
  alternates: {
    canonical: 'https://www.hackwire.news',
  },
  openGraph: {
    title: 'HackWire — Cybersecurity News, Decoded',
    description:
      'HackWire delivers real-time cybersecurity news covering breaches, ransomware, malware, and vulnerabilities — decoded for security professionals. Updated 3x daily from 15 sources.',
    url: 'https://www.hackwire.news',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'HackWire — Cybersecurity News, Decoded',
      },
    ],
  },
}

export default function HomePage() {
  const featured = getFeaturedArticle()
  const featuredDeepDives = getFeaturedDeepDives(2)
  const allArticles = getLatestArticles()
  // Render only the most recent stories on the homepage. Rendering the full
  // ~2,200-article archive inline ballooned the HTML to ~10MB / 2,200+ hydration
  // chunks and wrecked Core Web Vitals. The rest stay indexed via the sitemap +
  // category pages + the /news archive, and reachable via related-article links.
  const HOMEPAGE_LATEST = 24
  const remaining = allArticles
    .filter((a) => a.slug !== featured.slug)
    .slice(0, HOMEPAGE_LATEST)

  const threatStats = [
    { label: 'Active Campaigns', value: allArticles.filter(a => a.category === 'malware' || a.category === 'ransomware').length, delta: `+${allArticles.filter(a => (a.category === 'malware' || a.category === 'ransomware') && (Date.now() - new Date(a.publishedAt).getTime()) < 7 * 24 * 60 * 60 * 1000).length}`, href: '/category/malware' },
    { label: 'Critical CVEs (7 days)', value: allArticles.filter(a => a.category === 'vulnerabilities' && (a.severity === 'critical' || a.severity === 'high') && (Date.now() - new Date(a.publishedAt).getTime()) < 7 * 24 * 60 * 60 * 1000).length, delta: `+${allArticles.filter(a => a.category === 'vulnerabilities' && (a.severity === 'critical' || a.severity === 'high') && (Date.now() - new Date(a.publishedAt).getTime()) < 24 * 60 * 60 * 1000).length}`, href: '/category/vulnerabilities' },
    { label: 'Ransomware Groups', value: allArticles.filter(a => a.category === 'ransomware').length, delta: `+${allArticles.filter(a => a.category === 'ransomware' && (Date.now() - new Date(a.publishedAt).getTime()) < 7 * 24 * 60 * 60 * 1000).length}`, href: '/category/ransomware' },
    { label: 'Breaches Reported', value: allArticles.filter(a => a.category === 'breaches').length, delta: `+${allArticles.filter(a => a.category === 'breaches' && (Date.now() - new Date(a.publishedAt).getTime()) < 7 * 24 * 60 * 60 * 1000).length}`, href: '/category/breaches' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="sr-only">HackWire — Cybersecurity News, Decoded</h1>
      {/* Threat Intel — top of page */}
      <section className="mb-10">
        <div className="bg-white dark:bg-[#0F0F1A] border border-gray-200 dark:border-[#1E1E2E] rounded-lg p-4 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[#059669] dark:text-[#00FF88] text-xs font-mono">▶</span>
            <p className="text-xs font-mono font-bold text-[#059669] dark:text-[#00FF88] tracking-widest uppercase">
              Threat Intel
            </p>
            <div className="flex-1 h-px bg-gradient-to-r from-[#059669]/20 dark:from-[#00FF88]/20 to-transparent ml-2" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {threatStats.map((stat) => (
              <Link key={stat.label} href={stat.href} className="group flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1A1A2A] transition-colors">
                <span className="text-slate-800 dark:text-white text-2xl font-mono font-bold group-hover:text-[#059669] dark:group-hover:text-[#00FF88] transition-colors">{stat.value}</span>
                <span className="text-red-500 dark:text-red-400 text-xs font-mono mb-1">{stat.delta} this week</span>
                <span className="text-gray-500 dark:text-gray-500 text-xs font-mono text-center">{stat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Analysis Deep Dives */}
      {featuredDeepDives.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[#059669] dark:text-[#00FF88] text-xs font-mono">▶</span>
            <p className="text-xs font-mono font-bold text-[#059669] dark:text-[#00FF88] tracking-widest uppercase">
              Featured Analysis
            </p>
            <div className="flex-1 h-px bg-gradient-to-r from-[#059669]/20 dark:from-[#00FF88]/20 to-transparent ml-2" />
            <Link href="/featured" className="text-[10px] font-mono text-[#059669] dark:text-[#00FF88] hover:underline">
              View all &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredDeepDives.map((article) => (
              <Link key={article.slug} href={`/news/${article.slug}`} className="block group">
                <article className="h-full bg-white dark:bg-[#0f0f1a] border border-gray-200 dark:border-[#1e1e2e] rounded-lg p-5 hover:border-[#059669]/30 dark:hover:border-[#00FF88]/30 shadow-sm dark:shadow-none transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <CategoryBadge categoryId={article.category} size="sm" />
                    {article.severity && <SeverityBadge severity={article.severity} />}
                    <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded bg-[#059669]/10 dark:bg-[#00FF88]/10 text-[#059669] dark:text-[#00FF88] border border-[#059669]/20 dark:border-[#00FF88]/20">
                      DEEP DIVE
                    </span>
                  </div>
                  <h2 className="text-slate-800 dark:text-white font-bold text-lg font-mono leading-tight mb-2 group-hover:text-[#059669] dark:group-hover:text-[#00FF88] transition-colors">
                    {article.headline}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-3 line-clamp-3">
                    {article.summary}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 font-mono">
                    <span className="text-[#059669]/60 dark:text-[#00FF88]/60">{article.source}</span>
                    <span>&middot;</span>
                    <time dateTime={article.publishedAt}>{formatTimeAgo(article.publishedAt)}</time>
                    <span className="ml-auto text-[#059669]/40 dark:text-[#00FF88]/40 group-hover:text-[#059669] dark:group-hover:text-[#00FF88] transition-colors">
                      Read full analysis &rarr;
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured story */}
      <section className="mb-10">
        <FeaturedStory article={featured} />
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'HackWire',
            url: 'https://www.hackwire.news',
            description: 'HackWire delivers real-time cybersecurity news covering breaches, ransomware, malware, and vulnerabilities — decoded for security professionals.',
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://www.hackwire.news/api/search?q={search_term_string}',
              },
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />

      {/* Newsletter signup */}
      <section className="mb-10">
        <NewsletterSignup />
      </section>

      {/* Main content + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* News feed */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[#059669] dark:text-[#00FF88] text-xs font-mono">▶</span>
            <h2 className="text-xs font-mono font-bold text-[#059669] dark:text-[#00FF88] tracking-widest uppercase">
              Latest Stories
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-[#059669]/20 dark:from-[#00FF88]/20 to-transparent ml-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {remaining.map((article) => (
              <NewsCard key={article.slug} article={article} />
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/news"
              className="inline-block px-5 py-2.5 rounded border border-[#059669]/30 dark:border-[#00FF88]/30 text-[#059669] dark:text-[#00FF88] text-sm font-mono hover:bg-[#059669]/5 dark:hover:bg-[#00FF88]/5 transition-colors"
            >
              Browse all stories &rarr;
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-32">
            <TrendingSidebar articles={allArticles.slice(0, 8)} />
          </div>
        </div>
      </div>
    </div>
  )
}
