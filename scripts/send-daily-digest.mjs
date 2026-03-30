#!/usr/bin/env node
/**
 * HackWire Daily Digest — sends a morning email with yesterday's top articles.
 * Run via systemd timer at 7 AM ET daily.
 *
 * Usage: node scripts/send-daily-digest.mjs
 * Env:   RESEND_API_KEY, RESEND_AUDIENCE_ID
 */

import { Resend } from 'resend'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..')

const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID

if (!RESEND_API_KEY || !RESEND_AUDIENCE_ID) {
  console.error('Missing RESEND_API_KEY or RESEND_AUDIENCE_ID')
  process.exit(1)
}

const resend = new Resend(RESEND_API_KEY)

const CATEGORY_COLORS = {
  breaches: '#FF3B3B',
  vulnerabilities: '#F59E0B',
  malware: '#A855F7',
  ransomware: '#F43F5E',
  policy: '#3B82F6',
  tools: '#22C55E',
}

const CATEGORY_LABELS = {
  breaches: 'BREACH',
  vulnerabilities: 'VULN',
  malware: 'MALWARE',
  ransomware: 'RANSOMWARE',
  policy: 'POLICY',
  tools: 'TOOLS',
}

function getRecentArticles(hours = 24) {
  const data = readFileSync(join(PROJECT_ROOT, 'src/lib/articles-data.json'), 'utf-8')
  const articles = JSON.parse(data)
  const cutoff = Date.now() - hours * 60 * 60 * 1000

  return articles
    .filter((a) => new Date(a.publishedAt).getTime() > cutoff)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

function buildArticleHtml(article) {
  const color = CATEGORY_COLORS[article.category] || '#64748b'
  const label = CATEGORY_LABELS[article.category] || article.category.toUpperCase()
  const severity = article.severity
    ? `<span style="margin-left:8px;font-size:11px;color:${
        article.severity === 'critical' ? '#FF3B3B' : article.severity === 'high' ? '#F59E0B' : '#64748b'
      };">[${article.severity.toUpperCase()}]</span>`
    : ''

  return `
    <div style="margin-bottom:24px;padding:16px;background:#0F0F1A;border:1px solid #1E1E2E;border-radius:8px;border-left:3px solid ${color};">
      <div style="margin-bottom:8px;">
        <span style="font-size:11px;font-weight:700;color:${color};font-family:'JetBrains Mono',monospace;letter-spacing:0.5px;">${label}</span>${severity}
      </div>
      <a href="https://hackwire.news/news/${article.slug}" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;line-height:1.4;">${article.headline}</a>
      <p style="margin:8px 0 0;font-size:13px;line-height:1.6;color:#94a3b8;">${article.summary}</p>
    </div>`
}

function buildDigestHtml(articles, dateStr) {
  const articleBlocks = articles.map(buildArticleHtml).join('\n')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0A0A0F;color:#e2e8f0;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="border-bottom:2px solid #00FF88;padding-bottom:20px;margin-bottom:24px;">
      <h1 style="margin:0;font-size:28px;font-family:'JetBrains Mono',monospace;color:#00FF88;">HACKWIRE_</h1>
      <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Daily Digest &mdash; ${dateStr}</p>
    </div>

    <p style="font-size:15px;line-height:1.7;color:#cbd5e1;margin:0 0 24px;">
      Here's what happened in cybersecurity in the last 24 hours &mdash; <strong>${articles.length} stories</strong>, decoded.
    </p>

    ${articleBlocks}

    <div style="margin:32px 0;text-align:center;">
      <a href="https://hackwire.news" style="display:inline-block;background:#00FF88;color:#0A0A0F;font-weight:700;font-size:14px;padding:12px 28px;border-radius:6px;text-decoration:none;font-family:'JetBrains Mono',monospace;">VIEW ALL STORIES &rarr;</a>
    </div>

    <div style="border-top:1px solid #1E1E2E;padding-top:20px;margin-top:40px;">
      <p style="margin:0;font-size:12px;color:#475569;">
        HackWire &mdash; <a href="https://hackwire.news" style="color:#00FF88;text-decoration:none;">hackwire.news</a><br>
        You received this because you subscribed to the HackWire daily digest.
      </p>
    </div>
  </div>
</body>
</html>`
}

async function getSubscribers() {
  const res = await resend.contacts.list({ audienceId: RESEND_AUDIENCE_ID })
  if (!res.data?.data) return []
  return res.data.data.filter((c) => !c.unsubscribed).map((c) => c.email)
}

async function main() {
  const articles = getRecentArticles(24)

  if (articles.length === 0) {
    console.log('No articles in the last 24 hours — skipping digest.')
    return
  }

  const subscribers = await getSubscribers()
  if (subscribers.length === 0) {
    console.log('No subscribers — skipping digest.')
    return
  }

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  })

  const html = buildDigestHtml(articles, dateStr)
  const subject = `HackWire Daily — ${articles.length} stories for ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })}`

  console.log(`Sending digest (${articles.length} articles) to ${subscribers.length} subscriber(s)...`)

  const result = await resend.emails.send({
    from: 'HackWire <newsletter@hackwire.news>',
    to: subscribers,
    subject,
    html,
  })

  if (result.error) {
    console.error('Send failed:', result.error)
    process.exit(1)
  }

  console.log(`Digest sent! ID: ${result.data?.id}`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
