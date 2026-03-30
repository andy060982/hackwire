#!/usr/bin/env python3
"""
HackWire Article Rewriter Agent
Monitors article-rewrite-queue.json and rewrites articles using Claude (via OpenClaw session).
Runs continuously or via cron; integrates rewritten content back into articles-data.json.

Usage: python3 article-rewriter-agent.py [--once]
  --once: Process queue once and exit (for cron)
  (default): Run as daemon, check queue every 2 minutes
"""

import json
import sys
import time
import hashlib
from pathlib import Path
from datetime import datetime, timezone
import subprocess

SCRIPT_DIR = Path(__file__).parent
QUEUE_FILE = SCRIPT_DIR / "article-rewrite-queue.json"
ARTICLES_FILE = SCRIPT_DIR / "src" / "lib" / "articles-data.json"
LOG_FILE = SCRIPT_DIR.parent / "logs" / "hackwire-rewriter.log"

def log(msg: str):
    """Log with timestamp."""
    ts = datetime.now(timezone.utc).isoformat()
    print(f"[{ts}] {msg}")
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a") as f:
        f.write(f"[{ts}] {msg}\n")

def load_queue() -> list:
    """Load article rewrite queue."""
    if not QUEUE_FILE.exists():
        return []
    return json.loads(QUEUE_FILE.read_text())

def save_queue(queue: list):
    """Save article rewrite queue."""
    QUEUE_FILE.write_text(json.dumps(queue, indent=2))

def load_articles() -> list:
    """Load published articles."""
    if not ARTICLES_FILE.exists():
        return []
    return json.loads(ARTICLES_FILE.read_text())

def save_articles(articles: list):
    """Save articles back."""
    ARTICLES_FILE.write_text(json.dumps(articles, indent=2, ensure_ascii=False))

def rewrite_article_claude(title: str, summary: str) -> tuple[str, str] | None:
    """
    Rewrite article using Claude via OpenClaw CLI session.
    Returns (body, tldr) or None if failed.
    Minimum target: 2000 characters (~300-400 words)
    """
    try:
        # Build the rewrite prompt
        rewrite_prompt = f"""You are a professional cybersecurity journalist for HackWire.news.

Expand this security news summary into a comprehensive, well-researched article (2000+ characters / 300-500 words).

FORMATTING RULES (MANDATORY):
- Use **Section Name** on its own line for section headers (e.g. **Background and Context**)
- Separate each paragraph with a blank line (two newlines)
- Each paragraph should be 3-5 sentences max
- NEVER write a wall of text — always break into clear paragraphs
- Do NOT reference figures, diagrams, charts, or images — there are none
- End the TL;DR with a complete sentence, never with "..."

STRUCTURE:
1. Opening paragraph — key security angle and immediate impact
2. **Background and Context** — what is the vulnerability/breach/threat
3. **Technical Analysis** — technical details, root cause, attack methodology
4. **Scope and Impact** — who's affected, how many, what data at risk
5. **Detection and Response** — how to detect, indicators of compromise, remediation
6. **Broader Implications** — what this means for the industry

Tone: Professional, analytical, authoritative — for security practitioners.
Do NOT use generic filler. Every sentence should add value.

NEWS SUMMARY:
Title: {title}
Summary: {summary}

Write the complete article now (2000+ characters). Do NOT include introductory phrases—just write the article body directly."""

        # Use OpenClaw to call Claude via our session
        result = subprocess.run(
            ["openclaw", "session", "send", "--message", rewrite_prompt],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode != 0:
            log(f"  OpenClaw error: {result.stderr}")
            return None
        
        # Claude response is in stdout
        body = result.stdout.strip()
        
        # Minimum 2000 characters (~300-400 words)
        if not body or len(body) < 2000:
            log(f"  Response too short ({len(body)} chars, need 2000+), asking for expansion")
            # Could retry with expanded prompt, but for now skip
            return None
        
        # Generate TL;DR
        tldr_prompt = f"""Write a brief 2-3 sentence summary for busy security professionals:

{body}

Keep it under 200 characters. Write ONLY the summary, nothing else."""

        result = subprocess.run(
            ["openclaw", "session", "send", "--message", tldr_prompt],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        tldr = result.stdout.strip()[:200] if result.returncode == 0 else body[:200]
        
        return (body, tldr)
    
    except subprocess.TimeoutExpired:
        log(f"  Timeout rewriting '{title}'")
        return None
    except Exception as e:
        log(f"  Exception rewriting '{title}': {e}")
        return None

def process_queue():
    """Process queued articles for rewriting."""
    queue = load_queue()
    articles = load_articles()
    
    if not queue:
        return 0
    
    processed = 0
    for entry in queue[:5]:  # Process max 5 per run
        if entry.get("rewritten"):
            continue
        
        entry_id = entry["id"]
        title = entry["title"]
        summary = entry["summary_full"]
        
        log(f"Rewriting: {title[:60]}...")
        
        # Call Claude to rewrite
        result = rewrite_article_claude(title, summary)
        if not result:
            log(f"  Failed to rewrite, skipping")
            continue
        
        body, tldr = result
        
        # Find and update article in articles-data.json
        found = False
        for article in articles:
            if article["headline"] == title:
                article["body"] = body
                article["tldr"] = tldr
                found = True
                log(f"  ✅ Updated article ({len(body)} chars)")
                break
        
        if not found:
            log(f"  ⚠️ Article not found in published list (may have been deduped)")
        
        # Mark as rewritten
        entry["rewritten"] = True
        entry["rewritten_at"] = datetime.now(timezone.utc).isoformat()
        entry["body_length"] = len(body)
        processed += 1
    
    # Clean up old rewritten entries (keep last 50)
    queue = [e for e in queue if not e.get("rewritten")] + [e for e in queue if e.get("rewritten")][-50:]
    
    # Save updates
    if processed > 0:
        save_articles(articles)
    save_queue(queue)
    
    return processed

def main():
    """Main loop or one-shot mode."""
    run_once = "--once" in sys.argv
    
    log(f"HackWire Article Rewriter started ({'once' if run_once else 'daemon'})")
    
    while True:
        try:
            count = process_queue()
            if count > 0:
                log(f"Processed {count} articles")
        except Exception as e:
            log(f"ERROR: {e}")
        
        if run_once:
            break
        
        # Sleep 2 minutes before next check
        time.sleep(120)

if __name__ == "__main__":
    main()
