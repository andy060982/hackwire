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

SCRIPT_DIR = Path(__file__).parent
ARTICLES_FILE = SCRIPT_DIR / "src" / "lib" / "articles-data.json"
PUBLISHED_TRACKER = SCRIPT_DIR / ".published-articles.json"
VERCEL_TOKEN = "vcp_2AYVOKHp0aqAffkH7SBS1GKmGXXi16Opflatek8cbPgVMangm10zHKRC"

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
    return text[:80].rstrip('-')

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
        # Use OpenClaw's built-in claude access
        # The fact that I'm running in this environment means I have Claude access
        from anthropic import Anthropic
        
        full_content = entry.get("summary_full", entry["summary"])
        headline = entry["title"]
        
        # Build rewrite prompt
        rewrite_prompt = f"""You are a professional cybersecurity journalist. 

Expand this news summary into a comprehensive 800-1200 word article that:
1. Provides full context and background
2. Explains technical details in accessible language
3. Discusses implications for organizations
4. Includes recommendations where applicable
5. Maintains journalistic objectivity

ORIGINAL SUMMARY:
Title: {headline}
Content: {full_content}

Write the full article now. Include all important details, context, and analysis."""

        # Initialize Anthropic client (uses env ANTHROPIC_API_KEY or works through OpenClaw context)
        client = Anthropic()
        
        response = client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=2000,
            messages=[{"role": "user", "content": rewrite_prompt}]
        )
        
        body = response.content[0].text.strip()
        
        if not body:
            raise Exception("Empty response from Claude")
        
        # Generate TL;DR
        tldr_prompt = f"""Write a 1-paragraph summary (2-3 sentences max) of this article for people on the go:

{body}

Summary:"""
        
        tldr_response = client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=150,
            messages=[{"role": "user", "content": tldr_prompt}]
        )
        
        tldr = tldr_response.content[0].text.strip()
        
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
            capture_output=True, text=True, timeout=180
        )
        if result.returncode == 0:
            print(f"  Deployed successfully!")
        else:
            print(f"  Deploy warning: {result.stderr[-300:]}")
        
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
