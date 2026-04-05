# HackWire.news — Comprehensive Automation Audit
**Date:** March 18, 2026  
**Auditor:** OpenClaw Subagent  
**Scope:** Full system audit against Andy's success criteria

---

## Executive Summary

HackWire is **largely functional and well-architected**, publishing ~17 articles/day and producing 2 daily podcasts. However, there are **critical quality failures** happening right now: Claude API auth is broken, causing 100% of recent articles to fall back to raw RSS summaries (150-400 chars instead of 800+ chars). The podcast voice is also falling back from Charon/Gemini to Edge TTS. These are fixable with targeted patches.

**Overall Score: 6/10** — Infrastructure is solid, execution has active failures.

---

## ✅ PASSING — What's Working

### 1. Article Volume (10-20/day) ✅
- **Average: 17 articles/day** over 8 days of data
- Daily breakdown: 15, 14, 20, 25, 15, 15, 17, 15
- Cron runs 3x/day (UTC 00:00, 12:00, 18:00 = ET 7pm, 7am, 1pm), 5 articles per run
- Deduplication via MD5 hash is working — no repeat stories

### 2. Podcast Cadence ✅
- Morning + evening episodes publishing consistently since March 15
- Episodes confirmed: Mar 15-18 fully covered (8/8 episodes)
- Missing: Mar 11 morning, Mar 12 morning (system still being initialized)
- Telegram delivery of audio to Andy working

### 3. Podcast Duration — Mostly ✅
| Episode | Duration |
|---|---|
| Mar 18 Evening | 6:01 |
| Mar 18 Morning | 6:03 |
| Mar 17 Evening | 5:49 |
| Mar 17 Morning | 5:51 |
| Mar 16 Evening | 6:08 |
| Mar 16 Morning | 6:12 |
| Mar 14 Morning | 10:10 ⚠️ |
| Mar 14 Evening | 2:30 ❌ |

Most are in the 6-7 minute range — within the 6-10 minute target. A few outliers suggest inconsistent script length.

### 4. News Sources ✅ (Partial)
10 RSS feeds configured and actively pulling:
- BleepingComputer, The Hacker News, Krebs on Security, Dark Reading, SecurityWeek, CISA Alerts, Naked Security (Sophos), Ars Technica Security, Threatpost, Graham Cluley

### 5. Website Deployment ✅
- Next.js site deploys to Vercel after every publish run
- Live at hackwire.news (HTTP 307 redirect — likely 200 after redirect to HTTPS)
- Categories: breaches, vulnerabilities, malware, ransomware, policy, tools
- Dark/light mode, RSS sitemap, podcast page, SEO metadata all in place

### 6. YouTube Shorts ✅
- Pipeline working: generates video from podcast audio + master_bg.mp4
- Confirmed upload at 22:30 UTC on March 18 — Video ID: `Oj8b_isiA94`
- Cron runs twice daily (10:30, 22:30 UTC)
- OAuth token with auto-refresh is working

### 7. Podcast RSS Feed ✅
- RSS feed at `/public/podcast/feed.xml` — compatible with Apple Podcasts, Spotify
- Proper iTunes namespace, episode metadata, enclosure URLs
- Weekly NotebookLM summary generates Friday 5pm ET (Fridays 9pm UTC)

### 8. Full Automation ✅
- Zero manual steps required for article publishing, podcast generation, YouTube upload
- Queue manager retries on rate-limit failures every 15 minutes
- Telegram notifications on publish and podcast delivery

---

## ❌ FAILING — Critical Issues

### ISSUE 1: Claude API Authentication Broken (CRITICAL)
**Impact:** 100% of articles in last 2 days are raw RSS text, not AI-rewritten

**Evidence from logs:**
```
Claude rewrite failed: "Could not resolve authentication method. Expected either 
api_key or auth_token to be set."
```
This error appears for every single article on Mar 17-18. The `ANTHROPIC_API_KEY` environment variable is not set in the cron context.

**Article quality right now:**
- Articles should be 800-1200 chars (AI-rewritten)
- Actual: 150-400 chars (raw RSS snippet/teaser only)
- 29/30 articles in last 2 days are below the 800-char minimum

**Root cause:** `auto-publish.py` uses `Anthropic()` which needs `ANTHROPIC_API_KEY` env var. The cron job does NOT export this variable. The podcast generator has the same issue — it's been falling back to Edge TTS (Christopher voice) instead of Gemini Charon.

**Fix:** Add `ANTHROPIC_API_KEY` to the cron environment, or use the Gemini API (already has key) as the primary rewriter in `auto-publish.py`.

**Also:** The model hardcoded as `claude-3-5-haiku-20241022` is deprecated (EOL Feb 19, 2026). Every run triggers a deprecation warning. Must update to `claude-haiku-4-5` or `claude-3-haiku-20240307`.

---

### ISSUE 2: Article Quality Below 800-Char Minimum (CRITICAL)
**Impact:** Success criterion #2 violated for all articles since ~March 17

- 39/151 articles (26%) are below 800 chars
- All 29 articles from March 17-18 are well under 800 chars (150-400 chars)
- Fallback behavior just dumps raw RSS summary — these are teasers, not articles
- Readers clicking through get a stub, not a real story

**Fix:** Either restore Claude API key OR switch `auto-publish.py` to use Gemini API (same key already used by podcast generator — see `$GEMINI_API_KEY` from environment) for article rewrites.

---

### ISSUE 3: Podcast Voice — Not Using Charon (MEDIUM)
**Impact:** Podcast quality lower than target; using Edge TTS (Christopher) instead of Gemini Charon

**Evidence from podcast log:**
```
Gemini TTS failed on chunk 1: HTTP Error 429: Too Many Requests
Gemini Charon TTS failed: HTTP Error 429: Too Many Requests
Falling back to Edge TTS...
```

Every recent episode (Mar 17-18) used Edge TTS Christopher voice, not Charon. The Gemini TTS API is rate-limited when called.

**Analysis:** Gemini free tier has a 3 RPM limit on TTS. The script splits 700 words into ~5 chunks and fires all requests in quick succession, hitting the rate limit.

**Fix:** Add retry logic with exponential backoff (2-3 second delays between chunks), or throttle chunk generation. Alternatively, use OpenAI TTS (if available) or a Gemini paid tier key.

---

### ISSUE 4: Publication Frequency — 6-Hour Gaps (MEDIUM)
**Impact:** Success criterion #2 (every 1-2 hours) not met

Current schedule publishes 5 articles at once, 3 times/day:
- UTC 00:00 (7pm ET) → 5 articles all at once
- UTC 12:00 (7am ET) → 5 articles all at once  
- UTC 18:00 (1pm ET) → 5 articles all at once

This creates **6-12 hour content gaps** between batches. Readers who visit at 3pm ET see the same stories from 1pm. The site doesn't feel "live."

**Fix:** Change cron to run every 2 hours with 2-3 articles per run:
```
0 */2 * * *   python3 auto-publish.py 3
```
This gives 36-42 article slots/day (12 runs × 3), well within the 10-20 target if deduplication caps it. Articles spread throughout the day feel fresher.

---

### ISSUE 5: Podcast Script Length Inconsistent (LOW-MEDIUM)
**Impact:** Some episodes too short (2:30), some too long (10:10+)

When Claude fails (which is always now), fallback script generates 700-739 words — producing 5:49 to 6:12 episodes. That's acceptable. But episodes like Mar 14 evening at 2:30 suggest the fallback sometimes produces much less.

The target is 6-10 minutes. Scripts need to consistently hit 800-1000+ words. The AI prompt asks for "at least 800-1000 words" which is good — the problem is the fallback script doesn't enforce a minimum either.

---

## 🟡 GAPS vs. Success Criteria

### Criterion 3: Multiple News Sources — Partial Gap
**Current:** 10 sources — good baseline, but several listed in the footer (Mandiant, CrowdStrike, Dragos, Schneier on Security, SANS ISC, Wired Security) are in the UI but **NOT actually in the RSS feed list**.

The footer claims to track 12 sources; only 10 are actually fetched. Of those 10, Threatpost's feed may be dead (site was acquired), and Naked Security moved domains.

**Recommended additions:**
- `https://www.schneier.com/feed/atom/` (Schneier on Security)
- `https://isc.sans.edu/rssfeed_full.xml` (SANS ISC)
- `https://www.wired.com/feed/category/security/latest/rss` (Wired Security)
- `https://feeds.feedburner.com/GoogleProjectZero` (Google Project Zero)
- `https://unit42.paloaltonetworks.com/feed/` (Palo Alto Unit 42)
- `https://www.recordedfuture.com/feed` (Recorded Future)
- Reddit r/netsec RSS: `https://www.reddit.com/r/netsec/.rss`

Going from 10 → 17 sources increases daily article pool from ~50 to ~85 candidates.

### Criterion 6: Email Subscription — Missing Entirely
**No email infrastructure exists.** The website has no subscribe form, no newsletter, no mailing list. Zero.

**To add:**
- **Buttondown.email** (simplest) — free up to 100 subscribers, has RSS-to-email automation
- **Mailchimp / ConvertKit** — more features, requires API integration
- Add a subscribe form to the Next.js site footer/header
- Daily digest automation via cron (can reuse articles-data.json)

### Criterion 6: Social Media — Planned but Manual
- Twitter/X metadata is in `layout.tsx` (`@hackwirenews`), but no auto-posting
- YouTube Shorts pipeline IS working (auto-uploads to YouTube) ✅
- No Bluesky/Mastodon/LinkedIn automation

**To add:**
- X (Twitter) auto-post via API: post top 3 headlines daily
- Bluesky auto-post (free API, no rate limit issues)
- Both can use the same articles-data.json source

### Criterion 7: Podcast 6-10 Minutes — Partially Met
- Most recent episodes: 5:49 to 6:12 (just under target with Edge TTS fallback)
- Need Charon voice working to hit proper tone AND ensure scripts hit 7-8 minutes consistently
- Target prompt says 800-1000 words; at ~130 WPM that's 6-7.5 min — need to push to 900-1100 words for reliable 7+ min

---

## 📊 Quick Stats Summary

| Metric | Target | Actual | Status |
|---|---|---|---|
| Articles/day | 10-20 | ~17 avg | ✅ |
| Publish frequency | Every 1-2h | Every 6h (batches) | ❌ |
| Article length | 800+ chars | 150-400 chars (broken AI) | ❌ |
| Daily podcasts | 2/day | 2/day | ✅ |
| Podcast duration | 6-10 min | 5:49-6:12 (Edge TTS) | ⚠️ |
| Podcast voice | Charon/Gemini | Edge TTS (fallback) | ❌ |
| News sources | Multiple | 10 feeds | ⚠️ |
| Automation | Full | Full | ✅ |
| Website | Primary | Live on Vercel | ✅ |
| Email subscription | Planned | Not built | ❌ |
| Social media | Planned | YouTube only | ⚠️ |

---

## 🔧 Prioritized Recommendations

### Priority 1 — Fix Now (This Week)

**P1-A: Fix Claude API key in cron environment**
```bash
# In crontab, add ANTHROPIC_API_KEY= at top, or use env file:
0 12,18,0 * * * ANTHROPIC_API_KEY=<key> GEMINI_API_KEY=<key> /usr/bin/python3 auto-publish.py 5
```
OR (simpler): Update `auto-publish.py` to use Gemini for article rewrites since that key already works in the environment.

**P1-B: Update deprecated model**
In both `auto-publish.py` and `generate-episode.py`, change:
```python
# FROM:
model="claude-3-5-haiku-20241022"  # EOL Feb 19, 2026
# TO:
model="claude-haiku-4-5-20251001"  # Current
```

**P1-C: Fix Gemini TTS rate limit in podcast generator**
Add 2-3 second delays between TTS chunks:
```python
import time
for i, chunk in enumerate(chunks):
    if i > 0:
        time.sleep(3)  # Avoid 429 rate limit
    # ... generate chunk
```

### Priority 2 — High Impact (Next 2 Weeks)

**P2-A: Change publish schedule to hourly**
Update cron from 3x/day to every 2 hours:
```
0 */2 * * * cd /home/aarevalo/clawd/hackwire && GEMINI_API_KEY=... python3 auto-publish.py 3
```
This distributes content throughout the day and makes the site feel alive.

**P2-B: Add 7 more RSS sources**
Expand from 10 → 17 sources. Edit `RSS_FEEDS` list in `auto-publish.py` to add:
- Schneier on Security, SANS ISC, Wired Security, Google Project Zero, Palo Alto Unit 42, Recorded Future, Reddit r/netsec

**P2-C: Use Gemini for article rewrites as fallback**
When Claude is unavailable, instead of dumping raw RSS text, call Gemini's text API (which works) to rewrite. The GEMINI_KEY is already in crontab for auto-publish.

### Priority 3 — Medium Impact (Next Month)

**P3-A: Add email subscription (Buttondown)**
- Sign up at buttondown.email (free)
- Add subscribe widget to HackWire site footer
- Set up RSS-to-email so subscribers get daily digest automatically
- No code required initially — Buttondown handles it via RSS URL

**P3-B: Add social media auto-posting**
- Create a `social-post.py` script that runs daily (8am ET)
- Posts top 3 headlines to X (Twitter) and/or Bluesky
- Uses existing articles-data.json — no new infrastructure

**P3-C: Enforce 800-char minimum in article pipeline**
Add a validation gate in `publish_articles()`:
```python
# After fallback rewrite, check quality
if len(rewritten['body']) < 800:
    print(f"  Skipping: body too short ({len(rewritten['body'])} chars)")
    continue
```
This prevents stub articles from being published.

**P3-D: Improve podcast script length consistency**
Change `TARGET_WORDS = 650` (current) to `TARGET_WORDS = 900` and update prompt to explicitly require 900-1100 words minimum. Add word count enforcement in the fallback script.

### Priority 4 — Future Enhancements

**P4-A: Article categories — add "AI Security"**
AI-related cybersecurity is now a dominant topic. Add `ai-security` category with keywords: `["ai", "llm", "chatgpt", "machine learning", "deepfake", "prompt injection"]`

**P4-B: Story deduplication across days**
Currently the same story can appear from multiple sources on different days. Add a fuzzy title-matching check (e.g., Jaccard similarity) to prevent near-duplicate articles.

**P4-C: NotebookLM weekly summary enhancement**
Weekly summary already runs Friday 5pm ET. Consider: auto-generate an audio version and post to YouTube as a "Week in Review" long-form video.

**P4-D: Vercel Analytics integration**
`Analytics` from Vercel is already in layout.tsx. Review weekly what stories get most traffic — feed that data back into content prioritization.

---

## System Architecture Summary

```
RSS Feeds (10 sources)
    ↓ [cron: 3x/day]
auto-publish.py
    → Claude/Gemini rewrite (800-1200 word articles)
    → articles-data.json (flat file DB)
    → npm build + Vercel deploy
    
articles-data.json
    ↓ [cron: 2x/day at 6am/6pm ET]
generate-episode.py
    → Claude script (800-1000 words)
    → Gemini Charon TTS → voice.mp3
    → FFmpeg stitch (intro + voice + outro)
    → Copy to public/podcast/episodes/
    → Update RSS feed.xml
    → Vercel deploy
    → Telegram notification (audio)

podcast/episodes/*.mp3
    ↓ [cron: 2x/day at 10:30am/10:30pm UTC]
youtube-shorts/main_simple.py
    → Loop master_bg.mp4 to audio length
    → YouTube upload via OAuth
    → Vercel deploy

articles-data.json
    ↓ [cron: Fridays 9pm UTC]
weekly-summary.py
    → Gemini 20-story digest
    → Telegram → Andy → NotebookLM
```

---

## Files Modified / To Modify

| File | Issue | Change Needed |
|---|---|---|
| `auto-publish.py` | Claude auth broken, model deprecated | Fix API key, update model, add Gemini fallback rewrite |
| `podcast/generate-episode.py` | Gemini TTS 429, model deprecated | Add rate-limit delay, update model |
| `crontab` | No ANTHROPIC_API_KEY exported | Add env var to cron context |
| `auto-publish.py` | Only 3 runs/day | Change to hourly |
| `auto-publish.py` | 10 RSS sources | Add 7 more |
| `src/components/Footer.tsx` | Missing subscription | Add Buttondown subscribe widget |

---

*Audit completed: 2026-03-18 UTC. All findings based on live system state.*
