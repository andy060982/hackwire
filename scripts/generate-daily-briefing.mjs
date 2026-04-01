#!/usr/bin/env node
/**
 * HackWire Daily Briefing Generator — "The Wire"
 * Generates an 800-1200 word original editorial analysis of the past 24 hours.
 * Run via systemd timer at 7:30 AM ET daily (after articles are published).
 *
 * Usage: node scripts/generate-daily-briefing.mjs [YYYY-MM-DD]
 * Env:   VERCEL_TOKEN
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..')
const BRIEFINGS_FILE = join(PROJECT_ROOT, 'src/lib/briefings-data.json')
const ARTICLES_FILE = join(PROJECT_ROOT, 'src/lib/articles-data.json')
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || ''

function getDateStr() {
  // Use provided date or today in ET
  const arg = process.argv[2]
  if (arg && /^\d{4}-\d{2}-\d{2}$/.test(arg)) return arg
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

function getRecentArticles(hours = 28) {
  // Use 28 hours to catch articles from late yesterday + today
  const data = readFileSync(ARTICLES_FILE, 'utf-8')
  const articles = JSON.parse(data)
  const cutoff = Date.now() - hours * 60 * 60 * 1000

  return articles
    .filter((a) => new Date(a.publishedAt).getTime() > cutoff)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

function buildPrompt(articles, dateStr) {
  const articleSummaries = articles.map((a, i) =>
    `${i + 1}. [${a.category.toUpperCase()}${a.severity ? '/' + a.severity.toUpperCase() : ''}] ${a.headline}\n   ${a.summary}`
  ).join('\n\n')

  return `You are the editor-in-chief of HackWire, a cybersecurity news site. Write "The Wire" — a daily editorial briefing for ${dateStr}.

You have ${articles.length} stories from the past 24 hours. Write an 800-1200 word ORIGINAL editorial analysis. This is NOT a summary list — it's an editorial piece that:

1. Opens with a strong editorial lede that captures the day's theme or most significant development
2. Groups related stories and draws connections between them
3. Provides original analysis and context that goes beyond the individual articles
4. Highlights what security professionals should pay attention to and why
5. Ends with a forward-looking paragraph about what to watch next

STYLE:
- Write in first-person plural ("we", "our analysis shows")
- Professional but engaging — like a morning brief from a trusted colleague
- NO bullet points in the main body — write flowing paragraphs
- Reference specific articles by linking to them: [headline text](/news/slug)
- Include a "Key Takeaways" section at the end with 3-4 bullet points
- Do NOT start with "I" or any AI meta-commentary

FORMAT (markdown):
# The Wire — ${dateStr}
## [Editorial subtitle that captures the day's theme]

[800-1200 words of editorial content with inline article links]

## Key Takeaways

- [3-4 actionable bullet points]

---
*The Wire is HackWire's daily editorial briefing, published every morning.*

TODAY'S STORIES:
${articleSummaries}

ARTICLE SLUGS (for linking):
${articles.map(a => `- ${a.headline}: /news/${a.slug}`).join('\n')}

Write The Wire now.`
}

function loadBriefings() {
  if (!existsSync(BRIEFINGS_FILE)) return []
  return JSON.parse(readFileSync(BRIEFINGS_FILE, 'utf-8'))
}

function saveBriefings(briefings) {
  writeFileSync(BRIEFINGS_FILE, JSON.stringify(briefings, null, 2))
}

async function main() {
  const dateStr = getDateStr()
  console.log(`[${new Date().toISOString()}] Generating daily briefing for ${dateStr}...`)

  // Check if already generated
  const briefings = loadBriefings()
  if (briefings.some(b => b.date === dateStr)) {
    console.log(`  Briefing for ${dateStr} already exists — skipping.`)
    return
  }

  const articles = getRecentArticles(28)
  if (articles.length < 3) {
    console.log(`  Only ${articles.length} articles in the past 28 hours — need at least 3. Skipping.`)
    return
  }

  console.log(`  Found ${articles.length} articles. Generating editorial...`)

  const prompt = buildPrompt(articles, dateStr)

  // Use Claude CLI
  let body
  try {
    body = execSync(
      'claude -p --model claude-haiku-4-5-20251001',
      { input: prompt, encoding: 'utf-8', timeout: 120000 }
    ).trim()
  } catch (err) {
    console.error(`  Claude CLI failed: ${err.message}`)
    process.exit(1)
  }

  if (!body || body.length < 500) {
    console.error(`  Generated content too short (${body?.length || 0} chars). Aborting.`)
    process.exit(1)
  }

  // Validate — no AI meta-commentary
  const bodyLower = body.toLowerCase()
  const refusalPatterns = ['i need', 'i notice', "i don't see", 'please provide', "i'll write", 'could you']
  for (const p of refusalPatterns) {
    if (bodyLower.startsWith(p)) {
      console.error(`  AI refusal detected: "${body.substring(0, 100)}". Aborting.`)
      process.exit(1)
    }
  }

  // Extract title from the markdown
  const titleMatch = body.match(/^#\s+(.+)$/m)
  const subtitleMatch = body.match(/^##\s+(.+)$/m)
  const title = titleMatch ? titleMatch[1] : `The Wire — ${dateStr}`
  const subtitle = subtitleMatch ? subtitleMatch[1] : ''

  // Generate a short summary for meta/SEO
  let summary
  try {
    summary = execSync(
      'claude -p --model claude-haiku-4-5-20251001',
      { input: `Write a 1-sentence SEO meta description (under 160 chars) for this cybersecurity daily briefing:\n\n${body.substring(0, 1000)}`, encoding: 'utf-8', timeout: 30000 }
    ).trim()
  } catch {
    summary = `HackWire daily cybersecurity briefing for ${dateStr} — ${articles.length} stories analyzed.`
  }

  const briefing = {
    date: dateStr,
    slug: `daily-${dateStr}`,
    title,
    subtitle,
    summary: summary.substring(0, 200),
    body,
    articleCount: articles.length,
    publishedAt: new Date().toISOString(),
    articleSlugs: articles.map(a => a.slug),
  }

  briefings.unshift(briefing) // newest first
  saveBriefings(briefings)
  console.log(`  Saved briefing: "${title}" (${body.length} chars, ${articles.length} articles referenced)`)

  // Build and deploy
  console.log('  Building site...')
  try {
    execSync('npm run build', { cwd: PROJECT_ROOT, timeout: 120000, stdio: 'pipe' })
    console.log('  Deploying...')
    execSync(`npx vercel --prod --token=${VERCEL_TOKEN} --yes`, { cwd: PROJECT_ROOT, timeout: 180000, stdio: 'pipe' })
    console.log('  Deployed successfully!')
  } catch (err) {
    console.error(`  Build/deploy failed: ${err.message?.substring(0, 200)}`)
  }
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
