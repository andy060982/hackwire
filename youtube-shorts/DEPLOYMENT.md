# Deployment Guide - HackWire YouTube Shorts Pipeline

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
cd /home/aarevalo/clawd/hackwire/youtube-shorts
pip install -r requirements.txt
```

### 2. Verify Installation
```bash
./test-pipeline.sh
```

### 3. Schedule with Cron
```bash
./setup-cron.sh
```

Done! The pipeline will now run automatically.

---

## Detailed Setup

### Step 1: Verify Prerequisites

**Check FFmpeg Installation**
```bash
ffmpeg -version
# Expected output: ffmpeg version X.X.X ...

ffprobe -version
# Expected output: ffprobe version X.X.X ...
```

**If FFmpeg Not Installed**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg
```

**Check Python**
```bash
python3 --version
# Expected: Python 3.8 or higher
```

### Step 2: Install Python Dependencies

```bash
cd /home/aarevalo/clawd/hackwire/youtube-shorts

# Option A: Using pip
pip install -r requirements.txt

# Option B: Using pip3
pip3 install -r requirements.txt

# Verify installation
python3 -c "import google.auth; from googleapiclient.discovery import build; import requests; print('✓ All dependencies installed')"
```

### Step 3: Verify Service Account

```bash
# Check file exists
ls -la /home/aarevalo/.openclaw/agents/hermes/agent/google-service-account.json

# Verify it's valid JSON
python3 -c "
import json
with open('/home/aarevalo/.openclaw/agents/hermes/agent/google-service-account.json') as f:
    data = json.load(f)
    print(f'✓ Service account valid: {data.get(\"client_email\")}')"

# Check file permissions (should be readable)
cat /home/aarevalo/.openclaw/agents/hermes/agent/google-service-account.json | head -5
```

### Step 4: Verify Podcast Files

```bash
# Check podcast structure
ls -la /home/aarevalo/clawd/hackwire/podcast/
# Expected: episodes/, feed.xml, etc.

# Check feed.xml is valid
python3 -c "
import xml.etree.ElementTree as ET
tree = ET.parse('/home/aarevalo/clawd/hackwire/podcast/feed.xml')
items = tree.findall('.//item')
print(f'✓ Feed has {len(items)} episodes')"

# Check episodes exist
ls /home/aarevalo/clawd/hackwire/podcast/episodes/*.mp3 | head -5
```

### Step 5: Test the Pipeline

```bash
cd /home/aarevalo/clawd/hackwire/youtube-shorts

# Run automated test (comprehensive)
./test-pipeline.sh

# If test passes, try a dry run
python3 main.py --dry-run

# Or generate a test video without uploading
python3 main.py --skip-upload --keep-temp
```

### Step 6: Schedule with Cron

**Interactive Setup** (recommended)
```bash
./setup-cron.sh

# Follows prompts to set up morning, evening, or both
```

**Manual Setup**
```bash
# Edit crontab
crontab -e

# Add line for morning brief (8:15 AM ET):
15 8 * * * cd /home/aarevalo/clawd/hackwire/youtube-shorts && /usr/bin/python3 main.py >> upload.log 2>&1

# Add line for evening wrap (5:45 PM ET):
45 17 * * * cd /home/aarevalo/clawd/hackwire/youtube-shorts && /usr/bin/python3 main.py >> upload.log 2>&1
```

**Verify Cron Setup**
```bash
crontab -l
# Should show your new entries
```

---

## Configuration

### Optional: Pexels API for Stock Footage

1. Get free API key from: https://www.pexels.com/api/
2. Set environment variable:
   ```bash
   export PEXELS_API_KEY="your-api-key-here"
   ```
3. Add to your shell profile (~/.bashrc, ~/.zshrc, etc.) to persist:
   ```bash
   echo 'export PEXELS_API_KEY="your-api-key-here"' >> ~/.bashrc
   source ~/.bashrc
   ```

### Customize Video Settings

Edit `/home/aarevalo/clawd/hackwire/youtube-shorts/main.py` (around line 50-70):

```python
# THEME_COLOR = "#00FF00"     # Change neon green to other color
# BG_COLOR = "#0a0a0a"       # Change dark background
# FONT_SIZE = 60             # Change caption size
# PODCAST_URL = "https://..."  # Change podcast link
```

---

## Usage Examples

### Manual Runs

**Generate and Upload Latest Episode**
```bash
python3 main.py
```

**Generate Specific Episode**
```bash
python3 main.py --episode-date 2026-03-15
```

**Test Without Uploading**
```bash
python3 main.py --skip-upload
```

**Dry Run (simulate upload)**
```bash
python3 main.py --dry-run
```

**Inspect Generated Files**
```bash
python3 main.py --skip-upload --keep-temp
ls temp/
ls output/
```

### Monitoring

**View Log File**
```bash
tail -f upload.log
```

**Check Specific Date**
```bash
grep "2026-03-13" upload.log
```

**Find Errors**
```bash
grep "ERROR\|FAIL\|Exception" upload.log
```

---

## Troubleshooting

### Issue: "Module not found" error

```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt

# Check Python path
which python3

# Run with explicit Python
/usr/bin/python3 main.py
```

### Issue: "FFmpeg not found"

```bash
# Check installation
which ffmpeg
ffmpeg -version

# Update PATH
export PATH="/usr/bin:$PATH"

# Or fix cron path
```

### Issue: "Google authentication failed"

```bash
# Verify service account file
cat /home/aarevalo/.openclaw/agents/hermes/agent/google-service-account.json | python3 -m json.tool

# Check file permissions
chmod 644 /home/aarevalo/.openclaw/agents/hermes/agent/google-service-account.json

# Test authentication
python3 -c "
from google.oauth2 import service_account
credentials = service_account.Credentials.from_service_account_file(
    '/home/aarevalo/.openclaw/agents/hermes/agent/google-service-account.json',
    scopes=['https://www.googleapis.com/auth/youtube.upload']
)
print('✓ Authentication successful')
"
```

### Issue: "No episodes found"

```bash
# Check feed file
cat /home/aarevalo/clawd/hackwire/podcast/feed.xml | head -50

# Parse feed with Python
python3 -c "
import xml.etree.ElementTree as ET
tree = ET.parse('/home/aarevalo/clawd/hackwire/podcast/feed.xml')
for item in tree.findall('.//item'):
    print(item.findtext('title'))
"

# Check episode directory
ls -la /home/aarevalo/clawd/hackwire/podcast/episodes/*.mp3
```

### Issue: Cron Job Not Running

```bash
# Check crontab
crontab -l

# Check system logs
tail -50 /var/log/syslog | grep CRON

# Test cron manually
/bin/bash -c "cd /home/aarevalo/clawd/hackwire/youtube-shorts && /usr/bin/python3 main.py"

# Check if cron daemon is running
sudo service cron status
```

### Issue: Video Quality Issues

**Video too small/blurry**
- Edit FONT_SIZE in main.py (increase from 60 to 80-100)
- Check video bitrate (currently 5000k is good for shorts)

**Text not showing**
- Verify font file exists: `/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf`
- Install fonts if missing: `sudo apt-get install fonts-dejavu`

**Audio sync issues**
- Re-run with `--keep-temp` to inspect intermediate files
- Check audio file duration: `ffprobe -v error -show_entries format=duration <file>`

---

## First Run Checklist

- [ ] FFmpeg installed and working
- [ ] Python 3.8+ installed
- [ ] Dependencies installed via pip
- [ ] Service account file exists and is valid
- [ ] Podcast feed.xml exists
- [ ] Podcast episodes directory has .mp3 files
- [ ] Test script passes: `./test-pipeline.sh`
- [ ] Manual test works: `python3 main.py --dry-run`
- [ ] Cron job installed: `crontab -l`
- [ ] Log file has first run: `cat upload.log`

---

## Maintenance

### Daily
- Monitor for errors: `tail upload.log`
- Check YouTube channel for new uploads

### Weekly
- Verify video quality on YouTube
- Check API quota usage in Google Cloud Console
- Review any errors in logs

### Monthly
- Update Python packages: `pip install -U -r requirements.txt`
- Check FFmpeg for security updates
- Review YouTube Analytics for performance

---

## Production Deployment

### Systemd Timer Alternative (Optional)

If you prefer systemd timers over cron:

```bash
# Create service file
sudo nano /etc/systemd/system/hackwire-youtube.service
```

```ini
[Unit]
Description=HackWire Daily YouTube Shorts Pipeline
After=network.target

[Service]
Type=oneshot
User=aarevalo
WorkingDirectory=/home/aarevalo/clawd/hackwire/youtube-shorts
ExecStart=/usr/bin/python3 /home/aarevalo/clawd/hackwire/youtube-shorts/main.py
StandardOutput=append:/home/aarevalo/clawd/hackwire/youtube-shorts/upload.log
StandardError=append:/home/aarevalo/clawd/hackwire/youtube-shorts/upload.log
```

```bash
# Create timer file
sudo nano /etc/systemd/system/hackwire-youtube.timer
```

```ini
[Unit]
Description=HackWire Daily YouTube Shorts Timer
Requires=hackwire-youtube.service

[Timer]
# Run daily at 8:15 AM
OnCalendar=daily
OnCalendar=*-*-* 08:15:00

[Install]
WantedBy=timers.target
```

```bash
# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable hackwire-youtube.timer
sudo systemctl start hackwire-youtube.timer

# Monitor
sudo systemctl status hackwire-youtube.timer
```

### Docker Deployment (Optional)

For containerized deployment, create a Dockerfile:

```dockerfile
FROM python:3.11-slim

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg fonts-dejavu && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy files
COPY . /app

# Install Python dependencies
RUN pip install -r requirements.txt

# Run pipeline
CMD ["python3", "main.py"]
```

Build and run:
```bash
docker build -t hackwire-youtube .
docker run -v /home/aarevalo/.openclaw:/root/.openclaw hackwire-youtube
```

---

## Rollback Procedures

If something breaks:

1. **Stop execution**
   ```bash
   crontab -e
   # Comment out the HackWire entries
   ```

2. **Investigate logs**
   ```bash
   tail -100 upload.log
   grep ERROR upload.log
   ```

3. **Test with flags**
   ```bash
   python3 main.py --skip-upload --keep-temp
   ```

4. **Inspect temp files**
   ```bash
   ls temp/
   ls output/
   ```

5. **Re-enable when fixed**
   ```bash
   crontab -e
   # Uncomment entries
   ```

---

## Support

For detailed documentation, see:
- `README.md` - Full feature documentation
- `IMPLEMENTATION.md` - Technical details
- `main.py` - Inline code comments
- `upload.log` - Execution history

For common issues, run:
```bash
./test-pipeline.sh
```

---

**Last Updated**: March 13, 2026  
**Version**: 1.0.0
