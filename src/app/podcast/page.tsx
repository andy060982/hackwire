import type { Metadata } from 'next'
import Link from 'next/link'
import { episodes } from '@/lib/podcast-data'
import { articles as allArticles } from '@/lib/articles'
import PodcastPlayer from './PodcastPlayer'

export const metadata: Metadata = {
  title: 'Podcast — HackWire Daily',
  description: 'Listen to HackWire Daily — your AI-powered cybersecurity threat briefing. Morning briefs and evening wraps covering the latest threats, breaches, and security news.',
  openGraph: {
    title: 'HackWire Daily Podcast',
    description: 'Your AI-powered cybersecurity threat briefing — delivered twice daily.',
    images: [{ url: '/podcast/cover.png', width: 1400, height: 1400 }],
  },
}

export default function PodcastPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="flex flex-col sm:flex-row items-start gap-6 mb-10">
        <img
          src="/podcast/cover.png"
          alt="HackWire Daily Podcast"
          className="w-32 h-32 rounded-xl shadow-lg flex-shrink-0"
        />
        <div>
          <h1 className="text-3xl font-black font-mono text-gray-900 dark:text-white mb-2">
            HackWire Daily
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            Your AI-powered cybersecurity threat briefing. Morning briefs and evening wraps covering the latest threats, breaches, vulnerabilities, and security news.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://open.spotify.com/show/hackwire-daily"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1DB954]/10 text-[#1DB954] text-xs font-mono font-semibold border border-[#1DB954]/20 hover:bg-[#1DB954]/20 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
              SPOTIFY
            </a>

            <a
              href="/podcast/feed.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-500 text-xs font-mono font-semibold border border-orange-500/20 hover:bg-orange-500/20 transition-colors"
            >
              📡 RSS FEED
            </a>
          </div>
        </div>
      </div>

      {/* Episodes */}
      <h2 className="text-xl font-bold font-mono text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-[#059669] dark:bg-[#00FF88] animate-pulse" />
        EPISODES
      </h2>

      <div className="space-y-6">
        {episodes.map((ep) => {
          const relatedArticles = ep.articleSlugs
            .map(slug => allArticles.find(a => a.slug === slug))
            .filter(Boolean)

          return (
            <article
              key={ep.id}
              className="bg-white dark:bg-[#12121A] rounded-xl border border-gray-200 dark:border-[#1E1E2E] p-6 hover:border-[#059669]/30 dark:hover:border-[#00FF88]/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  ep.edition === 'morning'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                }`}>
                  {ep.edition === 'morning' ? '☀️ Morning Brief' : '🌙 Evening Wrap'}
                </span>
                <span className="text-xs font-mono text-gray-500 dark:text-gray-500">
                  {new Date(ep.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="text-xs font-mono text-gray-400 dark:text-gray-600">
                  {ep.duration}
                </span>
              </div>

              <PodcastPlayer src={ep.audioUrl} title={ep.title} />

              {ep.description && (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  {ep.description}
                </p>
              )}

              {relatedArticles.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#1E1E2E]">
                  <p className="text-xs font-mono font-semibold text-gray-500 dark:text-gray-500 uppercase mb-2">
                    📰 Stories covered
                  </p>
                  <ul className="space-y-1">
                    {relatedArticles.map((article: any) => (
                      <li key={article.slug}>
                        <Link
                          href={`/news/${article.slug}`}
                          className="text-sm text-[#059669] dark:text-[#00FF88] hover:underline font-medium"
                        >
                          {article.headline}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </main>
  )
}
