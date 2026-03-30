'use client'

import { useState, FormEvent } from 'react'

interface NewsletterSignupProps {
  compact?: boolean
}

export default function NewsletterSignup({ compact = false }: NewsletterSignupProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setMessage(data.message || 'You\'re in. Watch your inbox.')
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error || 'Something went wrong. Try again.')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Try again.')
    }
  }

  if (compact) {
    return (
      <div>
        <h3 className="text-[#059669] dark:text-[#00FF88] text-xs font-mono font-bold tracking-widest uppercase mb-3">
          Threat Alerts
        </h3>
        <p className="text-gray-500 dark:text-gray-500 text-xs font-mono mb-3">
          Get critical cyber threats delivered to your inbox.
        </p>
        {status === 'success' ? (
          <p className="text-[#059669] dark:text-[#00FF88] text-xs font-mono">{message}</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setStatus('idle') }}
              placeholder="analyst@corp.com"
              required
              className="flex-1 min-w-0 px-3 py-1.5 bg-white dark:bg-[#0A0A14] border border-gray-200 dark:border-[#1E1E2E] rounded text-sm font-mono text-slate-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-[#059669] dark:focus:border-[#00FF88] transition-colors"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-3 py-1.5 bg-[#059669] dark:bg-[#00FF88] text-white dark:text-black text-xs font-mono font-bold rounded hover:bg-[#047857] dark:hover:bg-[#00cc6e] transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? '...' : 'SUB'}
            </button>
          </form>
        )}
        {status === 'error' && (
          <p className="text-red-500 text-xs font-mono mt-2">{message}</p>
        )}
      </div>
    )
  }

  return (
    <section className="bg-white dark:bg-[#0F0F1A] border border-gray-200 dark:border-[#1E1E2E] rounded-lg p-6 md:p-8 shadow-sm dark:shadow-none">
      <div className="max-w-2xl mx-auto text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-[#059669] dark:text-[#00FF88] text-xs font-mono">▶</span>
          <span className="text-xs font-mono font-bold text-[#059669] dark:text-[#00FF88] tracking-widest uppercase">
            Intel Feed
          </span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white font-mono mb-2">
          Get threat alerts in your inbox
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-mono mb-6">
          Critical vulnerabilities, breaches, and threat intel — decoded and delivered. No spam, just signal.
        </p>

        {status === 'success' ? (
          <div className="flex items-center justify-center gap-2 py-3">
            <span className="text-[#059669] dark:text-[#00FF88] font-mono text-sm font-bold">
              ✓ {message}
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setStatus('idle') }}
              placeholder="analyst@corp.com"
              required
              className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-[#0A0A14] border border-gray-200 dark:border-[#1E1E2E] rounded text-sm font-mono text-slate-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-[#059669] dark:focus:border-[#00FF88] transition-colors"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-6 py-2.5 bg-[#059669] dark:bg-[#00FF88] text-white dark:text-black text-sm font-mono font-bold rounded hover:bg-[#047857] dark:hover:bg-[#00cc6e] transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {status === 'loading' ? 'ENCRYPTING...' : 'SUBSCRIBE'}
            </button>
          </form>
        )}
        {status === 'error' && (
          <p className="text-red-500 text-xs font-mono mt-3">{message}</p>
        )}
        <p className="text-gray-400 dark:text-gray-600 text-[10px] font-mono mt-4">
          Unsubscribe anytime. We respect your privacy.
        </p>
      </div>
    </section>
  )
}
