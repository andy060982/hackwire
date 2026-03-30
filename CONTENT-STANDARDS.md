# HackWire Content Standards

## Article Formatting Rules

All articles published on HackWire MUST follow these formatting rules:

### Paragraph Structure
- **NEVER** produce a wall of text — always break into clear paragraphs
- Each paragraph should be 3-5 sentences maximum
- Separate paragraphs with blank lines (two newlines: `\n\n`)
- Long RSS-sourced articles with no newlines must be split at sentence boundaries

### Section Headings
- Use `**Section Name**` on its own line for section headers
- Standard sections for deep-dive articles:
  1. Opening paragraph (no header needed)
  2. **Background and Context**
  3. **Technical Analysis**
  4. **Scope and Impact**
  5. **Detection and Response**
  6. **Broader Implications**
- Headings must NEVER repeat — each heading should appear only once
- Heading text must NOT bleed into paragraph content (heading is its own line)

### TL;DR
- Must always end at a complete sentence boundary
- NEVER truncate with "..." or "…"
- If the TL;DR would exceed 200 chars, cut at the last complete sentence under 200
- Must not be identical to the headline or the summary

### Content Quality
- Do NOT reference figures, diagrams, charts, tables, or images — there are none
- Remove phrases like "See Figure 1", "As shown in Diagram 2", etc.
- Do NOT use generic filler paragraphs that apply to any article
- Every sentence should add specific value related to the actual incident

### Severity and Categories
- Severity: critical, high, medium, low
- Categories: breaches, vulnerabilities, malware, ransomware, policy, tools

## Pipeline Overview

### Content Flow
1. `auto-publish.py` — fetches from 15 RSS feeds 3x/day, creates fallback articles
2. `article-rewriter-agent.py` — monitors queue, rewrites articles via Claude (2000+ chars)
3. `podcast-generate-and-deploy.sh` — generates podcast episodes via gTTS, deploys
4. Vercel deployment — static site rebuild

### Files Modified
- `src/lib/articles-data.json` — article database
- `src/lib/podcast-data.ts` — podcast episode metadata
- `article-rewrite-queue.json` — articles awaiting AI rewrite
- `podcast/podcast-queue.json` — podcast episodes awaiting generation

### Rendering (src/app/news/[slug]/page.tsx)
- `smartSplitIntoParagraphs()` — handles wall-of-text articles by:
  - Splitting at sentence boundaries (~500 chars per paragraph)
  - Detecting section headers (Introduction, Technical Analysis, etc.)
  - Deduplicating headers (only first occurrence becomes an `<h2>`)
  - Stripping figure/diagram references
- `renderBody()` — converts paragraphs to HTML with `<h2>`, `<p>`, `<li>`, `<pre><code>`

## Known Issues (Fixed 2026-03-23)
- **Wall-of-text rendering**: Some RSS-sourced articles had 0 newlines (19,000+ chars in one block). Fixed with `smartSplitIntoParagraphs()`.
- **Duplicate headings**: "The Coruna" appeared 4x because header detection matched every occurrence. Fixed with `usedHeaders` Set deduplication.
- **Heading bleed**: "Conclusion Google has been..." — header text wasn't separated from content. Fixed by splitting sentence at header match boundary.
- **Truncated TL;DR**: Auto-publish was doing `text[:200] + "..."`. Fixed to split at sentence boundaries.
- **Date bug**: `formatTimeAgo()` had a hardcoded date (Jan 14, 2025) instead of `Date.now()`. Fixed.
- **Favicon missing**: No favicon existed. Added SVG favicon.
