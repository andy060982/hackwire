#!/usr/bin/env python3
"""
HackWire Article Rewriter Service
Monitors queue and rewrites articles to full cybersecurity news format
"""

import json
import os
import sys
import time
from datetime import datetime
import subprocess
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path("/home/aarevalo/clawd/hackwire/.env"))

# Constants
QUEUE_FILE = "/home/aarevalo/clawd/hackwire/article-rewrite-queue.json"
ARTICLES_FILE = "/home/aarevalo/clawd/hackwire/src/lib/articles-data.json"
LOG_FILE = "/home/aarevalo/clawd/logs/hackwire-rewriter.log"
BATCH_SIZE = 5
REWRITE_CHECK_INTERVAL = 120  # 2 minutes
VERCEL_TOKEN = os.environ.get("VERCEL_TOKEN", "")

def log_message(msg):
    """Log message to both console and file"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    full_msg = f"[{timestamp}] {msg}"
    print(full_msg)
    with open(LOG_FILE, "a") as f:
        f.write(full_msg + "\n")

def rewrite_article_with_claude(title, summary):
    """Use Claude to rewrite article to 900-1200 words professional cybersecurity news format"""
    
    prompt = f"""You are a professional cybersecurity journalist. Rewrite this cybersecurity news item into a comprehensive, well-researched 900-1200 word article suitable for a professional cybersecurity news website.

Title: {title}
Summary/Description: {summary}

Write in this structure:
1. **Lead paragraph** - Hook with the key story
2. **Background and Context** - Explain what happened and why it matters
3. **Technical Details** - Deep dive into the vulnerability/threat
4. **Real-World Impact** - Implications for organizations
5. **Threat Actor Context** - If applicable, who's behind this
6. **Defensive Recommendations** - Actionable security advice
7. **Industry Response** - What's the security community doing

Requirements:
- Professional cybersecurity journalist tone
- Maintain objectivity and balance
- Include technical accuracy
- Make it accessible to security professionals
- Aim for 900-1200 words minimum
- Use proper markdown formatting with headers

Then on a separate line, provide a 2-3 sentence TL;DR (max 200 chars):
"""
    
    try:
        result = subprocess.run(
            ["claude", "-p"],
            input=prompt,
            capture_output=True,
            text=True,
            timeout=120
        )
        
        if result.returncode != 0:
            log_message(f"Error running Claude: {result.stderr}")
            return None, None
        
        output = result.stdout.strip()
        
        # Split article and TL;DR
        if "TL;DR:" in output:
            article, tldr = output.split("TL;DR:", 1)
            tldr = tldr.strip()
        elif "---" in output:
            parts = output.split("---")
            article = parts[0].strip()
            tldr = parts[1].strip() if len(parts) > 1 else ""
        else:
            # Assume last 2-3 sentences are TL;DR
            sentences = output.split(".")
            tldr = ". ".join(sentences[-3:]).strip()
            article = ". ".join(sentences[:-3]).strip()
        
        # Check article length
        if len(article) < 800:
            log_message(f"Warning: Article too short ({len(article)} chars), regenerating...")
            return None, None
        
        return article.strip(), tldr[:200]
        
    except subprocess.TimeoutExpired:
        log_message(f"Claude timeout processing: {title}")
        return None, None
    except Exception as e:
        log_message(f"Error during rewrite: {str(e)}")
        return None, None

def load_queue():
    """Load the article rewrite queue"""
    if not os.path.exists(QUEUE_FILE):
        return {"queue": [], "processed": 0}
    
    with open(QUEUE_FILE, "r") as f:
        return json.load(f)

def load_articles():
    """Load the articles database"""
    with open(ARTICLES_FILE, "r") as f:
        return json.load(f)

def save_queue(queue_data):
    """Save updated queue"""
    with open(QUEUE_FILE, "w") as f:
        json.dump(queue_data, f, indent=2)

def save_articles(articles):
    """Save updated articles database"""
    with open(ARTICLES_FILE, "w") as f:
        json.dump(articles, f, indent=2)

def process_batch():
    """Process a batch of articles from the queue"""
    queue_data = load_queue()
    articles = load_articles()
    
    unprocessed = [a for a in queue_data.get("queue", []) if not a.get("rewritten", False)]
    
    if not unprocessed:
        log_message("Queue is empty. Service waiting for more articles...")
        return 0
    
    log_message(f"Found {len(unprocessed)} unprocessed articles. Processing up to {BATCH_SIZE}...")
    
    articles_dict = {a["slug"]: a for a in articles}
    processed_count = 0
    
    for item in unprocessed[:BATCH_SIZE]:
        slug = item.get("slug", "")
        title = item.get("title", "")
        summary = item.get("summary_full", item.get("summary", ""))

        if not slug or not title:
            log_message(f"Skipping queue item with missing slug/title")
            item["rewritten"] = True
            item["skip_reason"] = "missing slug or title"
            continue

        # Track retry count — skip after 3 failures
        retries = item.get("retries", 0)
        if retries >= 3:
            log_message(f"Skipping {slug} — failed {retries} times, marking as done")
            item["rewritten"] = True
            item["skip_reason"] = "max retries exceeded"
            continue

        log_message(f"Rewriting: {title}...")

        # Rewrite the article
        article_body, tldr = rewrite_article_with_claude(title, summary)

        if not article_body:
            item["retries"] = retries + 1
            log_message(f"Failed to rewrite {slug} (attempt {retries + 1}/3), will retry later...")
            continue

        # Update the article in the database
        if slug in articles_dict:
            articles_dict[slug]["body"] = article_body
            articles_dict[slug]["tldr"] = tldr
            log_message(f"✓ Updated {slug} ({len(article_body)} chars)")
            processed_count += 1
        else:
            log_message(f"Warning: Article slug {slug} not found in articles database")

        # Mark as rewritten in queue
        item["rewritten"] = True
        time.sleep(2)  # Rate limiting
    
    # Always save queue (to persist retry counts and rewritten flags)
    queue_data["last_check"] = datetime.now().isoformat() + "Z"
    save_queue(queue_data)

    # Save article updates if any were processed
    if processed_count > 0:
        updated_articles = []
        for a in articles:
            s = a.get("slug") if isinstance(a, dict) else None
            if s and s in articles_dict:
                updated_articles.append(articles_dict[s])
            else:
                updated_articles.append(a)
        save_articles(updated_articles)
        queue_data["processed"] = queue_data.get("processed", 0) + processed_count
        save_queue(queue_data)

        log_message(f"✓ Batch complete: {processed_count} articles processed")

        # After 5 articles, trigger rebuild
        if processed_count >= 5:
            log_message("Processing 5 articles - triggering Vercel rebuild...")
            trigger_vercel_rebuild()

    return processed_count

def trigger_vercel_rebuild():
    """Trigger a Vercel rebuild and redeploy"""
    try:
        log_message("Building project...")
        build_result = subprocess.run(
            ["npm", "run", "build"],
            cwd="/home/aarevalo/clawd/hackwire",
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if build_result.returncode != 0:
            log_message(f"Build failed: {build_result.stderr}")
            return False
        
        log_message("✓ Build successful")
        
        # Deploy with vercel (token is defined at top of script)
        if VERCEL_TOKEN:
            log_message("Deploying to Vercel...")
            deploy_result = subprocess.run(
                ["npx", "vercel", "--token", VERCEL_TOKEN, "--yes", "--prod"],
                cwd="/home/aarevalo/clawd/hackwire",
                capture_output=True,
                text=True,
                timeout=600
            )
            
            if deploy_result.returncode == 0:
                log_message("✓ Vercel deployment successful")
                return True
            else:
                log_message(f"Vercel deployment warning: {deploy_result.stderr[-300:]}")
                # Build success is enough; deployment is secondary
                return True
        else:
            log_message("⚠ VERCEL_TOKEN not set, skipping Vercel deployment")
            return True
            
    except subprocess.TimeoutExpired:
        log_message("Build/deploy timeout")
        return False
    except Exception as e:
        log_message(f"Error during rebuild: {str(e)}")
        return False

def main():
    """Main service loop"""
    log_message("=" * 60)
    log_message("HackWire Article Rewriter Service Started")
    log_message("=" * 60)
    log_message(f"Queue file: {QUEUE_FILE}")
    log_message(f"Articles file: {ARTICLES_FILE}")
    log_message(f"Log file: {LOG_FILE}")
    log_message(f"Check interval: {REWRITE_CHECK_INTERVAL}s")
    log_message(f"Batch size: {BATCH_SIZE}")
    
    try:
        while True:
            try:
                log_message("-" * 60)
                processed = process_batch()
                
                if processed == 0:
                    log_message(f"No articles processed. Next check in {REWRITE_CHECK_INTERVAL}s...")
                else:
                    log_message(f"Processed {processed} articles. Next check in {REWRITE_CHECK_INTERVAL}s...")
                
                time.sleep(REWRITE_CHECK_INTERVAL)
                
            except KeyboardInterrupt:
                log_message("Service interrupted by user")
                break
            except Exception as e:
                log_message(f"Error in processing loop: {str(e)}")
                time.sleep(10)
                
    except KeyboardInterrupt:
        log_message("Service shutdown requested")
    finally:
        log_message("=" * 60)
        log_message("HackWire Article Rewriter Service Stopped")
        log_message("=" * 60)

if __name__ == "__main__":
    main()
