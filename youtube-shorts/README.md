# HackWire Daily YouTube Shorts Automation Pipeline

Automated pipeline to generate and upload YouTube Shorts from HackWire Daily podcast episodes.

## Features

- **Automatic Episode Detection**: Fetches latest podcast episode from feed.xml
- **Video Generation**: Creates vertical 1080x1920 videos using FFmpeg
- **Dynamic Text Overlays**: Animated captions with story snippets (3-5 second scenes)
- **HackWire Branding**: Dark/neon green theme matching brand identity
- **Stock Footage Integration**: Optional Pexels API integration for background motion graphics
- **YouTube Upload**: Service Account authentication for direct uploads
- **Error Handling**: Graceful failure recovery with detailed logging
- **Cron Ready**: Can be scheduled for daily automated execution

## Directory Structure

```
hackwire/youtube-shorts/
├── main.py              # Main pipeline script
├── requirements.txt     # Python dependencies
├── README.md            # This file
├── upload.log           # Execution log (auto-created)
├── temp/                # Temporary files (auto-created, auto-cleaned)
└── output/              # Generated videos (auto-created)
```

## Prerequisites

### System Requirements

1. **FFmpeg & FFprobe** (required)
   ```bash
   # Ubuntu/Debian
   sudo apt-get install ffmpeg

   # macOS
   brew install ffmpeg
   ```

2. **Python 3.8+**
   ```bash
   python3 --version
   ```

### Service Account Setup

1. The script uses Google Service Account authentication at:
   ```
   /home/aarevalo/.openclaw/agents/hermes/agent/google-service-account.json
   ```

2. Ensure the service account has YouTube Data API v3 enabled and has these scopes:
   - `https://www.googleapis.com/auth/youtube.upload`

3. The service account email must be an owner or manager of the YouTube channel.

### Python Dependencies

```bash
pip install -r requirements.txt
```

### Optional: Pexels API (for stock footage)

To enable automatic background video downloads:

1. Get free API key from: https://www.pexels.com/api/
2. Set environment variable:
   ```bash
   export PEXELS_API_KEY="your-api-key-here"
   ```

If not set, the script will generate a simple gradient background automatically.

## Usage

### Basic Usage

```bash
python3 main.py
```

Fetches the latest episode and uploads the generated video to YouTube.

### Advanced Options

```bash
# Use specific episode date
python3 main.py --episode-date 2026-03-15

# Generate video but don't upload
python3 main.py --skip-upload

# Dry run (upload simulation only)
python3 main.py --dry-run

# Keep temporary files for inspection
python3 main.py --keep-temp
```

## Scheduling with Cron

Add to your crontab for daily automated runs:

```bash
# Daily at 8:15 AM (use your timezone)
crontab -e

# Add this line:
15 8 * * * cd /home/aarevalo/clawd/hackwire/youtube-shorts && /usr/bin/python3 main.py >> /tmp/hackwire-cron.log 2>&1
```

For multiple episodes (morning and evening):

```bash
# Morning brief at 8:15 AM
15 8 * * * cd /home/aarevalo/clawd/hackwire/youtube-shorts && /usr/bin/python3 main.py >> upload.log 2>&1

# Evening wrap at 5:45 PM
45 17 * * * cd /home/aarevalo/clawd/hackwire/youtube-shorts && /usr/bin/python3 main.py >> upload.log 2>&1
```

## Logging

All activity is logged to:
```
/home/aarevalo/clawd/hackwire/youtube-shorts/upload.log
```

View live logs:
```bash
tail -f upload.log
```

View recent activity:
```bash
tail -100 upload.log
```

## File Structure Expected

### Podcast Episodes

Episodes are expected in: `/home/aarevalo/clawd/hackwire/podcast/episodes/`

- **Audio**: `hackwire-daily-YYYY-MM-DD-{morning|evening}.mp3`
- **Transcript**: `hackwire-daily-YYYY-MM-DD-{morning|evening}.txt` (optional)

### Feed File

Feed metadata in: `/home/aarevalo/clawd/hackwire/podcast/feed.xml`

The script parses the RSS feed to get the latest episode title, date, and audio URL.

## Output Format

Generated videos are saved to:
```
/home/aarevalo/clawd/hackwire/youtube-shorts/output/
```

Filename format: `hackwire-shorts-YYYY-MM-DD.mp4`

### YouTube Upload Details

**Title Format**: `[YYYY-MM-DD] HackWire Daily - [TOPIC]`

**Description**:
```
Your daily cybersecurity threat briefing. 
Subscribe and visit https://hackwire.news/podcast/ for the full stories.

🔒 Daily coverage of data breaches, vulnerabilities, ransomware, and security news.
📰 Original Episode: [Episode Title]
🔗 Full Podcast: https://hackwire.news/podcast/
```

**Tags**: cybersecurity, hackwire, news, shorts, threats
**Category**: News & Politics

## Configuration

Edit the configuration section in `main.py` to customize:

```python
# Theme colors
THEME_COLOR = "#00FF00"     # Neon green
BG_COLOR = "#0a0a0a"       # Dark black
FONT_SIZE = 60             # Caption text size

# URLs
PODCAST_URL = "https://hackwire.news/podcast/"
PEXELS_API_URL = "https://api.pexels.com/videos/search"
```

## Troubleshooting

### FFmpeg Not Found
```bash
# Check installation
ffmpeg -version

# Update PATH if needed
export PATH="/usr/bin:$PATH"
```

### Authentication Fails
```bash
# Verify service account file exists
ls -la /home/aarevalo/.openclaw/agents/hermes/agent/google-service-account.json

# Check file permissions
file /home/aarevalo/.openclaw/agents/hermes/agent/google-service-account.json
```

### No Episodes Found
```bash
# Check episode directory
ls -la /home/aarevalo/clawd/hackwire/podcast/episodes/

# Check feed file
cat /home/aarevalo/clawd/hackwire/podcast/feed.xml
```

### Video Upload Fails
Check the log file for detailed error messages:
```bash
tail -50 upload.log
```

Common issues:
- Service account doesn't have YouTube API permissions
- Quota exceeded on YouTube channel
- Video file is corrupted or incomplete
- Network connectivity issues

### Video Looks Wrong
Check generated video in `/home/aarevalo/clawd/hackwire/youtube-shorts/output/`

Use `--keep-temp` to inspect intermediate files:
```bash
python3 main.py --keep-temp
ls -la temp/
```

## Performance

- Typical video generation: 30-120 seconds (depends on audio length and system speed)
- Typical upload: 2-10 minutes (depends on video size and connection speed)
- Total time: ~3-15 minutes per episode

## API Quotas

YouTube Data API quota: 10,000 units per day
- Each upload request: ~500 units
- Allows ~20 uploads per day (in practice, much less with large files)

## Security Notes

- Service account credentials are stored securely
- Videos are marked as public on YouTube
- No private data is included in video descriptions
- Pexels API key is optional and never logged

## Support

For issues or improvements, check:
1. `/home/aarevalo/clawd/hackwire/youtube-shorts/upload.log`
2. Recent output videos in the `output/` directory
3. Temporary files (if kept with `--keep-temp`)

## License

Part of the HackWire Daily automation suite.
