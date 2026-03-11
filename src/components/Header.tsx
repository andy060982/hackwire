import Link from 'next/link'
import { categories } from '@/lib/categories'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#0A0A0F]/95 backdrop-blur-sm border-b border-[#1E1E2E]">
      {/* Alert ticker */}
      <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-1.5 overflow-hidden">
        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="flex-shrink-0 flex items-center gap-1.5 text-red-400 font-bold">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            ALERT
          </span>
          <div className="overflow-hidden">
            <p className="text-red-300/80 ticker-text whitespace-nowrap">
              ACTIVE THREATS: Chrome zero-day CVE-2025-0971 under active exploitation — update immediately &nbsp;•&nbsp; CISA ED-25-02: Ivanti Connect Secure emergency directive issued &nbsp;•&nbsp; VoltZite ransomware targeting North American power grid operators &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ACTIVE THREATS: Chrome zero-day CVE-2025-0971 under active exploitation — update immediately &nbsp;•&nbsp; CISA ED-25-02: Ivanti Connect Secure emergency directive issued &nbsp;•&nbsp; VoltZite ransomware targeting North American power grid operators
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
              <span className="text-xl font-black font-mono text-white group-hover:text-[#00FF88] transition-colors">
                HACK
              </span>
              <span className="text-xl font-black font-mono text-[#00FF88]">WIRE</span>
            </div>
            <span className="hidden sm:block text-gray-600 text-xs font-mono border-l border-gray-700 pl-2 ml-1">
              DECODED
            </span>
          </Link>

          {/* Search placeholder */}
          <div className="hidden md:flex items-center gap-2 bg-[#0F0F1A] border border-[#1E1E2E] rounded px-3 py-1.5 w-56">
            <span className="text-gray-600 text-sm">⌕</span>
            <span className="text-gray-600 text-xs font-mono">Search threats...</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link
              href="/about"
              className="text-gray-500 text-xs font-mono hover:text-[#00FF88] transition-colors"
            >
              About
            </Link>
            <div className="flex items-center gap-1.5 px-3 py-1.5 border border-[#00FF88]/30 rounded font-mono text-xs text-[#00FF88]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
              LIVE
            </div>
          </div>
        </div>

        {/* Category nav */}
        <nav className="flex items-center gap-1 pb-2 overflow-x-auto no-scrollbar">
          <Link
            href="/"
            className="flex-shrink-0 px-3 py-1.5 rounded text-xs font-mono font-semibold text-[#00FF88] bg-[#00FF88]/10 border border-[#00FF88]/20 hover:bg-[#00FF88]/15 transition-colors"
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
