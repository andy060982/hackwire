import Link from 'next/link'
import { categories } from '@/lib/categories'

export default function Footer() {
  return (
    <footer className="bg-[#050508] border-t border-[#1E1E2E] mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-0.5 mb-3">
              <span className="text-xl font-black font-mono text-white">HACK</span>
              <span className="text-xl font-black font-mono text-[#00FF88]">WIRE</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-4 max-w-xs">
              Cybersecurity News, Decoded. HackWire aggregates, synthesizes, and contextualizes the latest threats, breaches, and security research from across the internet.
            </p>
            <p className="text-gray-600 text-xs font-mono">hackwire.news</p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-[#00FF88] text-xs font-mono font-bold tracking-widest uppercase mb-4">
              Categories
            </h3>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/category/${cat.id}`}
                    className="text-gray-500 text-sm font-mono hover:text-[#00FF88] transition-colors"
                  >
                    {cat.emoji} {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sources */}
          <div>
            <h3 className="text-[#00FF88] text-xs font-mono font-bold tracking-widest uppercase mb-4">
              Sources We Track
            </h3>
            <ul className="space-y-2 text-sm text-gray-500 font-mono">
              {[
                'BleepingComputer', 'Krebs on Security', 'The Hacker News',
                'Mandiant', 'CrowdStrike', 'Dragos',
                'CISA.gov', 'Schneier on Security', 'Dark Reading',
                'Wired Security', 'Ars Technica', 'SANS Internet Storm Center'
              ].map((source) => (
                <li key={source} className="text-xs hover:text-[#00FF88] transition-colors">
                  {source}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#1E1E2E] pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="text-xs text-gray-600 font-mono max-w-xl">
              <span className="text-amber-500/70">⚠ DISCLAIMER: </span>
              HackWire aggregates and synthesizes publicly available cybersecurity information for educational and informational purposes only. Content is based on publicly reported events. HackWire is not responsible for actions taken based on this information. Always verify critical security information through official channels before taking action.
            </div>
            <div className="text-xs text-gray-700 font-mono flex-shrink-0">
              © 2025 HackWire. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
