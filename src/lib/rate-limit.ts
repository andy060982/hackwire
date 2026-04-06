/**
 * Simple in-memory IP-based rate limiter.
 * 5 requests per minute per IP, no external dependencies.
 */

const windowMs = 60_000 // 1 minute
const maxRequests = 5

interface Entry {
  timestamps: number[]
}

const store = new Map<string, Entry>()

// Periodic cleanup to prevent memory leaks (every 5 minutes)
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs)
    if (entry.timestamps.length === 0) {
      store.delete(key)
    }
  }
}, 5 * 60_000)

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  let entry = store.get(ip)

  if (!entry) {
    entry = { timestamps: [] }
    store.set(ip, entry)
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs)

  if (entry.timestamps.length >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  entry.timestamps.push(now)
  return { allowed: true, remaining: maxRequests - entry.timestamps.length }
}
