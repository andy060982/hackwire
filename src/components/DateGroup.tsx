'use client'

import { useState } from 'react'

interface DateGroupProps {
  date: string
  count: number
  children: React.ReactNode
  defaultOpen?: boolean
}

export default function DateGroup({ date, count, children, defaultOpen = true }: DateGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const formatted = new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 py-2 group cursor-pointer"
      >
        <span className="text-[#059669] dark:text-[#00FF88] text-xs font-mono transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          ▶
        </span>
        <h2 className="text-sm font-mono font-bold text-slate-700 dark:text-gray-300 group-hover:text-[#059669] dark:group-hover:text-[#00FF88] transition-colors">
          {formatted}
        </h2>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-[#1E1E2E] text-gray-500 dark:text-gray-500">
          {count} {count === 1 ? 'article' : 'articles'}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-200 dark:from-[#1E1E2E] to-transparent" />
      </button>
      {isOpen && (
        <div className="space-y-3 mt-2 ml-5">
          {children}
        </div>
      )}
    </div>
  )
}
