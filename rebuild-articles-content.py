#!/usr/bin/env python3
"""
HackWire Article Content Rebuild
Fetches full content from source URLs and rebuilds articles-data.json with complete bodies.
"""

import json
import requests
from pathlib import Path
from urllib.parse import urlparse
import re
from datetime import datetime

SCRIPT_DIR = Path(__file__).parent
ARTICLES_FILE = SCRIPT_DIR / "src" / "lib" / "articles-data.json"
LOG_FILE = SCRIPT_DIR / "logs" / "rebuild-articles.log"

# Ensure log directory exists
LOG_FILE.parent.mkdir(parents=True, exist_ok=True)

def log(msg):
    """Log to file and stdout."""
    timestamp = datetime.now().isoformat()
    line = f"[{timestamp}] {msg}"
    print(line)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

def fetch_content(url: str, max_retries=3) -> str | None:
    """Fetch content from URL with retry logic."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            return response.text
        except Exception as e:
            if attempt < max_retries - 1:
                log(f"  ⚠️  Retry {attempt + 1}/{max_retries - 1}: {url} - {str(e)[:80]}")
                continue
            else:
                log(f"  ❌ Failed to fetch {url}: {str(e)[:80]}")
                return None
    return None

def extract_article_text(html: str, source: str) -> str | None:
    """Extract main article text from HTML based on source."""
    if not html:
        return None
    
    # Try multiple extraction methods
    
    # Method 1: Look for common article containers
    article_patterns = [
        r'<article[^>]*>(.*?)</article>',
        r'<main[^>]*>(.*?)</main>',
        r'<div[^>]*class="[^"]*article[^"]*"[^>]*>(.*?)</div>',
        r'<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)</div>',
    ]
    
    for pattern in article_patterns:
        match = re.search(pattern, html, re.DOTALL | re.IGNORECASE)
        if match:
            content = match.group(1)
            # Clean up HTML tags
            text = clean_html(content)
            if len(text) > 200:  # Only if we got substantial content
                return text
    
    # Method 2: Extract all paragraphs
    paragraphs = re.findall(r'<p[^>]*>(.*?)</p>', html, re.IGNORECASE)
    if paragraphs:
        text = ' '.join([clean_html(p) for p in paragraphs])
        if len(text) > 200:
            return text
    
    return None

def clean_html(html: str) -> str:
    """Remove HTML tags and clean text."""
    # Remove script and style elements
    html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL | re.IGNORECASE)
    
    # Remove HTML tags
    html = re.sub(r'<[^>]+>', '', html)
    
    # Decode HTML entities
    html = html.replace('&nbsp;', ' ')
    html = html.replace('&lt;', '<')
    html = html.replace('&gt;', '>')
    html = html.replace('&quot;', '"')
    html = html.replace('&#39;', "'")
    html = html.replace('&amp;', '&')
    
    # Clean up whitespace
    html = re.sub(r'\s+', ' ', html)
    html = html.strip()
    
    return html

def rebuild_articles():
    """Main rebuild function."""
    log("=" * 80)
    log("🔧 STARTING ARTICLE CONTENT REBUILD")
    log("=" * 80)
    
    # Load existing articles
    try:
        articles = json.loads(ARTICLES_FILE.read_text())
        log(f"✅ Loaded {len(articles)} articles from articles-data.json")
    except Exception as e:
        log(f"❌ Failed to load articles: {e}")
        return
    
    updated = 0
    failed = 0
    skipped = 0
    
    for i, article in enumerate(articles, 1):
        slug = article.get("slug", "unknown")
        source_url = article.get("sourceUrl", "")
        current_body = article.get("body", "")
        
        # Skip articles that already have substantial body content
        if len(current_body) > 500:
            log(f"[{i}/{len(articles)}] ⏭️  SKIP: {slug[:50]}... (body already {len(current_body)} chars)")
            skipped += 1
            continue
        
        # Skip if no source URL
        if not source_url:
            log(f"[{i}/{len(articles)}] ⚠️  NO SOURCE: {slug[:50]}...")
            failed += 1
            continue
        
        log(f"[{i}/{len(articles)}] 🔗 Fetching: {slug[:50]}...")
        
        # Fetch content
        html = fetch_content(source_url)
        if not html:
            failed += 1
            continue
        
        # Extract article text
        body = extract_article_text(html, article.get("source", ""))
        if body and len(body) > 200:
            article["body"] = body
            updated += 1
            log(f"       ✅ Updated: {len(body)} chars extracted")
        else:
            failed += 1
            log(f"       ❌ Could not extract meaningful content")
    
    # Save updated articles
    try:
        ARTICLES_FILE.write_text(json.dumps(articles, indent=2, ensure_ascii=False))
        log(f"\n✅ Saved {len(articles)} articles to articles-data.json")
    except Exception as e:
        log(f"❌ Failed to save articles: {e}")
        return
    
    # Summary
    log("\n" + "=" * 80)
    log("📊 REBUILD SUMMARY")
    log("=" * 80)
    log(f"Total articles: {len(articles)}")
    log(f"Updated:       {updated} ({100*updated/len(articles):.1f}%)")
    log(f"Skipped:       {skipped} ({100*skipped/len(articles):.1f}%)")
    log(f"Failed:        {failed} ({100*failed/len(articles):.1f}%)")
    log("=" * 80)

if __name__ == "__main__":
    rebuild_articles()
