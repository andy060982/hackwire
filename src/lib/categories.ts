export type CategoryId = 'breaches' | 'vulnerabilities' | 'malware' | 'ransomware' | 'policy' | 'tools'

export interface Category {
  id: CategoryId
  label: string
  color: string
  bgColor: string
  borderColor: string
  emoji: string
}

export const categories: Category[] = [
  {
    id: 'breaches',
    label: 'Breaches',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    emoji: '🔴',
  },
  {
    id: 'vulnerabilities',
    label: 'Vulnerabilities',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    emoji: '🟡',
  },
  {
    id: 'malware',
    label: 'Malware',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    emoji: '🟣',
  },
  {
    id: 'ransomware',
    label: 'Ransomware',
    color: 'text-rose-400',
    bgColor: 'bg-rose-900/20',
    borderColor: 'border-rose-800/40',
    emoji: '⚫',
  },
  {
    id: 'policy',
    label: 'Policy',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    emoji: '🔵',
  },
  {
    id: 'tools',
    label: 'Tools',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    emoji: '🟢',
  },
]

export function getCategoryById(id: string): Category | undefined {
  return categories.find((c) => c.id === id)
}
