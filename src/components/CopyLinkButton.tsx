'use client'

import { useState } from 'react'

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="px-2 py-1 border border-gray-200 dark:border-[#1E1E2E] text-gray-400 dark:text-gray-500 text-xs font-mono rounded hover:border-[#059669]/30 dark:hover:border-[#00FF88]/30 hover:text-[#059669] dark:hover:text-[#00FF88] transition-colors cursor-pointer"
    >
      {copied ? '✓' : '🔗'}
    </button>
  )
}
