#!/usr/bin/env python3
"""
HackWire Weekly Summary Generator
Compiles top stories of the week for NotebookLM podcast.
Runs Friday 5 PM ET — sends doc to Andy via Telegram.
"""

import json
import os
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

BASE = Path(__file__).parent
HACKWIRE = BASE.parent
ARTICLES_FILE = HACKWIRE / "src" / "lib" / "articles-data.json"
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyCTAAF4Wql-Ty0KypBsLQkrpY1FkVpeXtw")
BOT_TOKEN = "8417850157:AAG0yGy36pSnZoPWWlXEcmfLbSrhspuMsbw"
ANDY_CHAT = "1667266840"

ET = ZoneInfo("America/New_York")


def get_week_articles():
    """Get all articles from the past 7 days."""
    with open(ARTICLES_FILE) as f:
        articles = json.load(f)
    
    # Get up to 20 most recent (they're already sorted newest first)
    return articles[:20]


def build_summary_with_gemini(articles, week_start, week_end):
    """Use Gemini to write a compelling weekly summary for NotebookLM."""
    
    article_text = ""
    for i, a in enumerate(articles, 1):
        article_text += f"\n---\nStory {i}: {a['headline']}\nCategory: {a['category']}\nSource: {a.get('source', 'Unknown')}\n{a['summary']}\n"
    
    prompt = f"""You are writing a comprehensive weekly cybersecurity briefing document that will be fed into Google NotebookLM to generate a two-host podcast conversation.

Week: {week_start} to {week_end}

Here are this week's top cybersecurity stories:
{article_text}

Write a detailed briefing document (1500-2000 words) that covers:

1. **Week in Review** — The 3-4 biggest stories and why they matter
2. **Threat Landscape** — Emerging patterns and trends from the week
3. **Critical Vulnerabilities** — Key CVEs and patches organizations need to know about
4. **Industry Impact** — How these events affect businesses and individuals
5. **What to Watch Next Week** — Developing situations to monitor

Style guidelines:
- Write in an informative, analytical tone
- Include specific details, numbers, and technical context
- Explain WHY things matter, not just WHAT happened
- Make connections between stories when relevant
- This is a SOURCE DOCUMENT for NotebookLM — include enough detail for two hosts to have a 10-minute conversation
- Do NOT write it as a script — write it as an article/briefing that NotebookLM will convert to audio

Title: "HackWire Weekly Threat Briefing: {week_start} – {week_end}"
"""

    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "safetySettings": [{"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}, {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"}, {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"}, {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"}], "generationConfig": {"temperature": 0.7, "maxOutputTokens": 4000}
    })
    
    req = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_KEY}",
        data=body.encode(),
        headers={"Content-Type": "application/json"}
    )
    
    try:
        resp = urllib.request.urlopen(req, timeout=60)
        data = json.loads(resp.read())
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        print(f"Gemini failed: {e}")
        return build_fallback_summary(articles, week_start, week_end)


def build_fallback_summary(articles, week_start, week_end):
    """Plain text summary if Gemini is unavailable."""
    lines = [
        f"# HackWire Weekly Threat Briefing: {week_start} – {week_end}",
        "",
        "## Top Stories This Week",
        ""
    ]
    
    for i, a in enumerate(articles[:10], 1):
        lines.append(f"### {i}. {a['headline']}")
        lines.append(f"Category: {a['category']}")
        lines.append(f"{a['summary']}")
        lines.append("")
    
    return "\n".join(lines)


def send_to_telegram(text, filepath=None):
    """Send summary to Andy via Telegram."""
    # Send as document if we have a file
    if filepath:
        with open(filepath, "rb") as f:
            file_data = f.read()
        
        boundary = "----WeeklySummaryBoundary"
        import io
        body = io.BytesIO()
        
        for field, value in [("chat_id", ANDY_CHAT), ("caption", "📋 HackWire Weekly Summary — ready for NotebookLM!\n\nPaste this into a new NotebookLM notebook and hit 'Generate Audio Overview'. Send me the MP3 when it's done and I'll add music + publish it.")]:
            body.write(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{field}\"\r\n\r\n{value}\r\n".encode())
        
        body.write(f"--{boundary}\r\nContent-Disposition: form-data; name=\"document\"; filename=\"{os.path.basename(filepath)}\"\r\nContent-Type: text/plain\r\n\r\n".encode())
        body.write(file_data)
        body.write(f"\r\n--{boundary}--\r\n".encode())
        
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{BOT_TOKEN}/sendDocument",
            data=body.getvalue(),
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
        )
        urllib.request.urlopen(req, timeout=30)
    else:
        # Send as message (truncate if needed)
        msg = text[:4000]
        body = json.dumps({"chat_id": ANDY_CHAT, "text": msg}).encode()
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
            data=body,
            headers={"Content-Type": "application/json"}
        )
        urllib.request.urlopen(req, timeout=30)


def main():
    now = datetime.now(ET)
    week_end = now.strftime("%B %d, %Y")
    week_start = (now - timedelta(days=7)).strftime("%B %d, %Y")
    
    print(f"Generating weekly summary: {week_start} – {week_end}")
    
    articles = get_week_articles()
    print(f"Found {len(articles)} articles")
    
    summary = build_summary_with_gemini(articles, week_start, week_end)
    word_count = len(summary.split())
    print(f"Summary: {word_count} words")
    
    # Save to file
    date_str = now.strftime("%Y-%m-%d")
    summary_file = BASE / f"weekly-summary-{date_str}.txt"
    summary_file.write_text(summary)
    print(f"Saved: {summary_file}")
    
    # Send to Andy
    send_to_telegram(summary, filepath=str(summary_file))
    print("Sent to Andy via Telegram")
    
    print("✅ Done — waiting for NotebookLM audio from Andy")


if __name__ == "__main__":
    main()
