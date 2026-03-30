'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function UnsubscribeForm() {
  const searchParams = useSearchParams()
  const emailParam = searchParams.get('email') || ''
  const [email, setEmail] = useState(emailParam)
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setStatus('done')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-mono font-bold text-[#059669] dark:text-[#00FF88] mb-4">
        HACKWIRE_
      </h1>

      {status === 'done' ? (
        <div>
          <p className="text-lg text-slate-800 dark:text-white mb-2">You&apos;ve been unsubscribed.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No more emails from us. If you change your mind, you can always re-subscribe at{' '}
            <a href="https://hackwire.news" className="text-[#059669] dark:text-[#00FF88] hover:underline">
              hackwire.news
            </a>
          </p>
        </div>
      ) : (
        <div>
          <p className="text-slate-800 dark:text-white mb-6">
            Sorry to see you go. Enter your email to unsubscribe.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="px-4 py-2 rounded bg-gray-100 dark:bg-[#0F0F1A] border border-gray-200 dark:border-[#1E1E2E] text-slate-800 dark:text-white font-mono text-sm"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-4 py-2 rounded bg-red-500 text-white font-mono text-sm font-bold hover:bg-red-600 disabled:opacity-50"
            >
              {status === 'loading' ? 'PROCESSING...' : 'UNSUBSCRIBE'}
            </button>
          </form>
          {status === 'error' && (
            <p className="text-red-500 text-sm mt-3">Something went wrong. Try again.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-20 text-center text-gray-500">Loading...</div>}>
      <UnsubscribeForm />
    </Suspense>
  )
}
