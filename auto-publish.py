#!/usr/bin/env python3
"""
HackWire Auto-Publisher
Pulls cybersecurity news from RSS feeds, rewrites via AI, publishes to site.
Runs via cron: 0 8,14,20 * * * (3x/day)
"""

import feedparser
import json
import os
import re
import subprocess
import sys
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

from dotenv import load_dotenv

SCRIPT_DIR = Path(__file__).parent
load_dotenv(SCRIPT_DIR / ".env")
ARTICLES_FILE = SCRIPT_DIR / "src" / "lib" / "articles-data.json"
PUBLISHED_TRACKER = SCRIPT_DIR / ".published-articles.json"
VERCEL_TOKEN = os.environ.get("VERCEL_TOKEN", "")

# Claude Haiku for article rewriting (via OpenClaw/Anthropic)

# RSS Sources
RSS_FEEDS = [
    ("BleepingComputer", "https://www.bleepingcomputer.com/feed/"),
    ("The Hacker News", "https://feeds.feedburner.com/TheHackersNews"),
    ("Krebs on Security", "https://krebsonsecurity.com/feed/"),
    ("Dark Reading", "https://www.darkreading.com/rss.xml"),
    ("SecurityWeek", "https://www.securityweek.com/feed/"),
    ("CISA Alerts", "https://www.cisa.gov/cybersecurity-advisories/all.xml"),
    ("Naked Security", "https://nakedsecurity.sophos.com/feed/"),
    ("Ars Technica Security", "https://feeds.arstechnica.com/arstechnica/security"),
    ("Threatpost", "https://threatpost.com/feed/"),
    ("Graham Cluley", "https://grahamcluley.com/feed/"),
]

CATEGORY_KEYWORDS = {
    "breaches": ["breach", "leak", "exposed", "stolen", "hack", "compromise", "data loss", "records"],
    "vulnerabilities": ["vulnerability", "cve", "zero-day", "0day", "exploit", "patch", "flaw", "bug", "rce"],
    "malware": ["malware", "trojan", "spyware", "backdoor", "botnet", "worm", "virus", "infostealer"],
    "ransomware": ["ransomware", "ransom", "encrypt", "lockbit", "blackcat", "clop", "extortion"],
    "policy": ["regulation", "law", "policy", "compliance", "gdpr", "cisa", "nist", "government", "fbi", "doj"],
    "tools": ["tool", "open-source", "release", "framework", "scanner", "github", "software"],
}

def load_published():
    """Load set of already-published article hashes."""
    if PUBLISHED_TRACKER.exists():
        return set(json.loads(PUBLISHED_TRACKER.read_text()))
    return set()

def save_published(published: set):
    PUBLISHED_TRACKER.write_text(json.dumps(list(published)))

def load_articles():
    if ARTICLES_FILE.exists():
        return json.loads(ARTICLES_FILE.read_text())
    return []

def save_articles(articles):
    ARTICLES_FILE.write_text(json.dumps(articles, indent=2, ensure_ascii=False))

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'-+', '-', text)
    return text[:80].strip('-')

def classify_category(title: str, summary: str) -> str:
    text = (title + " " + summary).lower()
    scores = {}
    for cat, keywords in CATEGORY_KEYWORDS.items():
        scores[cat] = sum(1 for kw in keywords if kw in text)
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "vulnerabilities"

def clean_rss_content(content: str) -> str:
    """Remove RSS feed template boilerplate that shouldn't be in articles."""
    # Remove "Read more in my article on the [Blog] blog" type text
    content = re.sub(r'\s*Read more in my article on the .+ blog\.?\s*', '', content, flags=re.IGNORECASE)
    # Remove "The post [Title] appeared first on [Source]" type text
    content = re.sub(r'\s*The post .+ appeared first on .+\.?\s*', '', content, flags=re.IGNORECASE)
    # Clean up trailing whitespace
    content = content.strip()
    return content

def classify_severity(title: str, summary: str) -> str:
    text = (title + " " + summary).lower()
    critical_words = ["critical", "zero-day", "0day", "emergency", "actively exploited", "nation-state", "millions"]
    high_words = ["breach", "ransomware", "vulnerability", "exploit", "hack"]
    if any(w in text for w in critical_words):
        return "critical"
    if any(w in text for w in high_words):
        return "high"
    return "medium"

def extract_full_content(entry: dict) -> str:
    """Extract maximum content from RSS entry (checks multiple fields)."""
    content = ""
    
    # Try content:encoded first (CDATA full-text)
    if "content" in entry:
        for content_block in entry.content:
            if content_block.get("value"):
                content = content_block["value"]
                break
    
    # Fall back to summary (description)
    if not content:
        content = entry.get("summary", entry.get("description", ""))
    
    # Last resort: just the title
    if not content:
        content = entry.get("title", "")
    
    # Strip HTML tags
    content = re.sub(r'<[^>]+>', '', content)
    
    # Clean up whitespace
    content = re.sub(r'\s+', ' ', content).strip()
    
    return content

def fetch_feeds():
    """Fetch all RSS feeds and return raw entries with maximum content."""
    entries = []
    for source_name, feed_url in RSS_FEEDS:
        try:
            feed = feedparser.parse(feed_url)
            for entry in feed.entries[:5]:  # Latest 5 per source
                title = entry.get("title", "").strip()
                
                # Extract maximum available content
                full_content = extract_full_content(entry)
                
                link = entry.get("link", "")
                published = entry.get("published", entry.get("updated", ""))
                
                if title and full_content:
                    entries.append({
                        "source": source_name,
                        "sourceUrl": link,
                        "title": title,
                        "summary_full": full_content,  # Keep full content (max extraction)
                        "summary": full_content[:500],  # Truncated preview (max 500 chars)
                        "published": published,
                    })
        except Exception as e:
            print(f"  Warning: Failed to fetch {source_name}: {e}")
    return entries

def rewrite_article_with_claude(entry: dict) -> dict | None:
    """Rewrite article using Claude directly through OpenClaw session."""
    try:
        full_content = entry.get("summary_full", entry["summary"])
        headline = entry["title"]
        source = entry.get("source", "")

        # Truncate extremely long content (CISA advisories can be 10k+ chars of raw dumps)
        # Keep enough for Claude to work with but not overwhelm it
        if len(full_content) > 4000:
            full_content = full_content[:4000] + "\n[Content truncated for processing]"

        # Detect CISA/ICS advisory content for specialized handling
        is_advisory = source == "CISA Alerts" or "cisa.gov" in entry.get("sourceUrl", "") or \
                      any(kw in full_content.lower() for kw in ["cvss", "cwe-", "ics-cert", "icsa-", "affected products", "mitigations"])

        # Detect article category for category-aware internal linking
        category = classify_category(headline, full_content)
        category_url = f"https://www.hackwire.news/category/{category}"
        # Two related pillar pages other than the primary
        related_pillars = [c for c in CATEGORY_KEYWORDS.keys() if c != category][:2]
        related_pillar_links = " and ".join(
            f"[{p.replace('-', ' ').title()}](https://www.hackwire.news/category/{p})" for p in related_pillars
        )

        analysis_block = f"""

## HackWire Analysis

REQUIRED: write 200-300 words of original commentary that goes beyond restating the source. Pick the angle that fits the story:
- Why this matters now (timing / who's exposed / what changes)
- Pattern recognition (does this fit a broader trend? prior incidents to compare against?)
- Hidden risk or detail other reporting is missing
- Concrete next steps for defenders or specific industries
This must be substantive, opinionated journalism — not a paraphrase of the source. Sign off the section with "— HackWire Editorial."

## Related Coverage

REQUIRED: end with 3 short bullets that internally link to relevant HackWire category pages. Use this exact markdown format and include all three bullets:
- Read more in our [{category.replace('-', ' ').title()}]({category_url}) coverage
- Cross-reference with {related_pillar_links}
- Stay current via the [HackWire homepage](https://www.hackwire.news/)
"""

        if is_advisory:
            rewrite_prompt = f"""You are a professional cybersecurity journalist writing for HackWire.

Rewrite this security advisory into a well-structured 1000-1400 word article using markdown formatting.

REQUIRED STRUCTURE (use these exact markdown headers):
# [Compelling headline about the vulnerability/threat]

## The Threat
[2-3 paragraphs explaining what the vulnerability is and why it matters]

## Severity and Impact
[Include a markdown table with CVE, CVSS score, vector string, attack complexity, authentication requirements]

## Affected Products
[Organized list of affected products/versions — consolidate duplicates into clean bullet points]

## Mitigations
[What organizations should do — firmware updates, workarounds, network segmentation, etc.]

## References
[Links to the original advisory and vendor pages]
{analysis_block}
IMPORTANT RULES:
- Decode HTML entities (&amp; → &, etc.)
- Consolidate duplicate product listings into clean grouped lists
- Do NOT dump raw advisory text — restructure it into readable journalism
- Include CVE numbers, CVSS scores, and CWE identifiers in the severity table
- End with actionable recommendations and the required HackWire Analysis + Related Coverage sections

SOURCE ADVISORY:
Title: {headline}
Content: {full_content}

Write the full article now in markdown."""
        else:
            rewrite_prompt = f"""You are a professional cybersecurity journalist writing for HackWire.

Expand this news summary into a comprehensive 1000-1400 word article using markdown formatting.

REQUIRED FORMAT:
- Start with a # headline
- Use ## section headers (e.g., ## The Threat, ## Background and Context, ## Technical Details, ## Implications, ## Recommendations)
- Use bullet points, bold text, and tables where appropriate
- Write in professional journalistic style
{analysis_block}
The article must:
1. Provide full context and background
2. Explain technical details in accessible language
3. Discuss implications for organizations
4. Include recommendations where applicable
5. Maintain journalistic objectivity
6. End with the REQUIRED "HackWire Analysis" and "Related Coverage" sections shown above

CROSS-REFERENCES (include ONLY if the topic is healthcare/medical related):
- If the article covers a healthcare data breach, patient data, or medical device security, include ONE natural reference: "Healthcare providers should review their security posture — for health information resources, visit VitaGuia (vitaguia.com) or Lake Nona Medical Services (nonamedicalservices.com)."
- Only include this if genuinely relevant. Most cybersecurity articles should NOT include this.

ORIGINAL SUMMARY:
Title: {headline}
Content: {full_content}

Write the full article now. Include all important details, context, and analysis."""

        # Use Claude CLI (already authenticated) instead of SDK
        result = subprocess.run(
            ["claude", "-p", "--model", "claude-haiku-4-5-20251001"],
            input=rewrite_prompt,
            capture_output=True, text=True, timeout=120
        )
        if result.returncode != 0:
            raise Exception(f"Claude CLI error: {result.stderr[:200]}")

        body = result.stdout.strip()
        
        if not body:
            raise Exception("Empty response from Claude")
        
        # Generate TL;DR
        tldr_prompt = f"""Write a 1-paragraph summary (2-3 sentences max, under 200 characters) of this article:\n\n{body[:2000]}\n\nSummary:"""

        tldr_result = subprocess.run(
            ["claude", "-p", "--model", "claude-haiku-4-5-20251001"],
            input=tldr_prompt,
            capture_output=True, text=True, timeout=60
        )
        tldr = tldr_result.stdout.strip() if tldr_result.returncode == 0 else body[:200] + "..."
        
        return {
            "headline": headline,
            "summary": full_content[:300],  # Preview from original
            "body": body,  # Full rewritten article
            "tldr": tldr,  # Quick summary
        }
    except Exception as e:
        print(f"  Claude rewrite failed: {e}, using fallback")
        return rewrite_article_fallback(entry)

def rewrite_article_gemini(entry: dict) -> dict | None:
    """Use Claude rewrite with fallback."""
    return rewrite_article_with_claude(entry)

def rewrite_article_fallback(entry: dict) -> dict:
    """Fallback: use RSS content directly, no AI."""
    full_content = entry.get("summary_full", entry["summary"])
    
    # Clean up RSS template boilerplate
    full_content = clean_rss_content(full_content)
    
    # Simple TL;DR from original summary
    tldr = full_content[:200] + "..." if len(full_content) > 200 else full_content
    
    return {
        "headline": entry["title"],
        "summary": entry["summary"][:300],  # Preview (truncated)
        "body": full_content,  # Full article content (cleaned)
        "tldr": tldr,  # Quick summary
    }

# Phrases that indicate AI refusal/meta-commentary instead of real content
AI_REFUSAL_PATTERNS = [
    "i need to clarify",
    "i need more information",
    "i don't see an article",
    "please provide",
    "you've provided the headline",
    "i'd be happy to write",
    "to write that summary",
    "however, the summary you provided",
    "the text you've shared appears",
    "i cannot write",
    "i'm unable to",
    "you haven't provided",
    "could you share the",
    "i'll need the actual",
    "no article content",
    "please share the article",
    "no problem —",
    "no problem,",
    "i'll write this",
    "i have enough context",
    "here's the rewritten",
    "here's the article",
    "let me write",
    "i'll craft",
    "based on the provided details",
    "web search was blocked",
    "i couldn't access",
    "in the meantime",
    "i need websearch",
    "could you grant",
]

def validate_article(rewritten: dict) -> bool:
    """Reject articles with AI refusal content, empty bodies, or bad headlines.
    Uses both exact patterns AND regex to catch AI meta-commentary."""
    headline = rewritten.get("headline", "")
    body = rewritten.get("body", "")
    tldr = rewritten.get("tldr", "")

    # Must have meaningful body content (at least 200 chars)
    if len(body.strip()) < 200:
        return False

    body_lower = body.lower()
    tldr_lower = tldr.lower()
    combined = body_lower + " " + tldr_lower

    # === EXACT PHRASE PATTERNS ===
    for pattern in AI_REFUSAL_PATTERNS:
        if pattern in combined:
            return False

    # === REGEX PATTERNS — catches variations the AI can rephrase ===
    refusal_regexes = [
        # First-person AI meta-commentary (the AI talking about itself/the task)
        r"\bi (need|notice|don'?t see|cannot|can'?t|wasn'?t able|am unable|don'?t have)",
        r"\bi'?(ll|d|m) (need|write|craft|create|draft|generate|produce|summarize)",
        r"\bcould you (paste|share|provide|send|give|include)",
        r"\bplease (provide|share|paste|send|give|include)",
        r"\byou'?ve? (provided|shared|given|sent|pasted)",
        r"\bthe (original |actual )?(summary|article|content|text) (is |you |was )?(incomplete|missing|empty|not provided|truncated)",
        r"\bto write (a |this |the |that )?(comprehensive|accurate|full|complete|proper)",
        r"\b(no|missing|incomplete|empty) (article |)(content|text|body|summary|details)",
        r"\bonce you (share|provide|paste|send)",
        # AI preamble / self-narration
        r"^(no problem|sure|absolutely|of course|happy to|glad to|let me|i'?ll)",
        r"\bbased on (the |my |)(provided|available|given|limited) (details|information|context|data)",
        r"\b(web ?search|internet access|live search|search permission) (was |were |is |)(blocked|unavailable|denied|failed|not available)",
    ]
    for rgx in refusal_regexes:
        if re.search(rgx, combined):
            return False

    # === STRUCTURAL CHECK — real articles don't start with "I" ===
    first_line = body.strip().split('\n')[0].strip()
    if first_line.startswith('I ') and len(first_line) < 200:
        # Article body starts with "I ..." — almost certainly AI meta-commentary
        return False

    # Reject emoji in headlines
    if any(ord(c) > 127 for c in headline):
        cleaned = re.sub(r'[^\x20-\x7E]', '', headline).strip()
        if len(cleaned) < len(headline) * 0.9:
            return False
        rewritten["headline"] = cleaned

    return True


def post_deploy_quality_scan(articles: list) -> list:
    """Scan ALL articles for AI refusal content. Returns list of bad articles."""
    bad = []
    for a in articles:
        fake = {"headline": a.get("headline", ""), "body": a.get("body", ""), "tldr": a.get("tldr", "")}
        if not validate_article(fake):
            bad.append(a)
            print(f"    ✗ BAD: {a['slug']}")
    return bad


RETRY_QUEUE_FILE = SCRIPT_DIR / "retry-queue.json"
MAX_RETRIES = 2

def load_retry_queue() -> list:
    if RETRY_QUEUE_FILE.exists():
        with open(RETRY_QUEUE_FILE) as f:
            return json.load(f)
    return []

def save_retry_queue(queue: list):
    with open(RETRY_QUEUE_FILE, "w") as f:
        json.dump(queue, f, indent=2)

def add_to_retry_queue(bad_articles: list, all_articles_data: list):
    """Add removed articles to retry queue with their source info."""
    queue = load_retry_queue()
    existing_slugs = {item["slug"] for item in queue}

    for a in bad_articles:
        if a["slug"] in existing_slugs:
            continue
        queue.append({
            "slug": a["slug"],
            "headline": a.get("headline", ""),
            "source": a.get("source", ""),
            "sourceUrl": a.get("sourceUrl", ""),
            "category": a.get("category", ""),
            "retries": 0,
            "added": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        })
        print(f"    → Queued for retry: {a['headline']}")

    save_retry_queue(queue)

def process_retry_queue(published: set, articles: list, existing_slugs: set) -> int:
    """Process retry queue — re-fetch and re-generate failed articles."""
    queue = load_retry_queue()
    if not queue:
        return 0

    print(f"  Processing retry queue ({len(queue)} items)...")
    new_count = 0
    remaining = []

    for item in queue:
        if item["retries"] >= MAX_RETRIES:
            print(f"    ✗ PERMANENTLY SKIPPED (max retries): {item['headline']}")
            continue

        item["retries"] += 1

        # Build a fake RSS entry from the saved source info
        entry = {
            "title": item["headline"],
            "summary": item["headline"],
            "summary_full": item["headline"],
            "source": item.get("source", "").replace("via ", ""),
            "sourceUrl": item.get("sourceUrl", ""),
        }

        # If we have a source URL, try to fetch fresh content
        if item.get("sourceUrl"):
            try:
                req = Request(item["sourceUrl"], headers={"User-Agent": "Mozilla/5.0"})
                resp = urlopen(req, timeout=15)
                html = resp.read().decode("utf-8", errors="replace")
                # Extract text content (basic)
                import re as _re
                text = _re.sub(r'<[^>]+>', ' ', html)
                text = _re.sub(r'\s+', ' ', text).strip()
                if len(text) > 200:
                    entry["summary_full"] = text[:3000]
            except Exception as e:
                print(f"    Could not re-fetch source: {e}")

        # Try to rewrite
        rewritten = rewrite_article_gemini(entry)
        if not rewritten:
            remaining.append(item)
            continue

        # Validate
        if not validate_article(rewritten):
            print(f"    ✗ RETRY FAILED (still bad): {item['headline']} (attempt {item['retries']})")
            if item["retries"] < MAX_RETRIES:
                remaining.append(item)
            else:
                print(f"    ✗ PERMANENTLY SKIPPED: {item['headline']}")
            continue

        # Success! Publish it
        slug = slugify(rewritten["headline"])
        if slug in existing_slugs or len(slug) < 5:
            slug = f"{slug}-retry"

        category = item.get("category") or classify_category(rewritten["headline"], rewritten["summary"])
        severity = classify_severity(rewritten["headline"], rewritten["summary"])

        new_article = {
            "slug": slug,
            "headline": rewritten["headline"],
            "summary": rewritten["summary"],
            "body": rewritten["body"],
            "tldr": rewritten.get("tldr", rewritten["summary"]),
            "category": category,
            "source": item.get("source", ""),
            "sourceUrl": item.get("sourceUrl", ""),
            "publishedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "severity": severity,
            "tags": [],
        }

        articles.insert(0, new_article)
        existing_slugs.add(slug)
        new_count += 1
        print(f"    ✓ RETRY SUCCESS: {rewritten['headline']}")

    save_retry_queue(remaining)
    return new_count


def publish_articles(max_articles=5):
    """Main publish flow."""
    print(f"[{datetime.now(timezone.utc).isoformat()}] Starting HackWire auto-publish...")
    
    published = load_published()
    articles = load_articles()
    existing_slugs = {a["slug"] for a in articles}
    
    # Fetch fresh RSS entries
    entries = fetch_feeds()
    print(f"  Fetched {len(entries)} entries from RSS feeds")
    
    new_count = 0
    entries_to_process = []  # Track unprocessed entries for queueing
    try:
        # Process retry queue first — re-generate previously failed articles
        retry_count = process_retry_queue(published, articles, existing_slugs)
        if retry_count > 0:
            print(f"  Retried and published {retry_count} article(s) from retry queue")
            new_count += retry_count

        for entry in entries:
            if new_count >= max_articles:
                break
            
            # Hash to avoid duplicates
            entry_hash = hashlib.md5(entry["title"].encode()).hexdigest()[:12]
            if entry_hash in published:
                continue
            
            # Track this entry as unprocessed (in case of exception)
            entries_to_process.append(entry)
            
            # Rewrite
            rewritten = rewrite_article_gemini(entry)
            if not rewritten:
                continue

            # Content quality gate — reject AI refusals and broken content
            if not validate_article(rewritten):
                print(f"  ✗ REJECTED (failed validation): {rewritten.get('headline', 'unknown')}")
                # Queue for retry with source info instead of just skipping
                add_to_retry_queue([{
                    "slug": slugify(rewritten.get("headline", "unknown")),
                    "headline": entry.get("title", rewritten.get("headline", "")),
                    "source": f"via {entry.get('source', '')}",
                    "sourceUrl": entry.get("sourceUrl", ""),
                    "category": classify_category(rewritten.get("headline", ""), rewritten.get("summary", "")),
                }], [])
                published.add(entry_hash)  # Mark as processed so RSS doesn't retry
                continue

            slug = slugify(rewritten["headline"])
            if slug in existing_slugs or len(slug) < 5:
                slug = f"{slug}-{entry_hash[:6]}"
            
            category = classify_category(rewritten["headline"], rewritten["summary"])
            severity = classify_severity(rewritten["headline"], rewritten["summary"])
            
            new_article = {
                "slug": slug,
                "headline": rewritten["headline"],
                "summary": rewritten["summary"],
                "body": rewritten["body"],
                "tldr": rewritten.get("tldr", rewritten["summary"]),  # TL;DR for busy readers
                "category": category,
                "source": f"via {entry['source']}",
                "sourceUrl": entry.get("sourceUrl", ""),
                "publishedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "severity": severity,
                "tags": [],
            }
            
            articles.insert(0, new_article)  # Newest first
            existing_slugs.add(slug)
            published.add(entry_hash)
            new_count += 1
            print(f"  + [{category.upper()}] {rewritten['headline']}")

            # Queue short articles for deep-dive expansion by the rewriter service
            if len(rewritten["body"]) < 3000:
                try:
                    queue_file = SCRIPT_DIR / "article-rewrite-queue.json"
                    queue_data = {"queue": [], "processed": 0}
                    if queue_file.exists():
                        with open(queue_file) as qf:
                            queue_data = json.load(qf)
                    # Check if already queued
                    queued_slugs = {q.get("slug") for q in queue_data.get("queue", [])}
                    if slug not in queued_slugs:
                        queue_data["queue"].append({
                            "slug": slug,
                            "title": rewritten["headline"],
                            "summary": rewritten["summary"],
                            "summary_full": rewritten.get("body", ""),
                            "added": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                            "rewritten": False
                        })
                        with open(queue_file, "w") as qf:
                            json.dump(queue_data, qf, indent=2)
                        print(f"    → Queued for deep-dive expansion ({len(rewritten['body'])} chars)")
                except Exception as qe:
                    print(f"    → Queue error: {qe}")
        
        if new_count == 0:
            print("  No new articles to publish.")
            return 0
        
        # Save
        save_articles(articles)
        save_published(published)
        print(f"  Saved {new_count} new articles (total: {len(articles)})")
        
        # Build and deploy
        print("  Building site...")
        result = subprocess.run(
            ["npm", "run", "build"],
            cwd=str(SCRIPT_DIR),
            capture_output=True, text=True, timeout=120
        )
        if result.returncode != 0:
            print(f"  BUILD FAILED: {result.stderr[-500:]}")
            return 0
        
        print("  Deploying to Vercel...")
        result = subprocess.run(
            ["npx", "vercel", "--token", VERCEL_TOKEN, "--yes", "--prod"],
            cwd=str(SCRIPT_DIR),
            capture_output=True, text=True, timeout=420
        )
        if result.returncode == 0:
            print(f"  Deployed successfully!")
        else:
            print(f"  Deploy warning: {result.stderr[-300:]}")

        # Post-deploy quality scan — catch anything that slipped through
        bad_articles = post_deploy_quality_scan(articles)
        if bad_articles:
            print(f"  ⚠ POST-DEPLOY SCAN: {len(bad_articles)} bad article(s) found — removing and queuing for retry")
            # Add to retry queue BEFORE removing
            add_to_retry_queue(bad_articles, articles)
            slugs_to_remove = {a["slug"] for a in bad_articles}
            articles = [a for a in articles if a["slug"] not in slugs_to_remove]
            save_articles(articles)
            # Rebuild and redeploy without the bad articles
            subprocess.run(["npm", "run", "build"], cwd=str(SCRIPT_DIR), capture_output=True, text=True, timeout=120)
            subprocess.run(["npx", "vercel", "--token", VERCEL_TOKEN, "--yes", "--prod"], cwd=str(SCRIPT_DIR), capture_output=True, text=True, timeout=420)
            # Alert via Telegram
            bad_list = "\n".join(f"- {a['headline']}" for a in bad_articles)
            alert_msg = f"⚠️ HackWire auto-publisher removed {len(bad_articles)} bad article(s) — queued for retry:\n{bad_list}"
            try:
                from urllib.parse import urlencode
                tg_data = urlencode({"chat_id": "1667266840", "text": alert_msg}).encode()
                tg_req = Request("https://api.telegram.org/bot8718467986:AAHeP-bYYN6fpVWgNa4JhrAlJrD67Pv7w40/sendMessage", data=tg_data)
                urlopen(tg_req, timeout=10)
            except Exception:
                pass
            print(f"  ✓ Cleaned, queued for retry, and redeployed")
        
        return new_count
    
    except Exception as e:
        error_str = str(e)
        if "rate" in error_str.lower() or "429" in error_str or "quota" in error_str.lower():
            # Rate limited — queue for retry
            try:
                # Queue unprocessed entries (those that failed during Claude rewrite)
                if entries_to_process:
                    queue_file = Path(__file__).parent / "youtube-shorts" / "queue" / "failed-briefs.json"
                    queue_file.parent.mkdir(parents=True, exist_ok=True)
                    
                    # Load existing queue
                    queue = []
                    if queue_file.exists():
                        with open(queue_file) as f:
                            queue = json.load(f)
                    
                    # Add new brief to queue
                    brief = {
                        "queued_at": datetime.utcnow().isoformat(),
                        "next_retry": datetime.utcnow().isoformat(),
                        "retry_count": 0,
                        "max_retries": 10,
                        "reason": "Claude API rate limit",
                        "articles": entries_to_process[:max_articles]
                    }
                    queue.append(brief)
                    
                    # Save queue
                    with open(queue_file, 'w') as f:
                        json.dump(queue, f, indent=2)
                    
                    msg = f"🟡 HackWire: Claude rate-limited. Queued {len(entries_to_process[:max_articles])} articles for retry in 15 mins."
                    print(f"  {msg}")
                    
                    # Send alert via curl
                    subprocess.run([
                        "curl", "-s", "-X", "POST",
                        "https://api.telegram.org/bot" + os.getenv("TELEGRAM_BOT_TOKEN", ""),
                        "-d", f"chat_id=1667266840&text={msg}"
                    ], check=False)
                    
                    return 0
            except Exception as queue_err:
                print(f"  Queue error: {queue_err}")
        
        # Other errors — log and continue
        print(f"  Publish error: {e}")
        return new_count

if __name__ == "__main__":
    max_articles = int(sys.argv[1]) if len(sys.argv) > 1 else 5
    count = publish_articles(max_articles)
    print(f"Done. Published {count} articles.")
