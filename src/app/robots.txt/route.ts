// robots.txt served as a route handler so we can emit a Content-Signal
// directive (contentsignals.org / AIPREF draft) alongside the AI-bot policy.
// Policy: block AI *training* crawlers + scrapers; ALLOW AI answer/search
// engines (ChatGPT-User, OAI-SearchBot, PerplexityBot, etc.) because citations
// drive real referral clicks for a news site. Content-Signal states that
// declaratively: search=yes, ai-input=yes (AI answers may cite us), ai-train=no.

const BLOCKED_AI_BOTS = [
  'GPTBot', 'ClaudeBot', 'Claude-Web', 'anthropic-ai', 'CCBot', 'cohere-ai',
  'Diffbot', 'Amazonbot', 'Bytespider', 'ByteDance', 'Applebot-Extended',
  'FacebookBot', 'Meta-ExternalAgent', 'Meta-ExternalFetcher',
  'Google-Extended', 'Timpibot', 'omgili', 'omgilibot', 'PetalBot', 'YouBot',
  'AI2Bot', 'AI2Bot-Dolma', 'DataForSeoBot', 'MJ12bot', 'AhrefsBot',
  'SemrushBot', 'DotBot', 'BLEXBot',
]

export function GET() {
  const lines: string[] = [
    'User-agent: *',
    'Content-Signal: search=yes, ai-input=yes, ai-train=no',
    'Allow: /',
    '',
  ]
  for (const ua of BLOCKED_AI_BOTS) {
    lines.push(`User-agent: ${ua}`, 'Disallow: /', '')
  }
  lines.push(
    'Sitemap: https://www.hackwire.news/sitemap.xml',
    'Sitemap: https://www.hackwire.news/news-sitemap.xml',
    '',
  )
  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
