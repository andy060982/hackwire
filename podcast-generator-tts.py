#!/usr/bin/env python3
"""
HackWire Podcast Generator with Real TTS
Generates 6-11 minute podcast episodes with professional voice.
Uses gTTS (Google Text-to-Speech) for audio generation.
"""

import json
import os
import subprocess
import time
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from dotenv import load_dotenv

BASE = Path("/home/aarevalo/clawd/hackwire")
load_dotenv(BASE / ".env")
PODCAST_DIR = BASE / "podcast"
EPISODES_DIR = PODCAST_DIR / "episodes"
QUEUE_FILE = PODCAST_DIR / "podcast-queue.json"
ARTICLES_FILE = BASE / "src" / "lib" / "articles-data.json"
LOG_FILE = BASE.parent / "logs" / "podcast-generator.log"

EPISODES_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE.parent.mkdir(parents=True, exist_ok=True)

VERCEL_TOKEN = os.environ.get("VERCEL_TOKEN", "")


def log(msg: str):
    """Log with timestamp."""
    ts = datetime.now(ZoneInfo("UTC")).isoformat()
    print(f"[{ts}] {msg}")
    with open(LOG_FILE, "a") as f:
        f.write(f"[{ts}] {msg}\n")


def load_queue() -> list:
    """Load podcast queue."""
    if not QUEUE_FILE.exists():
        return []
    try:
        data = json.loads(QUEUE_FILE.read_text())
        return data if isinstance(data, list) else data.get("queue", [])
    except:
        return []


def save_queue(queue: list):
    """Save podcast queue."""
    QUEUE_FILE.write_text(json.dumps(queue, indent=2))


def write_script(articles: list, edition: str, date_str: str) -> str:
    """Generate podcast script (same as before)."""
    edition_label = "Morning Brief" if edition == "morning" else "Evening Wrap"
    
    lines = [
        f"This is HackWire Daily, your AI-powered cybersecurity threat briefing. Today is {date_str}. I'm your host, and here are your critical stories.",
        ""
    ]
    
    # Cover top 5 stories with substantial content
    for i, article in enumerate(articles[:5], 1):
        headline = article.get("headline", "")
        summary = article.get("summary", "")
        category = article.get("category", "cybersecurity")
        
        lines.append(f"Story {i}: {headline}")
        lines.append("")
        lines.append(f"Category: {category.upper()}")
        lines.append("")
        lines.append("Here's what happened and why it matters:")
        lines.append(summary)
        lines.append("")
        lines.append("This incident reveals critical vulnerabilities in how organizations approach security. The technical implications span across infrastructure, authentication, and data protection systems. Industry experts are carefully analyzing the threat vectors and attack methodologies employed. Security teams globally are reassessing their defensive postures based on these findings.")
        lines.append("")
        lines.append("For your organization, this means evaluating your current security controls, reviewing access logs for suspicious activity, and implementing detection signatures for known indicators of compromise. The threat actors responsible are known to maintain persistent access for extended periods, making rapid response essential.")
        lines.append("")
        lines.append("Moving forward, expect additional disclosures and security updates from affected vendors. We'll continue monitoring this situation and will provide detailed analysis on hackwire dot news for the full technical breakdown and remediation guidance.")
        lines.append("")
    
    # Quick hits for remaining articles
    if len(articles) > 5:
        lines.append("Before we wrap up, here are a few quick hits from the broader threat landscape:")
        for article in articles[5:]:
            lines.append(f"• {article.get('headline', 'Story')} - {article.get('summary', '')[:150]}...")
        lines.append("")
    
    # Closing
    lines.append(f"That's all for this {edition_label} of HackWire Daily. We deliver critical cybersecurity news twice daily so you stay ahead of emerging threats. For detailed analysis, technical indicators, and expert commentary on each of today's stories, visit hackwire dot news.")
    lines.append("")
    lines.append("Subscribe to HackWire Daily wherever you listen to podcasts — Apple Podcasts, Spotify, Google Podcasts, or your favorite podcast app. Thank you for tuning in. Stay patched, stay vigilant, and stay secure. Until next time, this is HackWire Daily.")
    
    return "\n".join(lines)


def generate_audio_gtts(script: str, output_file: Path) -> bool:
    """Generate audio using gTTS (Google Text-to-Speech)."""
    try:
        # Install gTTS if needed
        subprocess.run(
            ["pip", "install", "-q", "gtts"],
            timeout=30,
            capture_output=True
        )
        
        from gtts import gTTS
        
        log(f"Generating audio with gTTS...")
        
        # Create TTS object with slow speech (more natural for news)
        tts = gTTS(text=script, lang='en', slow=False)
        
        # Save to file
        tts.save(str(output_file))
        
        log(f"✅ Audio generated: {output_file.name}")
        return True
    
    except Exception as e:
        log(f"⚠️ gTTS failed: {e}")
        return False


def process_queue():
    """Process queued podcast episodes."""
    queue = load_queue()
    processed = 0
    
    for entry in queue:
        if entry.get("deployed"):
            continue
        
        ep_id = entry["id"]
        edition = entry["edition"]
        date = entry["date"]
        articles = entry.get("articles", [])
        
        log(f"Processing: {ep_id} ({edition})")
        
        # Generate script
        script = write_script(articles, edition, date)
        word_count = len(script) // 5
        log(f"✅ Script: {len(script)} chars (~{word_count} words)")
        
        # Generate audio
        output_file = EPISODES_DIR / f"{ep_id}.mp3"
        if not generate_audio_gtts(script, output_file):
            log(f"⚠️ Audio generation failed, skipping")
            continue
        
        # Mark as deployed
        entry["deployed"] = True
        entry["deployed_at"] = datetime.now(ZoneInfo("UTC")).isoformat()
        processed += 1
        log(f"✅ Episode complete")
    
    if processed > 0:
        log(f"Deploying {processed} episodes to Vercel...")
        try:
            result = subprocess.run(
                ["npm", "run", "build"],
                cwd=str(BASE),
                capture_output=True,
                text=True,
                timeout=300
            )
            
            if result.returncode == 0:
                log(f"✅ Build successful")
                
                result = subprocess.run(
                    ["npx", "vercel", "--token", VERCEL_TOKEN, "--yes", "--prod"],
                    cwd=str(BASE),
                    capture_output=True,
                    text=True,
                    timeout=600
                )
                
                if result.returncode == 0:
                    save_queue(queue)
                    log(f"✅ {processed} episodes deployed to Vercel")
                else:
                    log(f"⚠️ Deploy failed")
        except Exception as e:
            log(f"Deploy error: {e}")
    else:
        save_queue(queue)


def main():
    """Main loop."""
    log("Podcast Generator (with TTS) started")
    
    while True:
        try:
            process_queue()
        except Exception as e:
            log(f"ERROR: {e}")
        
        time.sleep(120)  # Check every 2 minutes


if __name__ == "__main__":
    main()
