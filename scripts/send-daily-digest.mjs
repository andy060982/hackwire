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

function getAllArticles() {
  const data = readFileSync(join(PROJECT_ROOT, 'src/lib/articles-data.json'), 'utf-8')
  return JSON.parse(data)
}

function getRecentArticles(allArticles, hours = 24) {
  const cutoff = Date.now() - hours * 60 * 60 * 1000

  return allArticles
    .filter((a) => new Date(a.publishedAt).getTime() > cutoff)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

const CATEGORY_ORDER = ['breaches', 'vulnerabilities', 'malware', 'ransomware', 'policy', 'tools']

const CATEGORY_HEADLINES = {
  breaches: 'Breaches & Data Exposure',
  vulnerabilities: 'Vulnerabilities & CVEs',
  malware: 'Malware Campaigns',
  ransomware: 'Ransomware Activity',
  policy: 'Policy & Regulation',
  tools: 'Tools & Research',
}

const CATEGORY_LINKS = {
  breaches: 'https://hackwire.news/category/breaches',
  vulnerabilities: 'https://hackwire.news/category/vulnerabilities',
  malware: 'https://hackwire.news/category/malware',
  ransomware: 'https://hackwire.news/category/ransomware',
  policy: 'https://hackwire.news/category/policy',
  tools: 'https://hackwire.news/category/tools',
}

function buildNewsSectionHtml(articles) {
  // Group articles by category
  const grouped = {}
  for (const a of articles) {
    if (!grouped[a.category]) grouped[a.category] = []
    grouped[a.category].push(a)
  }

  const sections = CATEGORY_ORDER
    .filter((cat) => grouped[cat] && grouped[cat].length > 0)
    .map((cat) => {
      const color = CATEGORY_COLORS[cat] || '#64748b'
      const heading = CATEGORY_HEADLINES[cat] || cat
      const catLink = CATEGORY_LINKS[cat]
      const items = grouped[cat]

      const newsItems = items
        .map((a) => {
          const severity = a.severity === 'critical' || a.severity === 'high'
            ? ` <span style="font-size:11px;font-weight:700;color:${a.severity === 'critical' ? '#FF3B3B' : '#F59E0B'};">[${a.severity.toUpperCase()}]</span>`
            : ''
          return `
          <p style="font-size:14px;line-height:1.7;color:#cbd5e1;margin:0 0 14px;">
            ${severity}<a href="https://hackwire.news/news/${a.slug}" style="color:#ffffff;text-decoration:none;font-weight:600;">${a.headline}</a> &mdash;
            <span style="color:#94a3b8;">${a.summary}</span>
            <a href="https://hackwire.news/news/${a.slug}" style="color:#00FF88;text-decoration:none;font-size:12px;font-family:'JetBrains Mono',monospace;"> Read more &rarr;</a>
          </p>`
        })
        .join('\n')

      return `
      <div style="margin-bottom:28px;">
        <div style="border-bottom:1px solid #1E1E2E;padding-bottom:8px;margin-bottom:16px;">
          <a href="${catLink}" style="text-decoration:none;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:8px;vertical-align:middle;"></span>
            <span style="font-size:13px;font-weight:700;color:#ffffff;font-family:'JetBrains Mono',monospace;letter-spacing:0.5px;">${heading}</span>
            <span style="font-size:11px;color:#64748b;margin-left:8px;">(${items.length})</span>
          </a>
        </div>
        ${newsItems}
      </div>`
    })
    .join('\n')

  return sections
}

function buildThreatIntelHtml(articles, allArticles) {
  // Compute real stats from today's articles + recent history
  const criticalCount = articles.filter((a) => a.severity === 'critical' || a.severity === 'high').length
  const breachCount = articles.filter((a) => a.category === 'breaches').length
  const malwareCount = articles.filter((a) => a.category === 'malware' || a.category === 'ransomware').length
  const vulnCount = articles.filter((a) => a.category === 'vulnerabilities').length
  const policyCount = articles.filter((a) => a.category === 'policy').length
  const toolsCount = articles.filter((a) => a.category === 'tools').length

  const stats = [
    { label: 'Critical/High Severity', value: criticalCount, color: '#FF3B3B', link: 'https://hackwire.news' },
    { label: 'Breaches', value: breachCount, color: '#FF3B3B', link: 'https://hackwire.news/category/breaches' },
    { label: 'Vulnerabilities', value: vulnCount, color: '#F59E0B', link: 'https://hackwire.news/category/vulnerabilities' },
    { label: 'Malware & Ransomware', value: malwareCount, color: '#A855F7', link: 'https://hackwire.news/category/malware' },
    { label: 'Policy & Regulation', value: policyCount, color: '#3B82F6', link: 'https://hackwire.news/category/policy' },
    { label: 'Tools & Research', value: toolsCount, color: '#22C55E', link: 'https://hackwire.news/category/tools' },
  ].filter((s) => s.value > 0)

  const rows = stats
    .map(
      (s) => `
      <tr>
        <td style="padding:8px 12px;">
          <a href="${s.link}" style="color:#cbd5e1;text-decoration:none;font-size:13px;font-family:'JetBrains Mono',monospace;">${s.label}</a>
        </td>
        <td style="padding:8px 12px;text-align:right;">
          <a href="${s.link}" style="text-decoration:none;font-size:14px;font-weight:700;color:${s.color};font-family:'JetBrains Mono',monospace;">${s.value}</a>
        </td>
      </tr>`
    )
    .join('\n')

  return `
    <div style="background:#0F0F1A;border:1px solid #1E1E2E;border-radius:8px;margin-bottom:28px;overflow:hidden;">
      <div style="padding:12px 16px;border-bottom:1px solid #1E1E2E;background:#0A0A14;">
        <a href="https://hackwire.news" style="text-decoration:none;">
          <span style="color:#00FF88;font-size:11px;font-family:'JetBrains Mono',monospace;">&#9654;</span>
          <span style="font-size:11px;font-weight:700;color:#00FF88;font-family:'JetBrains Mono',monospace;letter-spacing:1px;margin-left:6px;">THREAT INTEL &mdash; LAST 24H</span>
        </a>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        ${rows}
      </table>
    </div>`
}

function buildDigestHtml(articles, allArticles, dateStr) {
  const threatIntel = buildThreatIntelHtml(articles, allArticles)
  const newsSections = buildNewsSectionHtml(articles)

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

    ${threatIntel}

    <div style="margin-bottom:28px;">
      <div style="border-bottom:2px solid #1E1E2E;padding-bottom:8px;margin-bottom:24px;">
        <span style="font-size:11px;font-weight:700;color:#00FF88;font-family:'JetBrains Mono',monospace;letter-spacing:1px;">TODAY'S BRIEFING &mdash; ${articles.length} STORIES</span>
      </div>
    </div>

    ${newsSections}

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
  const allArticles = getAllArticles()
  const articles = getRecentArticles(allArticles, 24)

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

  const html = buildDigestHtml(articles, allArticles, dateStr)
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
