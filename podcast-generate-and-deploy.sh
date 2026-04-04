#!/bin/bash
# HackWire Podcast — Generate episodes from queue and deploy
# Runs via systemd timer twice daily (after auto-publish)
# Uses gTTS (free, no API key) for audio generation

set -euo pipefail
cd /home/aarevalo/clawd/hackwire
source .env 2>/dev/null || true

EPISODES_DIR="podcast/episodes"
PUBLIC_DIR="public/podcast/episodes"
QUEUE_FILE="podcast/podcast-queue.json"
LOG="/home/aarevalo/clawd/logs/podcast-generate.log"

log() { echo "[$(date -Iseconds)] $*" | tee -a "$LOG"; }

mkdir -p "$PUBLIC_DIR" "$(dirname "$LOG")"

# Generate any pending episodes
python3 -c "
import json, sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
from gtts import gTTS

QUEUE_FILE = Path('$QUEUE_FILE')
EPISODES_DIR = Path('$EPISODES_DIR')
PUBLIC_DIR = Path('$PUBLIC_DIR')

data = json.loads(QUEUE_FILE.read_text())
queue = data.get('queue', data) if isinstance(data, dict) else data

def write_script(articles, edition, date_str):
    try:
        dt = datetime.fromisoformat(date_str)
        formatted_date = dt.strftime('%A, %B %d, %Y')
    except:
        formatted_date = date_str
    edition_label = 'Morning Brief' if edition == 'morning' else 'Evening Wrap'
    lines = [f'This is HackWire Daily, your AI-powered cybersecurity threat briefing. Today is {formatted_date}. Here are your critical stories.', '']
    for i, a in enumerate(articles[:5], 1):
        lines.append(f'Story number {i}: {a.get(\"headline\", \"\")}')
        lines.append('')
        lines.append(f'{a.get(\"summary\", \"\")}')
        lines.append('')
        lines.append('Security teams should evaluate their exposure and review indicators of compromise related to this incident.')
        lines.append('')
    if len(articles) > 5:
        lines.append('Quick hits:')
        for a in articles[5:]:
            lines.append(f'{a.get(\"headline\", \"\")}.')
        lines.append('')
    lines.append(f'That wraps up this {edition_label} of HackWire Daily. Visit hackwire dot news for full analysis. Stay patched, stay vigilant, stay secure.')
    return '\n'.join(lines)

processed = 0
for entry in queue:
    if entry.get('deployed'):
        continue
    ep_id = entry['id']
    edition = entry['edition']
    # Convert ID format 20260323-0600 to date
    try:
        dt = datetime.strptime(ep_id[:8], '%Y%m%d')
        date_str = dt.strftime('%Y-%m-%d')
    except:
        date_str = entry.get('date', ep_id)
    ed_label = 'morning' if edition == 'morning' else 'evening'
    mp3_name = f'hackwire-daily-{date_str}-{ed_label}.mp3'
    output = EPISODES_DIR / f'{ep_id}.mp3'
    public_out = PUBLIC_DIR / mp3_name

    if public_out.exists() and public_out.stat().st_size > 0:
        entry['deployed'] = True
        processed += 1
        continue

    print(f'Generating: {ep_id}')
    script = write_script(entry.get('articles', []), edition, entry.get('date', ''))
    try:
        tts = gTTS(text=script, lang='en', slow=False)
        tts.save(str(public_out))
        print(f'  OK: {mp3_name} ({public_out.stat().st_size // 1024}KB)')
        entry['deployed'] = True
        entry['deployed_at'] = datetime.now(ZoneInfo('UTC')).isoformat()
        processed += 1
    except Exception as e:
        print(f'  FAIL: {e}')

QUEUE_FILE.write_text(json.dumps({'queue': queue}, indent=2))
print(f'Generated {processed} episodes')
" 2>&1 | tee -a "$LOG"

# Clean old episodes (keep last 30 days)
find "$PUBLIC_DIR" -name "*.mp3" -mtime +30 -delete 2>/dev/null || true

# Update podcast data (registers new episodes with the website)
log "Updating podcast data..."
python3 podcast/update-podcast-data.py 2>&1 | tee -a "$LOG"

# Deploy to Vercel
log "Deploying to Vercel..."
/home/aarevalo/.nvm/versions/node/v24.13.0/bin/npx vercel --prod --yes --token "$VERCEL_TOKEN" 2>&1 | tail -5 | tee -a "$LOG"
log "Done"
