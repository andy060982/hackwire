#!/usr/bin/env python3
"""
HackWire Daily Podcast Generator (Queue-based)
Generates episode metadata and queues for script writing via background agent.
Uses Gemini Charon voice for professional news anchor tone.

Runs twice daily via cron: 6 AM ET (morning) and 6 PM ET (evening).
"""

import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from dotenv import load_dotenv

BASE = Path(__file__).parent
load_dotenv(BASE.parent / ".env")
HACKWIRE = BASE.parent
ARTICLES_FILE = HACKWIRE / "src" / "lib" / "articles-data.json"
EPISODES_DIR = BASE / "episodes"
QUEUE_FILE = BASE / "podcast-queue.json"
PUBLISHED_EPISODES = BASE / ".published-episodes.json"

PODCAST_TITLE = "HackWire Daily"
PODCAST_DESC = "Your daily cybersecurity threat briefing in under 5 minutes. Twice daily coverage of the latest data breaches, vulnerabilities, and ransomware attacks."
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")

EPISODES_DIR.mkdir(exist_ok=True)


def get_edition():
    """Get edition (morning/evening) based on ET timezone."""
    now = datetime.now(ZoneInfo("America/New_York"))
    if now.hour < 12:
        return "morning", now
    return "evening", now


# Target podcast length: 6-8 minutes ideal, up to 11 minutes max
# At 150-200 wpm: 1200-2200 words (~6000-11000 characters)


def get_latest_articles(count=6):
    """Load latest articles."""
    try:
        with open(ARTICLES_FILE) as f:
            return json.load(f)[:count]
    except:
        return []


def queue_episode(articles, edition, now):
    """Queue episode for script generation by background agent."""
    # Load queue
    queue_data = {"queue": []}
    if QUEUE_FILE.exists():
        try:
            queue_data = json.loads(QUEUE_FILE.read_text())
        except:
            queue_data = {"queue": []}
    
    # Ensure queue key exists
    if not isinstance(queue_data, dict):
        queue_data = {"queue": []}
    if "queue" not in queue_data:
        queue_data["queue"] = []
    
    # Create queue entry
    entry = {
        "id": now.strftime("%Y%m%d-%H%M"),
        "edition": edition,
        "date": now.isoformat(),
        "articles": [
            {
                "headline": a.get("headline", ""),
                "summary": a.get("summary", "")[:300],
                "category": a.get("category", ""),
            }
            for a in articles
        ],
        "queued_at": datetime.now(ZoneInfo("UTC")).isoformat(),
        "script_generated": False,
        "audio_generated": False,
        "deployed": False,
    }
    
    queue_data["queue"].append(entry)
    QUEUE_FILE.write_text(json.dumps(queue_data, indent=2))
    
    print(f"✅ Queued {edition.title()} podcast for {now.strftime('%Y-%m-%d %H:%M')}")
    print(f"   Articles: {len(articles)}")
    print(f"   Queue length: {len(queue_data['queue'])}")
    
    return entry


def main():
    edition, now = get_edition()
    articles = get_latest_articles(6)
    
    if not articles:
        print("❌ No articles found")
        sys.exit(1)
    
    # Queue the episode for script generation
    entry = queue_episode(articles, edition, now)
    
    # Report
    day_name = now.strftime("%A")
    date_str = now.strftime("%B %d, %Y")
    edition_label = "Morning Brief" if edition == "morning" else "Evening Wrap"
    
    print(f"\nHackWire Daily {edition_label} — {day_name}, {date_str}")
    print(f"Using {len(articles)} articles")
    print(f"Queued for background processing...")


if __name__ == "__main__":
    main()
