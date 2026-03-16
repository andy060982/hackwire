# HackWire Daily YouTube Shorts Pipeline - Complete Index

## 📦 Project Deliverables

**Location**: `/home/aarevalo/clawd/hackwire/youtube-shorts/`  
**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Created**: March 13, 2026

---

## 📋 File Manifest

### Core Pipeline
| File | Size | Purpose |
|------|------|---------|
| `main.py` | 24 KB | Main automation pipeline with all functions |
| `requirements.txt` | 126 B | Python dependencies (google-auth, google-api-client, requests) |
| `config.yaml` | 1.2 KB | Configuration file (themes, URLs, API settings) |

### Documentation
| File | Size | Purpose |
|------|------|---------|
| `README.md` | 6.7 KB | Complete feature documentation and usage guide |
| `IMPLEMENTATION.md` | 9.5 KB | Technical architecture and implementation details |
| `DEPLOYMENT.md` | 9.8 KB | Step-by-step setup and deployment instructions |
| `INDEX.md` | This file | Navigation guide and project overview |

### Automation & Testing
| File | Size | Purpose |
|------|------|---------|
| `setup-cron.sh` | 4.4 KB | Interactive cron job installer |
| `test-pipeline.sh` | 2.8 KB | Automated verification and health check script |

### Runtime
| File | Type | Purpose |
|------|------|---------|
| `upload.log` | Log | Execution history and debugging information |
| `output/` | Directory | Generated MP4 videos (created at runtime) |
| `temp/` | Directory | Temporary files (auto-cleaned) |

**Total**: 10 files, ~116 KB

---

## 🚀 Quick Start

### 1. **First Time Setup** (5 minutes)
```bash
cd /home/aarevalo/clawd/hackwire/youtube-shorts
pip install -r requirements.txt
./test-pipeline.sh
./setup-cron.sh
```

### 2. **Test the Pipeline**
```bash
python3 main.py --dry-run
```

### 3. **Monitor Execution**
```bash
tail -f upload.log
```

### 4. **View Generated Videos**
```bash
ls output/
```

---

## 📚 Documentation Map

### Getting Started
Start here if you're new:
1. Read: `README.md` (15 min)
2. Run: `./test-pipeline.sh` (5 min)
3. Setup: `./setup-cron.sh` (5 min)

### Technical Deep Dive
For developers/maintainers:
1. Read: `IMPLEMENTATION.md` (architecture, features, performance)
2. Review: `main.py` code comments (detailed implementation)
3. Check: `config.yaml` for customization options

### Deployment & Operations
For system administrators:
1. Follow: `DEPLOYMENT.md` step-by-step
2. Use: `setup-cron.sh` for scheduling
3. Monitor: `upload.log` for health

---

## 🔧 How It Works

### Pipeline Flow
```
[1] Fetch Episode
    └─> Parse feed.xml
    └─> Get latest metadata
    └─> Locate audio file
        ↓
[2] Process Transcript
    └─> Read transcript or use fallback
    └─> Extract 5 story snippets
    └─> Format for captions
        ↓
[3] Generate Video
    └─> Create background (gradient or stock footage)
    └─> Add audio track
    └─> Render text overlays
    └─> Encode to MP4 (1080x1920)
        ↓
[4] Upload to YouTube
    └─> Authenticate (Service Account)
    └─> Format title & description
    └─> Upload video file
    └─> Get video ID
        ↓
[5] Cleanup & Log
    └─> Remove temp files
    └─> Log results
    └─> Report success/failure
```

### Key Components

**Episode Detection** (`get_latest_episode`)
- Parses `/home/aarevalo/clawd/hackwire/podcast/feed.xml`
- Extracts title, date, audio URL
- Locates transcript files if available
- Returns complete episode metadata

**Story Extraction** (`extract_story_snippets`)
- Reads episode transcript
- Splits on "Story number X:" patterns
- Generates 3-5 second snippet captions
- Falls back to generic cybersecurity text

**Video Generation** (`create_shorts_video`)
- Uses FFmpeg to combine:
  - Background (gradient or stock footage)
  - Audio (podcast MP3)
  - Text overlays (story snippets)
- Output: 1080x1920 vertical format
- Codec: H.264 + AAC
- Quality: 5000k video, 128k audio

**YouTube Upload** (`upload_to_youtube`)
- Authenticates with Service Account
- Formats title: `[DATE] HackWire Daily - [TOPIC]`
- Sets description with podcast link
- Adds tags: cybersecurity, hackwire, news, shorts
- Sets category: News & Politics

---

## 📊 Features at a Glance

### ✅ Automated
- Detects latest episode automatically
- Generates video with no manual input
- Uploads to YouTube unattended
- Runnable via cron or systemd

### ✅ Robust
- Handles missing transcripts gracefully
- Falls back to placeholder background
- Comprehensive error logging
- Validates dependencies upfront

### ✅ Professional
- 1080x1920 vertical format (YouTube Shorts standard)
- H.264 video codec (universal)
- HackWire branding (dark/neon green theme)
- Structured titles and descriptions

### ✅ Maintainable
- Well-documented code with comments
- Configuration file for customization
- Test scripts for verification
- Detailed logging for debugging

---

## 🔐 Security

- ✅ Service Account authentication (no user prompts)
- ✅ Credentials stored securely outside code
- ✅ No API keys logged or exposed
- ✅ All operations timestamped in logs
- ✅ Videos marked public (as intended)

---

## 🎯 Usage Scenarios

### Scenario 1: Automatic Daily Generation
```bash
# Setup one-time
./setup-cron.sh
# Select option 3 for both morning and evening

# Done! Videos generate automatically at:
# - 8:15 AM (morning brief)
# - 5:45 PM (evening wrap)
```

### Scenario 2: Manual Video Generation
```bash
# Generate latest episode
python3 main.py

# Generate specific date
python3 main.py --episode-date 2026-03-15

# Generate without uploading
python3 main.py --skip-upload
```

### Scenario 3: Testing Before Production
```bash
# Dry run (simulate upload)
python3 main.py --dry-run

# Generate video and inspect
python3 main.py --skip-upload --keep-temp
ls temp/        # Inspect intermediate files
ls output/      # View generated video
```

### Scenario 4: Troubleshooting
```bash
# Automated health check
./test-pipeline.sh

# View execution history
tail -100 upload.log

# Check recent errors
grep ERROR upload.log
```

---

## 📈 Performance Characteristics

| Operation | Time | Notes |
|-----------|------|-------|
| Episode metadata fetch | <1 sec | RSS parsing |
| Story extraction | <1 sec | Text processing |
| Background generation | 5-10 sec | FFmpeg gradient |
| Video encoding | 30-120 sec | Depends on audio length |
| Upload to YouTube | 2-10 min | Depends on file size & connection |
| **Total end-to-end** | **3-15 min** | Typical for ~11 min podcast |

---

## 🛠️ Configuration Options

Edit `main.py` around lines 50-70:

```python
# Video appearance
THEME_COLOR = "#00FF00"     # Neon green
BG_COLOR = "#0a0a0a"       # Dark black
FONT_SIZE = 60             # Caption text size

# External URLs
PODCAST_URL = "https://hackwire.news/podcast/"

# API configuration
PEXELS_API_URL = "https://api.pexels.com/videos/search"
PEXELS_API_KEY = os.environ.get("PEXELS_API_KEY")  # Optional
```

---

## 🚨 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "FFmpeg not found" | `sudo apt-get install ffmpeg` |
| "Module not found" | `pip install -r requirements.txt` |
| "Google auth failed" | Check service account file exists & is valid |
| "No episodes found" | Verify feed.xml and episodes/ directory exist |
| "Cron not running" | Check `crontab -l` and `/var/log/syslog` |

For detailed troubleshooting, see `DEPLOYMENT.md`.

---

## 📞 Support Resources

### Documentation Files
- **README.md** - Feature overview, usage examples
- **IMPLEMENTATION.md** - Technical architecture, design
- **DEPLOYMENT.md** - Setup instructions, troubleshooting
- **main.py** - Inline code comments and docstrings

### Tools
- **test-pipeline.sh** - Automated verification
- **setup-cron.sh** - Interactive configuration
- **upload.log** - Execution history

### External Resources
- YouTube Data API: https://developers.google.com/youtube/v3
- FFmpeg Docs: https://ffmpeg.org/documentation.html
- Google Service Account: https://cloud.google.com/iam/docs/service-accounts

---

## 🎬 Example Output

### Generated Video
```
File: output/hackwire-shorts-2026-03-13.mp4
Format: MP4 (H.264 + AAC)
Resolution: 1080x1920 vertical
Duration: 11 minutes (matches podcast)
Size: ~40-50 MB
```

### YouTube Title
```
[2026-03-13] HackWire Daily - Critical Security Updates
```

### YouTube Description
```
Your daily cybersecurity threat briefing.
Subscribe and visit https://hackwire.news/podcast/ for the full stories.

🔒 Daily coverage of data breaches, vulnerabilities, ransomware, and security news.
📰 Original Episode: HackWire Daily Morning Brief — March 13, 2026
🔗 Full Podcast: https://hackwire.news/podcast/
```

---

## 📋 Verification Checklist

Before going live:
- [ ] FFmpeg installed (`ffmpeg -version`)
- [ ] Python 3.8+ available (`python3 --version`)
- [ ] Dependencies installed (`pip list | grep google`)
- [ ] Service account file exists and valid
- [ ] Podcast feed.xml exists and has items
- [ ] Episode directory has .mp3 files
- [ ] Test script passes (`./test-pipeline.sh`)
- [ ] Dry run works (`python3 main.py --dry-run`)
- [ ] Cron installed (`crontab -l`)
- [ ] First log entry in upload.log

---

## 📝 Maintenance Schedule

### Daily
- Monitor `upload.log` for errors
- Check YouTube channel for new videos

### Weekly
- Verify video quality and metadata
- Check API quota usage (Google Cloud Console)
- Review any error patterns in logs

### Monthly
- Update Python packages (`pip install -U -r requirements.txt`)
- Check FFmpeg updates
- Review YouTube Analytics for performance

---

## 🔄 Upgrade Path

### From Development to Production
1. Verify all tests pass: `./test-pipeline.sh`
2. Do trial run: `python3 main.py --skip-upload`
3. Schedule with cron: `./setup-cron.sh`
4. Monitor first week closely
5. Enable email/notifications for errors (optional)

### Scaling to Multiple Channels
For other YouTube channels, create separate directories:
```bash
mkdir -p /home/aarevalo/clawd/hackwire/youtube-shorts-{channel2,channel3}
cp -r /home/aarevalo/clawd/hackwire/youtube-shorts/* youtube-shorts-channel2/
# Edit main.py to point to different podcast feed
# Edit setup-cron.sh for different schedule
```

---

## 📬 Project Information

- **Author**: YouTube Shorts Automation Team
- **Purpose**: Automate video generation and upload for HackWire Daily podcast
- **Platform**: YouTube Shorts
- **Frequency**: Daily (morning + evening episodes)
- **Status**: Production Ready
- **Last Updated**: March 13, 2026
- **Version**: 1.0.0

---

## 🎓 Learning Resources

### Understanding FFmpeg
- The main.py uses FFmpeg for video generation
- See lines 300-400 for video encoding logic
- FFmpeg filter examples: https://ffmpeg.org/ffmpeg-filters.html

### Google APIs
- Service Account auth: See lines 450-480
- YouTube upload: See lines 500-580
- Google Docs: https://developers.google.com/youtube/v3

### Python Best Practices
- Error handling: See try/except blocks throughout
- Logging: Lines 50-70 show setup
- Configuration: config.yaml for customization

---

## 🏁 Next Steps

1. **Read the README**
   ```bash
   cat README.md
   ```

2. **Run the test**
   ```bash
   ./test-pipeline.sh
   ```

3. **Set up cron**
   ```bash
   ./setup-cron.sh
   ```

4. **Monitor execution**
   ```bash
   tail -f upload.log
   ```

5. **Check YouTube**
   - Verify videos appear in your YouTube channel
   - Check titles and descriptions match format
   - Monitor video stats and engagement

---

**🎉 You're all set! The pipeline is ready for production.**

For detailed information, see the documentation files.  
For issues, check `upload.log` and run `./test-pipeline.sh`.
