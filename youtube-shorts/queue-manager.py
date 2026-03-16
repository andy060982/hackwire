#!/usr/bin/env python3
"""
HackWire Queue Manager
Handles failed briefings with automatic retry every 15 minutes
"""

import json
import os
import time
from datetime import datetime, timedelta
from pathlib import Path

QUEUE_FILE = Path(__file__).parent / "queue" / "failed-briefs.json"
QUEUE_FILE.parent.mkdir(parents=True, exist_ok=True)

def load_queue():
    """Load failed briefs from queue"""
    if not QUEUE_FILE.exists():
        return []
    with open(QUEUE_FILE) as f:
        return json.load(f)

def save_queue(queue):
    """Save queue to disk"""
    with open(QUEUE_FILE, 'w') as f:
        json.dump(queue, f, indent=2)

def queue_failed_brief(articles, reason="Gemini rate limit"):
    """Add failed briefing to retry queue"""
    queue = load_queue()
    
    brief = {
        "queued_at": datetime.utcnow().isoformat(),
        "next_retry": datetime.utcnow().isoformat(),
        "retry_count": 0,
        "max_retries": 10,
        "reason": reason,
        "articles": articles
    }
    
    queue.append(brief)
    save_queue(queue)
    
    print(f"[QUEUE] Brief queued ({len(articles)} articles): {reason}")
    return brief

def get_retryable_briefs():
    """Get briefs ready for retry"""
    queue = load_queue()
    now = datetime.utcnow()
    retryable = []
    
    for brief in queue:
        next_retry = datetime.fromisoformat(brief["next_retry"])
        if now >= next_retry and brief["retry_count"] < brief["max_retries"]:
            retryable.append(brief)
    
    return retryable, queue

def mark_retry(queue, brief_index):
    """Update retry count and next retry time"""
    queue[brief_index]["retry_count"] += 1
    queue[brief_index]["next_retry"] = (
        datetime.utcnow() + timedelta(minutes=15)
    ).isoformat()
    save_queue(queue)

def remove_from_queue(queue, brief_index):
    """Remove brief after successful publish"""
    queue.pop(brief_index)
    save_queue(queue)

def send_alert(message):
    """Send Telegram alert to Andy"""
    import subprocess
    subprocess.run([
        "curl", "-s", "-X", "POST",
        "https://api.telegram.org/bot" + os.getenv("TELEGRAM_BOT_TOKEN", ""),
        "-d", f"chat_id=1667266840&text={message}"
    ], check=False)

if __name__ == "__main__":
    retryable, queue = get_retryable_briefs()
    
    if retryable:
        print(f"[RETRY] Found {len(retryable)} briefs ready for retry")
        for brief in retryable:
            print(f"  - Retry #{brief['retry_count']}: {len(brief['articles'])} articles")
    else:
        print("[QUEUE] No briefs ready for retry")
