#!/usr/bin/env python3
"""
HackWire Podcast Enhancer Agent
Monitors podcast-queue.json and:
1. Writes professional scripts using Claude (via OpenClaw)
2. Generates audio with Gemini Charon voice
3. Publishes episodes to Vercel

Runs continuously as a background service.
"""

import json
import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

BASE = Path(__file__).parent / "podcast"
QUEUE_FILE = BASE / "podcast-queue.json"
EPISODES_DIR = BASE / "episodes"
LOG_FILE = BASE.parent / "logs" / "podcast-enhancer.log"
RSS_FILE = BASE / "feed.xml"

GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
VERCEL_TOKEN = os.environ.get("VERCEL_TOKEN", "")

EPISODES_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE.parent.mkdir(parents=True, exist_ok=True)


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
    return json.loads(QUEUE_FILE.read_text())


def save_queue(queue: list):
    """Save podcast queue."""
    QUEUE_FILE.write_text(json.dumps(queue, indent=2))


def write_podcast_script_claude(articles: list, edition: str, date_obj) -> str | None:
    """Write professional podcast script using Claude via OpenClaw."""
    day_name = date_obj.strftime("%A")
    date_str = date_obj.strftime("%B %d, %Y")
    edition_label = "Morning Brief" if edition == "morning" else "Evening Wrap"
    
    article_text = ""
    for i, a in enumerate(articles[:6], 1):
        article_text += f"\n{i}. {a['headline']}\n   Category: {a['category']}\n   Summary: {a['summary']}\n"
    
    prompt = f"""You are a professional news anchor for HackWire Daily cybersecurity podcast.

Write a comprehensive 900-1200 word podcast script for the {edition_label} (date: {day_name}, {date_str}).

Here are today's top stories:
{article_text}

Script Requirements:
- Opening: "This is HackWire Daily, your AI-powered cybersecurity threat briefing. Today is {day_name}, {date_str}."
- Cover top 5 stories with EXTENSIVE technical analysis (4-5 paragraphs per story minimum)
  * Background and context
  * Technical details and how it works
  * Who is affected and why
  * Timeline and discovery details
  * Threat actor profile and motivation
  * Detection and response guidance
  * Implications for the industry
- Professional news anchor tone (authoritative, credible, conversational)
- "Quick Hits" section for remaining stories (2-3 sentences each)
- Closing: "That's all for this {edition_label} of HackWire Daily. Stay patched, stay vigilant. Subscribe at hackwire dot news. Until next time."

Style:
- NO markdown, NO stage directions, NO speaker labels
- Spoken language (say "hackwire dot news" not "hackwire.news")
- Professional broadcast journalism tone
- 1800-2200 words (9-11 minutes at 150-200 wpm) — AIM FOR MAXIMUM LENGTH

Write the complete script now."""

    try:
        result = subprocess.run(
            ["openclaw", "session", "send", "--message", prompt],
            capture_output=True,
            text=True,
            timeout=120
        )
        
        if result.returncode != 0:
            log(f"  Claude error: {result.stderr[:200]}")
            return None
        
        script = result.stdout.strip()
        # Target: 1200-2200 words (6-11 min) = ~6000-11000 characters
        # Minimum: 6000 chars (~1200 words = 6-8 min @ 150-200 wpm)
        if len(script) < 6000:
            log(f"  Script too short ({len(script)} chars, need 6000+ for 6-8+ min episode)")
            return None
        
        word_count = len(script) // 5
        min_duration = word_count // 200
        max_duration = word_count // 150
        log(f"  ✅ Script: {len(script)} chars (~{word_count} words, {min_duration}-{max_duration} min)")
        return script
    
    except subprocess.TimeoutExpired:
        log(f"  Claude timeout")
        return None
    except Exception as e:
        log(f"  Claude exception: {e}")
        return None


def generate_audio_gemini(script: str, output_path: Path) -> bool:
    """Generate audio using Gemini TTS with Charon voice."""
    try:
        import base64
        import urllib.request
        import json as json_mod
        
        # Split into chunks
        paragraphs = [p.strip() for p in script.split("\n") if p.strip()]
        chunks = []
        current = ""
        for para in paragraphs:
            if len(current) + len(para) > 1200 and current:
                chunks.append(current)
                current = para
            else:
                current = (current + " " + para).strip()
        if current:
            chunks.append(current)
        
        mp3_parts = []
        for i, chunk in enumerate(chunks, 1):
            log(f"    TTS chunk {i}/{len(chunks)} ({len(chunk)} chars)...")
            
            # Request to Gemini API
            url = "https://generativelanguage.googleapis.com/v1beta/files:generateContent"
            headers = {"Content-Type": "application/json"}
            data = {
                "contents": [{
                    "parts": [{
                        "text": f"Convert this to speech in a professional news anchor voice (Charon style, authoritative): {chunk}"
                    }]
                }]
            }
            
            req = urllib.request.Request(
                f"{url}?key={GEMINI_KEY}",
                data=json_mod.dumps(data).encode(),
                headers=headers,
                method="POST"
            )
            
            try:
                with urllib.request.urlopen(req, timeout=30) as response:
                    result = json_mod.loads(response.read())
                    if "audioContent" in result:
                        mp3_parts.append(base64.b64decode(result["audioContent"]))
            except urllib.error.HTTPError as e:
                log(f"    Gemini error (chunk {i}): {e.code}")
                if e.code == 429:
                    log("    Rate limited, skipping")
                    return False
                raise
        
        # Combine audio parts
        if mp3_parts:
            with open(output_path, "wb") as f:
                for part in mp3_parts:
                    f.write(part)
            log(f"  ✅ Generated {output_path.name}")
            return True
        
        return False
    
    except Exception as e:
        log(f"  Gemini TTS failed: {e}")
        return False


def process_queue():
    """Process queued podcasts."""
    queue = load_queue()
    processed = 0
    
    for entry in queue:
        if entry.get("deployed"):
            continue
        
        ep_id = entry["id"]
        edition = entry["edition"]
        articles = entry.get("articles", [])
        
        if not entry.get("script_generated"):
            log(f"Writing script: {ep_id} ({edition})")
            
            # Parse date
            date_obj = datetime.fromisoformat(entry["date"])
            
            # Generate script
            script = write_podcast_script_claude(articles, edition, date_obj)
            if not script:
                log(f"  Failed to generate script")
                continue
            
            entry["script_generated"] = True
            entry["script_length"] = len(script)
            log(f"  ✅ Script generated ({len(script)} chars)")
        
        if not entry.get("audio_generated"):
            log(f"Generating audio: {ep_id}")
            
            script = entry.get("_script", "")  # Load from entry if saved
            if not script:
                log(f"  No script available")
                continue
            
            # Generate audio
            output_file = EPISODES_DIR / f"hackwire-{ep_id}.mp3"
            if generate_audio_gemini(script, output_file):
                entry["audio_generated"] = True
                entry["audio_file"] = str(output_file)
                log(f"  ✅ Audio generated")
            else:
                log(f"  ⚠️ Audio generation failed, will retry")
                continue
        
        if entry.get("script_generated") and entry.get("audio_generated"):
            log(f"Deploying: {ep_id}")
            
            # Deploy to Vercel
            try:
                result = subprocess.run(
                    [
                        "npx", "vercel", "--token", VERCEL_TOKEN,
                        "--yes", "--prod",
                        "--cwd", str(BASE.parent)
                    ],
                    capture_output=True,
                    text=True,
                    timeout=180
                )
                
                if result.returncode == 0:
                    entry["deployed"] = True
                    entry["deployed_at"] = datetime.now(ZoneInfo("UTC")).isoformat()
                    log(f"  ✅ Deployed to Vercel")
                    processed += 1
                else:
                    log(f"  Deploy failed: {result.stderr[-200:]}")
            except Exception as e:
                log(f"  Deploy error: {e}")
    
    # Save queue (remove old completed entries, keep last 20)
    queue = [e for e in queue if not e.get("deployed")] + [e for e in queue if e.get("deployed")][-20:]
    save_queue(queue)
    
    return processed


def main():
    """Main loop."""
    log("Podcast Enhancer Agent started")
    
    while True:
        try:
            count = process_queue()
            if count > 0:
                log(f"Processed {count} episodes")
        except Exception as e:
            log(f"ERROR: {e}")
        
        # Check every 2 minutes
        time.sleep(120)


if __name__ == "__main__":
    main()
