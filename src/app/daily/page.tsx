import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllBriefings } from '@/lib/briefings'

export const metadata: Metadata = {
  title: 'The Wire — Daily Cybersecurity Briefings',
  description: 'HackWire\'s daily editorial briefing. Original analysis of the cybersecurity stories that matter, published every morning.',
  alternates: {
    canonical: 'https://www.hackwire.news/daily',
  },
  openGraph: {
    title: 'The Wire — Daily Cybersecurity Briefings',
    description: 'Original editorial analysis of the cybersecurity stories that matter.',
    url: 'https://www.hackwire.news/daily',
  },
}

export default function DailyIndexPage() {
  const briefings = getAllBriefings()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[#059669] dark:text-[#00FF88] text-xs font-mono">▶</span>
        <h1 className="text-xs font-mono font-bold text-[#059669] dark:text-[#00FF88] tracking-widest uppercase">
          The Wire
        </h1>
      </div>
      <p className="text-2xl font-mono font-black text-slate-900 dark:text-white mb-2">
        Daily Cybersecurity Briefings
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Original editorial analysis of the stories that matter. Published every morning.
      </p>

      {briefings.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">
            The first briefing drops tomorrow morning. Check back at 7 AM ET.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {briefings.map((b) => {
            const dateFormatted = new Date(b.date + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
            return (
              <Link
                key={b.date}
                href={`/daily/${b.date}`}
                className="block p-5 bg-white dark:bg-[#0F0F1A] border border-gray-200 dark:border-[#1E1E2E] rounded-lg hover:border-[#059669]/30 dark:hover:border-[#00FF88]/30 transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <time className="text-xs font-mono text-gray-400 dark:text-gray-500">{dateFormatted}</time>
                  <span className="text-xs font-mono text-[#059669] dark:text-[#00FF88]">{b.articleCount} stories</span>
                </div>
                <h2 className="text-lg font-mono font-bold text-slate-800 dark:text-white group-hover:text-[#059669] dark:group-hover:text-[#00FF88] transition-colors mb-1">
                  {b.title.replace(/^#\s+/, '')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {b.summary}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
