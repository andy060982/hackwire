#!/usr/bin/env python3
"""
HackWire Daily Podcast Generator
Generates a ~5 minute cybersecurity news briefing from latest HackWire articles.
Runs twice daily: 6 AM ET (morning) and 6 PM ET (evening).
"""

import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path
import hashlib
import xml.etree.ElementTree as ET
from xml.dom import minidom

# Paths
BASE = Path(__file__).parent
HACKWIRE = BASE.parent
ARTICLES_FILE = HACKWIRE / "src" / "lib" / "articles-data.json"
EPISODES_DIR = BASE / "episodes"
RSS_FILE = BASE / "feed.xml"
PUBLISHED_EPISODES = BASE / ".published-episodes.json"
INTRO_MUSIC = BASE / "synthwave" / "Synthwave" / "Loop" / "Synthwave - Neon Horizons Loop.wav"
OUTRO_MUSIC = BASE / "dark-ambient" / "Dark Ambient" / "No Loop" / "DarkAmbient - Evil Is Coming.wav"

# Config
VOICE = "en-US-ChristopherNeural"
TARGET_WORDS = 650  # ~5 minutes at normal speaking pace
SITE_URL = "https://hackwire.news"
PODCAST_TITLE = "HackWire Daily"
PODCAST_DESC = "Your daily cybersecurity threat briefing in under 5 minutes. Twice daily coverage of the latest data breaches, vulnerabilities, ransomware attacks, and security news that matters."

# Claude Haiku for script generation (via Anthropic/OpenClaw)
# Gemini API for TTS (voice generation)
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyCTAAF4Wql-Ty0KypBsLQkrpY1FkVpeXtw")

EPISODES_DIR.mkdir(exist_ok=True)


def get_edition():
    """Determine morning or evening edition based on ET time."""
    from zoneinfo import ZoneInfo
    now = datetime.now(ZoneInfo("America/New_York"))
    if now.hour < 12:
        return "morning", now
    else:
        return "evening", now


def get_latest_articles(count=6):
    """Get the latest articles from HackWire."""
    with open(ARTICLES_FILE) as f:
        articles = json.load(f)
    return articles[:count]


def write_script_with_gemini(articles, edition, now):
    """Use Claude Haiku to write a professional podcast script."""
    from anthropic import Anthropic
    
    day_name = now.strftime("%A")
    date_str = now.strftime("%B %d, %Y")
    edition_label = "Morning Brief" if edition == "morning" else "Evening Wrap"
    
    article_summaries = ""
    for i, a in enumerate(articles, 1):
        article_summaries += f"\n{i}. Title: {a['headline']}\n   Category: {a['category']}\n   Summary: {a['summary'][:300]}\n"
    
    prompt = f"""Write a professional cybersecurity news podcast script for "HackWire Daily - {edition_label}".
Date: {day_name}, {date_str}

Here are the top stories to cover:
{article_summaries}

Requirements:
- Open with: "This is HackWire Daily, your AI-powered cybersecurity threat briefing. Today is {day_name}, {date_str}. Here are your top stories."
- Cover the top 5 stories with deep analysis, technical context, and background information.
- Provide a very comprehensive and detailed coverage for each story. You MUST write at least 3 paragraphs per story.
- Add a "Quick Hits" section at the end for 1-2 brief mentions.
- Close with: "That's all for this {edition_label} of HackWire Daily. Stay patched, stay vigilant. Subscribe wherever you listen to podcasts, and visit hackwire dot news for the full stories. Until next time."
- Make the script very detailed, aiming for a total length of at least 800-1000 words. This is critical to ensure the episode hits the 5-minute mark.
- Professional news anchor tone, authoritative but accessible.
- NO markdown, NO stage directions, NO speaker labels - just the spoken text.
- Use "hackwire dot news" not "hackwire.news" (it's spoken).

"""

    try:
        client = Anthropic()
        message = client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=2048,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        return message.content[0].text.strip()
    except Exception as e:
        print(f"Claude failed ({e}), using fallback script")
        return write_fallback_script(articles, edition, now)


def write_fallback_script(articles, edition, now):
    """Generate a comprehensive script without AI - 800+ words for 5-10 min podcast."""
    day_name = now.strftime("%A")
    date_str = now.strftime("%B %d, %Y")
    edition_label = "Morning Brief" if edition == "morning" else "Evening Wrap"
    
    lines = [
        f"This is HackWire Daily, your AI-powered cybersecurity threat briefing. Today is {day_name}, {date_str}. I'm your host, and here are your critical stories for today.",
        "",
        "In this briefing, we're covering emerging threats, critical vulnerabilities, and industry developments you need to know about. Whether you're a security professional, IT manager, or just staying informed about the threat landscape, these stories matter.",
        ""
    ]
    
    for i, a in enumerate(articles[:5], 1):
        ordinals = ["", "first", "second", "third", "fourth", "fifth"]
        if i == 1:
            label = "Our lead story"
        else:
            label = f"Next up is our {ordinals[i]} story of the day"
        category = a.get('category', 'Security News').upper()
        
        lines.append(f"{label}: {a['headline']}")
        lines.append(f"Category: {category}")
        lines.append("")
        lines.append(f"Here's what you need to know: {a['summary'][:400]}")
        lines.append("")
        lines.append("This story is significant because of its potential impact on organizations and individuals. The implications span from immediate operational concerns to longer-term strategic security planning. Industry experts are monitoring this situation closely, and we'll continue to provide updates as more information becomes available.")
        lines.append("")
    
    if len(articles) > 5:
        lines.append("Before we wrap up, here are a few quick hits from the broader threat landscape:")
        for i, a in enumerate(articles[5:8], 1):
            lines.append(f"Item {i}: {a['headline']}. {a['summary'][:200]}")
        lines.append("")
    
    lines.append("The cybersecurity landscape continues to evolve rapidly. Staying informed about emerging threats and vulnerabilities is essential for protecting your organization and personal data. We encourage you to visit hackwire dot news for the complete analysis, technical details, and expert perspectives on each of these stories.")
    lines.append("")
    lines.append(f"That's all for this {edition_label} of HackWire Daily. We deliver critical cybersecurity news twice daily so you stay ahead of the threat landscape. Thank you for tuning in. Stay patched, stay vigilant, and stay secure.")
    lines.append("")
    lines.append("Subscribe to HackWire Daily wherever you listen to podcasts — Apple Podcasts, Spotify, Google Podcasts, or your favorite podcast app. Visit hackwire dot news for full articles, technical analysis, and the latest industry updates. Until next time, this is HackWire Daily.")
    
    return "\n".join(lines)


def generate_voice(script, output_path):
    """Generate TTS audio using Gemini API with Charon voice."""
    try:
        return generate_voice_gemini(script, output_path)
    except Exception as e:
        print(f"  Gemini Charon TTS failed: {e}")
        print(f"  Falling back to Edge TTS...")
        return generate_voice_edge(script, output_path)


def generate_voice_gemini(script, output_path):
    """Generate TTS audio using Gemini API with Charon voice."""
    import base64
    import urllib.request
    
    voice_file = output_path.with_suffix(".voice.mp3")
    
    # Split script into chunks (~1200 chars at paragraph boundaries)
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
    
    pcm_parts = []
    for i, chunk in enumerate(chunks):
        print(f"  TTS chunk {i+1}/{len(chunks)} ({len(chunk)} chars)...")
        body = json.dumps({
            "contents": [{"parts": [{"text": chunk}]}],
            "generationConfig": {
                "response_modalities": ["AUDIO"],
                "speech_config": {
                    "voice_config": {
                        "prebuilt_voice_config": {"voice_name": "Charon"}
                    }
                }
            }
        })
        
        req = urllib.request.Request(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key={GEMINI_KEY}",
            data=body.encode(),
            headers={"Content-Type": "application/json"}
        )
        
        try:
            resp = urllib.request.urlopen(req, timeout=120)
            data = json.loads(resp.read())
            
            # Gemini returns audio in candidates
            if "candidates" in data and len(data["candidates"]) > 0:
                candidate = data["candidates"][0]
                if "content" in candidate and "parts" in candidate["content"]:
                    parts = candidate["content"]["parts"]
                    if parts and "inlineData" in parts[0]:
                        audio = base64.b64decode(parts[0]["inlineData"]["data"])
                        pcm_parts.append(audio)
                    else:
                        raise Exception("No audio data in response")
                else:
                    raise Exception("Unexpected response structure")
            else:
                raise Exception("No candidates in response")
        except Exception as e:
            print(f"  Gemini TTS failed on chunk {i+1}: {e}")
            raise
    
    # Combine PCM and convert to mp3
    pcm_file = output_path.with_suffix(".pcm")
    with open(pcm_file, "wb") as f:
        for part in pcm_parts:
            f.write(part)
    
    subprocess.run([
        "ffmpeg", "-y", "-f", "s16le", "-ar", "24000", "-ac", "1",
        "-i", str(pcm_file), "-b:a", "128k", str(voice_file)
    ], check=True, capture_output=True)
    
    pcm_file.unlink()  # cleanup
    return voice_file


def generate_voice_edge(script, output_path):
    """Fallback: Generate TTS audio using Edge TTS."""
    script_file = output_path.with_suffix(".txt")
    script_file.write_text(script)
    
    voice_file = output_path.with_suffix(".voice.mp3")
    subprocess.run([
        "edge-tts",
        "--voice", "en-US-ChristopherNeural",
        "--rate=-2%",
        f"--file={script_file}",
        f"--write-media={voice_file}"
    ], check=True, capture_output=True)
    
    return voice_file


def generate_title_voice():
    """Generate the 'This is HackWire Daily' title for intro overlay."""
    title_file = BASE / ".title-voice.mp3"
    if not title_file.exists():
        subprocess.run([
            "edge-tts",
            "--voice", VOICE,
            "--rate=-5%",
            "--pitch=-3Hz",
            "-t", "This is HackWire Daily.",
            f"--write-media={title_file}"
        ], check=True, capture_output=True)
    return title_file


def stitch_episode(voice_file, output_path):
    """Stitch intro music + voice + outro music into final episode."""
    title_voice = None  # Charon voice includes intro in script
    
    # Create intro: Neon Horizons (6s) with title voice overlaid
    intro_music = "/tmp/hw-auto-intro-music.mp3"
    subprocess.run([
        "ffmpeg", "-y", "-i", str(INTRO_MUSIC), "-t", "6",
        "-af", "afade=t=out:st=3.5:d=2.5,volume=0.9",
        intro_music
    ], check=True, capture_output=True)
    
    # No voice overlay needed - Charon voice has intro in script
    intro_final = intro_music
    
    # Create outro: Evil Is Coming (10s section)
    outro_music = "/tmp/hw-auto-outro-music.mp3"
    subprocess.run([
        "ffmpeg", "-y", "-i", str(OUTRO_MUSIC), "-ss", "60", "-t", "10",
        "-af", "afade=t=in:st=0:d=2,afade=t=out:st=7:d=3,volume=0.9",
        outro_music
    ], check=True, capture_output=True)
    
    # Normalize all to same format
    parts = {
        "intro": intro_final,
        "body": str(voice_file),
        "outro": outro_music
    }
    normalized = {}
    for name, path in parts.items():
        norm = f"/tmp/hw-auto-norm-{name}.mp3"
        subprocess.run([
            "ffmpeg", "-y", "-i", path, "-ar", "44100", "-ac", "1", "-b:a", "128k", norm
        ], check=True, capture_output=True)
        normalized[name] = norm
    
    # Silence gap
    silence = "/tmp/hw-auto-silence.mp3"
    subprocess.run([
        "ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
        "-t", "0.3", "-b:a", "128k", silence
    ], check=True, capture_output=True)
    
    # Concat list
    concat_file = "/tmp/hw-auto-concat.txt"
    with open(concat_file, "w") as f:
        f.write(f"file '{normalized['intro']}'\n")
        f.write(f"file '{silence}'\n")
        f.write(f"file '{normalized['body']}'\n")
        f.write(f"file '{normalized['outro']}'\n")
    
    subprocess.run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_file,
        "-c:a", "libmp3lame", "-b:a", "128k", str(output_path)
    ], check=True, capture_output=True)
    
    # Get duration
    result = subprocess.run([
        "ffprobe", "-v", "quiet", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(output_path)
    ], capture_output=True, text=True)
    duration = float(result.stdout.strip())
    
    return duration


def update_rss(episode_path, title, description, duration, pub_date):
    """Update the podcast RSS feed."""
    # Load or create feed
    if RSS_FILE.exists():
        tree = ET.parse(RSS_FILE)
        root = tree.getroot()
        channel = root.find("channel")
    else:
        root = ET.Element("rss", version="2.0", **{
            "xmlns:itunes": "http://www.itunes.com/dtds/podcast-1.0.dtd",
            "xmlns:atom": "http://www.w3.org/2005/Atom"
        })
        channel = ET.SubElement(root, "channel")
        ET.SubElement(channel, "title").text = PODCAST_TITLE
        ET.SubElement(channel, "description").text = PODCAST_DESC
        ET.SubElement(channel, "link").text = SITE_URL
        ET.SubElement(channel, "language").text = "en-us"
        
        itunes_author = ET.SubElement(channel, "{http://www.itunes.com/dtds/podcast-1.0.dtd}author")
        itunes_author.text = "HackWire"
        
        itunes_category = ET.SubElement(channel, "{http://www.itunes.com/dtds/podcast-1.0.dtd}category")
        itunes_category.set("text", "Technology")
        
        itunes_image = ET.SubElement(channel, "{http://www.itunes.com/dtds/podcast-1.0.dtd}image")
        itunes_image.set("href", f"{SITE_URL}/podcast/cover.png")
        
        itunes_explicit = ET.SubElement(channel, "{http://www.itunes.com/dtds/podcast-1.0.dtd}explicit")
        itunes_explicit.text = "false"
        
        tree = ET.ElementTree(root)
    
    # Add new episode item
    item = ET.Element("item")
    ET.SubElement(item, "title").text = title
    ET.SubElement(item, "description").text = description
    
    ep_filename = episode_path.name
    enclosure = ET.SubElement(item, "enclosure")
    enclosure.set("url", f"{SITE_URL}/podcast/episodes/{ep_filename}")
    enclosure.set("length", str(episode_path.stat().st_size))
    enclosure.set("type", "audio/mpeg")
    
    ET.SubElement(item, "pubDate").text = pub_date.strftime("%a, %d %b %Y %H:%M:%S %z")
    
    guid = ET.SubElement(item, "guid")
    guid.text = f"{SITE_URL}/podcast/episodes/{ep_filename}"
    guid.set("isPermaLink", "true")
    
    itunes_dur = ET.SubElement(item, "{http://www.itunes.com/dtds/podcast-1.0.dtd}duration")
    mins = int(duration // 60)
    secs = int(duration % 60)
    itunes_dur.text = f"{mins}:{secs:02d}"
    
    # Insert at top of items
    items = channel.findall("item")
    if items:
        channel.insert(list(channel).index(items[0]), item)
    else:
        channel.append(item)
    
    # Write
    rough_string = ET.tostring(root, encoding="unicode")
    reparsed = minidom.parseString(rough_string)
    with open(RSS_FILE, "w") as f:
        f.write(reparsed.toprettyxml(indent="  "))
    
    print(f"RSS updated: {RSS_FILE}")


def load_published():
    if PUBLISHED_EPISODES.exists():
        return json.loads(PUBLISHED_EPISODES.read_text())
    return []


def save_published(episodes):
    PUBLISHED_EPISODES.write_text(json.dumps(episodes, indent=2))



def copy_to_public(episode_path):
    """Copy episode to public dir and update public RSS feed."""
    import shutil
    public_episodes = Path("/home/aarevalo/clawd/hackwire/public/podcast/episodes")
    public_episodes.mkdir(parents=True, exist_ok=True)
    
    dest = public_episodes / episode_path.name
    shutil.copy2(episode_path, dest)
    
    # Copy RSS feed to public
    public_rss = Path("/home/aarevalo/clawd/hackwire/public/podcast/feed.xml")
    shutil.copy2(RSS_FILE, public_rss)
    
    # Deploy to Vercel
    import subprocess
    try:
        result = subprocess.run(
            ["npx", "vercel", "--token", "vcp_2AYVOKHp0aqAffkH7SBS1GKmGXXi16Opflatek8cbPgVMangm10zHKRC", "--yes", "--prod"],
            cwd="/home/aarevalo/clawd/hackwire",
            capture_output=True, text=True, timeout=180
        )
        print(f"Deployed: {result.stdout.strip().split(chr(10))[-1]}")
    except Exception as e:
        print(f"Deploy failed: {e}")



def main():
    from zoneinfo import ZoneInfo
    
    edition, now = get_edition()
    date_str = now.strftime("%Y-%m-%d")
    episode_id = f"{date_str}-{edition}"
    
    # Check if already published
    published = load_published()
    if episode_id in published:
        print(f"Episode {episode_id} already published, skipping")
        return
    
    print(f"Generating HackWire Daily - {edition.title()} Edition ({date_str})")
    
    # Get articles
    articles = get_latest_articles(6)
    if not articles:
        print("No articles found!")
        return
    
    print(f"Using {len(articles)} articles")
    
    # Generate script
    print("Writing script...")
    script = write_script_with_gemini(articles, edition, now)
    word_count = len(script.split())
    print(f"Script: {word_count} words")
    
    # Generate voice
    ep_base = EPISODES_DIR / f"hackwire-daily-{episode_id}"
    print("Generating voice...")
    voice_file = generate_voice(script, ep_base)
    
    # Stitch with music
    print("Stitching episode...")
    final_path = EPISODES_DIR / f"hackwire-daily-{episode_id}.mp3"
    duration = stitch_episode(voice_file, final_path)
    mins = int(duration // 60)
    secs = int(duration % 60)
    print(f"Episode: {mins}:{secs:02d} ({final_path.name})")
    
    # Update RSS
    edition_label = "Morning Brief" if edition == "morning" else "Evening Wrap"
    title = f"HackWire Daily {edition_label} — {now.strftime('%B %d, %Y')}"
    description = f"Top cybersecurity stories for {now.strftime('%A, %B %d, %Y')}. {edition_label} edition."
    
    update_rss(final_path, title, description, duration, now)
    
    # Track published
    published.append(episode_id)
    save_published(published)

    # Copy to public and deploy
    try:
        copy_to_public(final_path)
    except Exception as e:
        print(f"Public copy/deploy failed: {e}")
    
    # Clean up temp files
    for f in ep_base.parent.glob(f"{ep_base.stem}.*"):
        if f.suffix in [".txt", ".voice.mp3"]:
            f.unlink()
    
    print(f"✅ Done: {title} ({mins}:{secs:02d})")
    
    # Update podcast-data.ts with latest episodes
    try:
        import subprocess
        update_script = BASE / "update-podcast-data.py"
        if update_script.exists():
            result = subprocess.run([sys.executable, str(update_script)], capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                print("📝 Podcast data updated")
            else:
                print(f"⚠️ Podcast data update failed: {result.stderr}")
    except Exception as e:
        print(f"⚠️ Could not update podcast data: {e}")
    
    # Send notification to Andy
    try:
        import urllib.request
        bot_token = "8417850157:AAG0yGy36pSnZoPWWlXEcmfLbSrhspuMsbw"
        chat_id = "1667266840"
        
        # Send audio file
        with open(final_path, "rb") as audio:
            import io
            boundary = "----HackWireBoundary"
            body = io.BytesIO()
            
            for field, value in [("chat_id", chat_id), ("caption", f"🎙️ {title}\nDuration: {mins}:{secs:02d}")]:
                body.write(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{field}\"\r\n\r\n{value}\r\n".encode())
            
            audio_data = audio.read()
            body.write(f"--{boundary}\r\nContent-Disposition: form-data; name=\"audio\"; filename=\"{final_path.name}\"\r\nContent-Type: audio/mpeg\r\n\r\n".encode())
            body.write(audio_data)
            body.write(f"\r\n--{boundary}--\r\n".encode())
            
            req = urllib.request.Request(
                f"https://api.telegram.org/bot{bot_token}/sendAudio",
                data=body.getvalue(),
                headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
            )
            urllib.request.urlopen(req, timeout=30)
        
        print("Telegram notification sent")
    except Exception as e:
        print(f"Telegram notification failed: {e}")


if __name__ == "__main__":
    main()
