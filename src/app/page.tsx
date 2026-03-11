import type { Metadata } from 'next'
import { getLatestArticles, getFeaturedArticle } from '@/lib/articles'
import FeaturedStory from '@/components/FeaturedStory'
import NewsCard from '@/components/NewsCard'
import TrendingSidebar from '@/components/TrendingSidebar'

export const metadata: Metadata = {
  title: 'HackWire — Cybersecurity News, Decoded',
  description:
    'Real-time cybersecurity news covering breaches, vulnerabilities, malware, ransomware, policy, and security tools.',
  openGraph: {
    title: 'HackWire — Cybersecurity News, Decoded',
    description: 'Real-time cybersecurity news decoded for security professionals.',
    url: 'https://hackwire.news',
  },
}

export default function HomePage() {
  const featured = getFeaturedArticle()
  const allArticles = getLatestArticles()
  const remaining = allArticles.filter((a) => a.slug !== featured.slug)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
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
            url: 'https://hackwire.news',
            description: 'Cybersecurity News, Decoded',
          }),
        }}
      />

      {/* Main content + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* News feed */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[#00FF88] text-xs font-mono">▶</span>
            <h2 className="text-xs font-mono font-bold text-[#00FF88] tracking-widest uppercase">
              Latest Stories
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-[#00FF88]/20 to-transparent ml-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {remaining.map((article) => (
              <NewsCard key={article.slug} article={article} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-32">
            <TrendingSidebar articles={allArticles} />

            {/* Stats widget */}
            <div className="mt-6 bg-[#0F0F1A] border border-[#1E1E2E] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[#00FF88] text-xs font-mono">▶</span>
                <h3 className="text-xs font-mono font-bold text-[#00FF88] tracking-widest uppercase">
                  Threat Intel
                </h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Active Campaigns', value: '47', delta: '+3' },
                  { label: 'Critical CVEs (7 days)', value: '12', delta: '+5' },
                  { label: 'Ransomware Groups', value: '89', delta: '+2' },
                  { label: 'New Malware Families', value: '23', delta: '+7' },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <span className="text-gray-500 text-xs font-mono">{stat.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-mono font-bold">{stat.value}</span>
                      <span className="text-red-400 text-xs font-mono">{stat.delta}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
