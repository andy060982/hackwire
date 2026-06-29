import { MetadataRoute } from 'next'

// Blocked: AI *training* crawlers + scrapers that ingest content with no
// referral traffic back. We intentionally ALLOW the AI *answer/search* engines
// (ChatGPT-User, OAI-SearchBot, PerplexityBot, Perplexity-User) — being cited
// there drives real referral clicks for a news site. (2026-06-29)
const BLOCKED_AI_BOTS = [
  'GPTBot',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'CCBot',
  'cohere-ai',
  'Diffbot',
  'Amazonbot',
  'Bytespider',
  'ByteDance',
  'Applebot-Extended',
  'FacebookBot',
  'Meta-ExternalAgent',
  'Meta-ExternalFetcher',
  'GoogleOther',
  'Google-Extended',
  'Timpibot',
  'omgili',
  'omgilibot',
  'PetalBot',
  'YouBot',
  'AI2Bot',
  'AI2Bot-Dolma',
  'DataForSeoBot',
  'MJ12bot',
  'AhrefsBot',
  'SemrushBot',
  'DotBot',
  'BLEXBot',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...BLOCKED_AI_BOTS.map((ua) => ({ userAgent: ua, disallow: '/' })),
      { userAgent: '*', allow: '/' },
    ],
    sitemap: [
      'https://www.hackwire.news/sitemap.xml',
      'https://www.hackwire.news/news-sitemap.xml',
    ],
  }
}
