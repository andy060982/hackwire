import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About HackWire',
  description:
    'HackWire is an independent cybersecurity news aggregator that synthesizes threat intelligence, breach disclosures, and security research from across the web.',
  openGraph: {
    title: 'About HackWire',
    description: 'Cybersecurity News, Decoded.',
    url: 'https://hackwire.news/about',
  },
}

export default function AboutPage() {
  const sources = [
    { name: 'BleepingComputer', type: 'News' },
    { name: 'Krebs on Security', type: 'Investigative' },
    { name: 'The Hacker News', type: 'News' },
    { name: 'Dark Reading', type: 'Industry' },
    { name: 'CISA Advisories', type: 'Government' },
    { name: 'Mandiant Blog', type: 'Threat Intel' },
    { name: 'CrowdStrike Intelligence', type: 'Threat Intel' },
    { name: 'Dragos Blog', type: 'OT/ICS' },
    { name: 'Wired Security', type: 'News' },
    { name: 'Ars Technica Security', type: 'News' },
    { name: 'SANS Internet Storm Center', type: 'Research' },
    { name: 'Schneier on Security', type: 'Analysis' },
    { name: 'Google Project Zero', type: 'Research' },
    { name: 'Microsoft Security Blog', type: 'Vendor' },
    { name: 'US-CERT / NVD', type: 'Government' },
  ]

  const categories = [
    { icon: '🔴', label: 'Breaches', desc: 'Data breaches, unauthorized access, stolen records' },
    { icon: '🟡', label: 'Vulnerabilities', desc: 'CVEs, zero-days, patch advisories, exploit releases' },
    { icon: '🟣', label: 'Malware', desc: 'New malware families, infostealers, APT campaigns' },
    { icon: '⚫', label: 'Ransomware', desc: 'Ransomware groups, victims, TTPs, ransom demands' },
    { icon: '🔵', label: 'Policy', desc: 'Regulation, government action, legislation, compliance' },
    { icon: '🟢', label: 'Tools', desc: 'New security tools, open source releases, research tooling' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-0.5 mb-4">
          <span className="text-3xl font-black font-mono text-slate-800 dark:text-white">HACK</span>
          <span className="text-3xl font-black font-mono text-[#059669] dark:text-[#00FF88]">WIRE</span>
        </div>
        <h1 className="text-4xl font-bold font-mono text-slate-800 dark:text-white mb-4">
          Cybersecurity News, <span className="text-[#059669] dark:text-[#00FF88]">Decoded</span>
        </h1>
        <div className="h-px bg-gradient-to-r from-[#059669]/30 dark:from-[#00FF88]/30 to-transparent mb-6" />
        <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
          HackWire is an independent cybersecurity news aggregator built for security professionals,
          IT teams, and anyone who needs to stay ahead of the threat landscape without wading through
          jargon, marketing speak, or vendor press releases.
        </p>
      </div>

      {/* Mission */}
      <section className="bg-white dark:bg-[#0F0F1A] border border-gray-200 dark:border-[#1E1E2E] rounded-xl p-8 mb-10 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[#059669] dark:text-[#00FF88] font-mono text-sm">▶</span>
          <h2 className="text-[#059669] dark:text-[#00FF88] font-mono font-bold text-sm tracking-widest uppercase">Our Mission</h2>
        </div>
        <p className="text-slate-700 dark:text-gray-300 leading-relaxed mb-4">
          The cybersecurity information landscape is fragmented, vendor-polluted, and often optimized for
          search engines rather than actual human understanding. HackWire exists to cut through that noise.
        </p>
        <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
          We synthesize reporting from dozens of primary sources — government advisories, threat intelligence
          vendors, independent researchers, and investigative journalists — into clear, actionable news
          articles. Every story is categorized, severity-rated, and written with context that makes it
          immediately useful to practitioners.
        </p>
      </section>

      {/* Coverage areas */}
      <section className="mb-10">
        <h2 className="text-xl font-bold font-mono text-slate-800 dark:text-white mb-6">What We Cover</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <div key={cat.label} className="bg-white dark:bg-[#0F0F1A] border border-gray-200 dark:border-[#1E1E2E] rounded-lg p-4 shadow-sm dark:shadow-none">
              <div className="flex items-center gap-2 mb-2">
                <span>{cat.icon}</span>
                <span className="text-slate-800 dark:text-white font-mono font-bold text-sm">{cat.label}</span>
              </div>
              <p className="text-gray-500 dark:text-gray-500 text-sm">{cat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sources */}
      <section className="mb-10">
        <h2 className="text-xl font-bold font-mono text-slate-800 dark:text-white mb-6">Sources We Aggregate From</h2>
        <div className="bg-white dark:bg-[#0F0F1A] border border-gray-200 dark:border-[#1E1E2E] rounded-xl overflow-hidden shadow-sm dark:shadow-none">
          <div className="divide-y divide-gray-100 dark:divide-[#1E1E2E]">
            {sources.map((source) => (
              <div key={source.name} className="flex items-center justify-between px-5 py-3">
                <span className="text-slate-700 dark:text-gray-300 font-mono text-sm">{source.name}</span>
                <span className="text-gray-400 dark:text-gray-600 text-xs font-mono bg-gray-100 dark:bg-[#1A1A2A] px-2 py-0.5 rounded">
                  {source.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6 mb-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-amber-500">⚠</span>
          <h2 className="text-amber-500 font-mono font-bold text-sm tracking-widest uppercase">Disclaimer</h2>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
          HackWire aggregates and synthesizes publicly available cybersecurity information for educational
          and informational purposes only. We are not a primary news source — all content is based on
          publicly reported events from credited sources. HackWire is not responsible for actions taken
          based on information published here. Always verify critical security information through official
          channels (vendor advisories, CISA, CVE databases) before taking action. HackWire has no affiliation
          with any security vendor.
        </p>
      </section>

      {/* CTA */}
      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 border border-[#059669]/40 dark:border-[#00FF88]/40 text-[#059669] dark:text-[#00FF88] font-mono font-semibold rounded-lg hover:bg-[#059669]/10 dark:hover:bg-[#00FF88]/10 transition-all duration-200"
        >
          ← Back to Latest News
        </Link>
      </div>
    </div>
  )
}
