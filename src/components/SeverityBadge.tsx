import { Severity } from '@/lib/articles'

interface SeverityBadgeProps {
  severity: Severity
}

const severityConfig = {
  critical: { label: 'CRITICAL', classes: 'bg-red-500/20 text-red-400 border-red-500/40' },
  high: { label: 'HIGH', classes: 'bg-orange-500/20 text-orange-400 border-orange-500/40' },
  medium: { label: 'MEDIUM', classes: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' },
  low: { label: 'LOW', classes: 'bg-green-500/20 text-green-400 border-green-500/40' },
}

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  if (!severity) return null
  const config = severityConfig[severity]

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded border ${config.classes}`}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {config.label}
    </span>
  )
}
