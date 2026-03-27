'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Article {
  slug: string
  headline: string
  summary: string
  category: string
}

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<Article[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const fetched = useRef(false)

  const loadArticles = useCallback(async () => {
    if (fetched.current) return
    fetched.current = true
    try {
      const res = await fetch('/api/search')
      const data = await res.json()
      setArticles(data)
    } catch {
      fetched.current = false
    }
  }, [])

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }
    const q = query.toLowerCase()
    const matched = articles.filter(
      a => a.headline.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q)
    ).slice(0, 8)
    setResults(matched)
  }, [query, articles])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="hidden md:block relative w-56">
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#0F0F1A] border border-gray-200 dark:border-[#1E1E2E] rounded px-3 py-1.5">
        <span className="text-gray-400 dark:text-gray-600 text-sm">⌕</span>
        <input
          type="text"
          placeholder="Search threats..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true) }}
          onFocus={() => { setIsOpen(true); loadArticles() }}
          className="bg-transparent text-xs font-mono text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600 outline-none w-full"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setIsOpen(false) }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-1 w-80 right-0 bg-white dark:bg-[#0F0F1A] border border-gray-200 dark:border-[#1E1E2E] rounded shadow-lg z-50 max-h-96 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.slug}
              onClick={() => { router.push(`/news/${r.slug}`); setIsOpen(false); setQuery('') }}
              className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-[#1E1E2E] border-b border-gray-100 dark:border-[#1E1E2E] last:border-0 transition-colors"
            >
              <span className="text-[10px] font-mono font-bold uppercase text-[#059669] dark:text-[#00FF88]">
                {r.category}
              </span>
              <p className="text-xs font-medium text-gray-800 dark:text-gray-200 mt-0.5 line-clamp-2">
                {r.headline}
              </p>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && articles.length > 0 && (
        <div className="absolute top-full mt-1 w-80 right-0 bg-white dark:bg-[#0F0F1A] border border-gray-200 dark:border-[#1E1E2E] rounded shadow-lg z-50 p-4">
          <p className="text-xs font-mono text-gray-400 dark:text-gray-600 text-center">
            No threats found for &quot;{query}&quot;
          </p>
        </div>
      )}
    </div>
  )
}
