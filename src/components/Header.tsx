import Link from 'next/link'
import { categories } from '@/lib/categories'
import ThemeToggle from './ThemeToggle'
import SearchBar from './SearchBar'
import { getLatestArticles } from '@/lib/articles'

function getTickerAlerts(): string[] {
  const critical = getLatestArticles()
    .filter(a => a.severity === 'critical' || a.severity === 'high')
    .slice(0, 5)
  if (critical.length === 0) return ['Monitoring 15 sources for emerging threats']
  return critical.map(a => a.headline)
}

export default function Header() {
  const alerts = getTickerAlerts()
  const tickerText = 'ACTIVE THREATS: ' + alerts.join(' \u00A0\u2022\u00A0 ')
  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0A0A0F]/95 backdrop-blur-sm border-b border-gray-200 dark:border-[#1E1E2E]">
      {/* Alert ticker */}
      <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-1.5 overflow-hidden">
        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="flex-shrink-0 flex items-center gap-1.5 text-red-500 dark:text-red-400 font-bold">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400 animate-pulse" />
            ALERT
          </span>
          <div className="overflow-hidden">
            <p className="text-red-500/80 dark:text-red-300/80 ticker-text whitespace-nowrap">
              {tickerText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{tickerText}
            </p>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex items-center gap-0.5">
              <span className="text-xl font-black font-mono text-slate-800 dark:text-white group-hover:text-[#059669] dark:group-hover:text-[#00FF88] transition-colors">
                HACK
              </span>
              <span className="text-xl font-black font-mono text-[#059669] dark:text-[#00FF88]">WIRE</span>
            </div>
            <span className="hidden sm:block text-gray-400 dark:text-gray-600 text-xs font-mono border-l border-gray-300 dark:border-gray-700 pl-2 ml-1">
              DECODED
            </span>
          </Link>

          {/* Search */}
          <SearchBar />

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link
              href="/podcast"
              className="flex items-center gap-1 text-[#059669] dark:text-[#00FF88] text-xs font-mono font-semibold hover:opacity-80 transition-opacity"
            >
              🎙️ Podcast
            </Link>
            <Link
              href="/about"
              className="text-gray-400 dark:text-gray-500 text-xs font-mono hover:text-[#059669] dark:hover:text-[#00FF88] transition-colors"
            >
              About
            </Link>
            <div className="flex items-center gap-1.5 px-3 py-1.5 border border-[#059669]/30 dark:border-[#00FF88]/30 rounded font-mono text-xs text-[#059669] dark:text-[#00FF88]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#059669] dark:bg-[#00FF88] animate-pulse" />
              LIVE
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Category nav */}
        <nav className="flex items-center gap-1 pb-2 overflow-x-auto no-scrollbar">
          <Link
            href="/"
            className="flex-shrink-0 px-3 py-1.5 rounded text-xs font-mono font-semibold text-[#059669] dark:text-[#00FF88] bg-[#059669]/10 dark:bg-[#00FF88]/10 border border-[#059669]/20 dark:border-[#00FF88]/20 hover:bg-[#059669]/15 dark:hover:bg-[#00FF88]/15 transition-colors"
          >
            ALL
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.id}`}
              className={`flex-shrink-0 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors border ${cat.color} ${cat.bgColor} ${cat.borderColor} hover:opacity-80`}
            >
              {cat.label.toUpperCase()}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
