#!/usr/bin/env python3
"""
HackWire Daily YouTube Shorts Automation Pipeline

Fetches the latest podcast episode, generates a vertical video with animated captions,
and uploads it to YouTube using a service account.

Usage: python3 main.py [--episode-date YYYY-MM-DD] [--dry-run]
"""

import os
import sys
import json
import logging
import argparse
import subprocess
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Tuple, Dict, List

import requests
from google.auth.transport.requests import Request
from google.oauth2 import service_account
from google.auth.exceptions import GoogleAuthError
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload

# ============================================================================
# CONFIGURATION
# ============================================================================

PODCAST_DIR = Path("/home/aarevalo/clawd/hackwire/podcast")
EPISODES_DIR = PODCAST_DIR / "episodes"
SHORTS_DIR = Path("/home/aarevalo/clawd/hackwire/youtube-shorts")
TEMP_DIR = SHORTS_DIR / "temp"
OUTPUT_DIR = SHORTS_DIR / "output"
LOG_FILE = SHORTS_DIR / "upload.log"

SERVICE_ACCOUNT_FILE = Path("/home/aarevalo/.openclaw/agents/hermes/agent/google-service-account.json")

# HackWire branding
THEME_COLOR = "#00FF00"  # Neon green
BG_COLOR = "#0a0a0a"    # Dark black
FONT_SIZE = 60
FONT_COLOR = "white"

# YouTube settings
YOUTUBE_SCOPE = ["https://www.googleapis.com/auth/youtube.upload"]
PODCAST_URL = "https://hackwire.news/podcast/"

# Pexels API (free stock footage)
PEXELS_API_URL = "https://api.pexels.com/videos/search"
PEXELS_API_KEY = os.environ.get("PEXELS_API_KEY")  # Optional: user provides if available

# ============================================================================
# LOGGING SETUP
# ============================================================================

def setup_logging():
    """Configure logging to both file and console."""
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    logger = logging.getLogger("HackWireShorts")
    logger.setLevel(logging.DEBUG)
    
    # File handler
    fh = logging.FileHandler(LOG_FILE, mode='a')
    fh.setLevel(logging.DEBUG)
    
    # Console handler
    ch = logging.StreamHandler(sys.stdout)
    ch.setLevel(logging.INFO)
    
    # Formatter
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s: %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    fh.setFormatter(formatter)
    ch.setFormatter(formatter)
    
    logger.addHandler(fh)
    logger.addHandler(ch)
    
    return logger

logger = setup_logging()

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def get_latest_episode() -> Optional[Dict]:
    """
    Fetch the latest podcast episode metadata from feed.xml.
    
    Returns:
        Dict with keys: title, date, audio_file, transcript_file, description
    """
    try:
        feed_file = PODCAST_DIR / "feed.xml"
        if not feed_file.exists():
            logger.error(f"Feed file not found: {feed_file}")
            return None
        
        tree = ET.parse(feed_file)
        root = tree.getroot()
        
        # Define namespaces
        ns = {
            'itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd'
        }
        
        # Get the first (latest) item
        items = root.findall('.//item')
        if not items:
            logger.error("No items found in feed.xml")
            return None
        
        item = items[0]
        
        # Extract metadata
        title = item.findtext('title', 'HackWire Daily')
        description = item.findtext('description', '')
        pub_date_str = item.findtext('pubDate', '')
        
        # Extract enclosure (audio file)
        enclosure = item.find('enclosure')
        if enclosure is None:
            logger.error("No audio enclosure found in latest episode")
            return None
        
        audio_url = enclosure.get('url')
        
        # Parse the audio filename from URL
        audio_filename = audio_url.split('/')[-1] if audio_url else None
        audio_file = EPISODES_DIR / audio_filename if audio_filename else None
        
        if not audio_file or not audio_file.exists():
            logger.error(f"Audio file not found: {audio_file}")
            return None
        
        # Find corresponding transcript file (.txt)
        # Pattern: hackwire-daily-YYYY-MM-DD-{morning|evening}.txt
        transcript_file = None
        if audio_filename:
            base_name = audio_filename.replace('.mp3', '').replace('.voice.voice', '')
            for ext in ['.txt', '.md']:
                potential_file = EPISODES_DIR / f"{base_name}{ext}"
                if potential_file.exists():
                    transcript_file = potential_file
                    break
        
        if not transcript_file or not transcript_file.exists():
            logger.warning(f"Transcript file not found, will extract from audio metadata")
        
        # Parse date from title or pubDate
        episode_date = parse_episode_date(title, pub_date_str)
        
        logger.info(f"Latest episode found: {title}")
        logger.info(f"Audio file: {audio_file}")
        logger.info(f"Transcript file: {transcript_file}")
        
        return {
            'title': title,
            'description': description,
            'date': episode_date,
            'audio_file': str(audio_file),
            'transcript_file': str(transcript_file) if transcript_file else None,
            'pub_date_str': pub_date_str,
        }
    
    except Exception as e:
        logger.error(f"Error fetching latest episode: {e}", exc_info=True)
        return None

def parse_episode_date(title: str, pub_date_str: str) -> str:
    """Extract date from title or pubDate. Returns YYYY-MM-DD format."""
    try:
        # Try to parse from pubDate first (RFC 2822 format)
        # Example: "Fri, 13 Mar 2026 07:09:43 -0400"
        if pub_date_str:
            from email.utils import parsedate_to_datetime
            dt = parsedate_to_datetime(pub_date_str)
            return dt.strftime('%Y-%m-%d')
    except:
        pass
    
    # Fallback: try to extract from title
    # Pattern: "... March 13, 2026" or "... March 13 2026"
    import re
    match = re.search(r'(\w+)\s+(\d{1,2}),?\s+(\d{4})', title)
    if match:
        month_name, day, year = match.groups()
        from datetime import datetime as dt_cls
        try:
            dt = dt_cls.strptime(f"{month_name} {day} {year}", "%B %d %Y")
            return dt.strftime('%Y-%m-%d')
        except:
            pass
    
    # Default to today
    return datetime.now().strftime('%Y-%m-%d')

def read_transcript(transcript_file: Optional[str]) -> str:
    """Read transcript content and extract story snippets."""
    if not transcript_file or not Path(transcript_file).exists():
        logger.warning("No transcript file available, using placeholder text")
        return ""
    
    try:
        with open(transcript_file, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        logger.warning(f"Error reading transcript: {e}")
        return ""

def extract_story_snippets(transcript: str, max_snippets: int = 5) -> List[str]:
    """
    Extract story snippets from transcript.
    
    Looks for patterns like "Story number X:" or splits on numbered sections.
    Returns list of story texts, each 3-5 seconds of readable content.
    """
    if not transcript:
        return ["Cybersecurity News Update", "Stay Secure", "HackWire Daily"]
    
    import re
    
    # Try to split on "Story number" or "Number X"
    snippets = []
    parts = re.split(r'Story number (?:second|third|fourth|fifth|sixth|one|two|three|four|five|six|\d+):', transcript, flags=re.IGNORECASE)
    
    if len(parts) > 1:
        # Remove intro text, take remaining parts
        story_texts = [p.strip() for p in parts[1:]]
        
        for story in story_texts:
            # Take first ~150 chars (roughly 3-4 seconds of reading)
            snippet = story[:200].strip()
            if snippet:
                # Clean up the text
                snippet = snippet.replace('\n', ' ').replace('&nbsp;', ' ')
                # Take only complete sentences
                sentences = snippet.split('.')
                if len(sentences) > 1:
                    snippet = sentences[0] + '.'
                snippets.append(snippet[:150])
    
    # Fallback: split on newlines if less than 2 snippets
    if len(snippets) < 2:
        lines = [l.strip() for l in transcript.split('\n') if l.strip() and len(l.strip()) > 20]
        snippets = lines[:max_snippets]
    
    # Ensure we have some content
    if not snippets:
        snippets = ["Cybersecurity News", "Daily Threat Brief", "Stay Vigilant", "Stay Patched"]
    
    return snippets[:max_snippets]

def check_ffmpeg() -> bool:
    """Check if FFmpeg is installed."""
    try:
        result = subprocess.run(
            ['ffmpeg', '-version'],
            capture_output=True,
            timeout=5
        )
        return result.returncode == 0
    except Exception as e:
        logger.error(f"FFmpeg check failed: {e}")
        return False

def get_audio_duration(audio_file: str) -> float:
    """Get audio duration in seconds using FFprobe."""
    try:
        result = subprocess.run(
            ['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
             '-of', 'default=noprint_wrappers=1:nokey=1:noprint_wrappers=1',
             audio_file],
            capture_output=True,
            text=True,
            timeout=30
        )
        return float(result.stdout.strip())
    except Exception as e:
        logger.warning(f"Could not determine audio duration: {e}, using 300 seconds")
        return 300.0

def download_stock_footage(query: str = "technology news", duration_seconds: int = 10) -> Optional[str]:
    """
    Download free stock footage from Pexels API (if API key available).
    Falls back to generating a simple gradient if API unavailable.
    
    Returns path to downloaded video file or None.
    """
    if not PEXELS_API_KEY:
        logger.info("Pexels API key not provided, will use generated background")
        return None
    
    try:
        logger.info(f"Searching Pexels for '{query}' footage...")
        
        headers = {'Authorization': PEXELS_API_KEY}
        params = {
            'query': query,
            'per_page': 1,
            'duration': f'0-{duration_seconds}'
        }
        
        response = requests.get(PEXELS_API_URL, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        if not data.get('videos'):
            logger.warning("No videos found on Pexels")
            return None
        
        video = data['videos'][0]
        video_file = video['video_files'][0]  # Get first format
        video_url = video_file['link']
        
        output_path = TEMP_DIR / f"stock_footage_{int(datetime.now().timestamp())}.mp4"
        
        logger.info(f"Downloading video from: {video_url}")
        video_response = requests.get(video_url, timeout=30)
        video_response.raise_for_status()
        
        with open(output_path, 'wb') as f:
            f.write(video_response.content)
        
        logger.info(f"Stock footage saved: {output_path}")
        return str(output_path)
    
    except Exception as e:
        logger.warning(f"Could not download stock footage: {e}, will use generated background")
        return None

def generate_gradient_background(width: int = 1080, height: int = 1920, 
                                duration_seconds: int = 10) -> str:
    """
    Generate a simple gradient background video using FFmpeg.
    Uses dark-to-green gradient matching HackWire branding.
    
    Returns path to generated video file.
    """
    output_path = TEMP_DIR / f"gradient_bg_{int(datetime.now().timestamp())}.mp4"
    
    # Create a gradient from dark (#0a0a0a) to neon green (#00FF00)
    # Using FFmpeg's color filter
    cmd = [
        'ffmpeg', '-f', 'lavfi',
        '-i', f'color=c=#0a0a0a:s={width}x{height}:d={duration_seconds}',
        '-vf', 'format=yuv420p',
        '-y', str(output_path)
    ]
    
    try:
        logger.info(f"Generating gradient background ({width}x{height}, {duration_seconds}s)...")
        subprocess.run(cmd, check=True, capture_output=True, timeout=300)
        logger.info(f"Gradient background created: {output_path}")
        return str(output_path)
    except Exception as e:
        logger.error(f"Failed to generate gradient background: {e}")
        raise

def generate_subtitle_overlay(snippets: List[str], duration_per_snippet: float = 3.5) -> str:
    """
    Generate FFmpeg filter for animated text overlays.
    
    Creates a drawtext filter chain that shows each snippet in sequence.
    Returns FFmpeg filter string.
    """
    filters = []
    start_time = 0
    
    for i, snippet in enumerate(snippets):
        # Escape special characters for FFmpeg
        escaped_text = snippet.replace(':', '\\:').replace("'", "\\'")
        
        # Create drawtext filter for this snippet
        # Position: centered horizontally, lower portion of vertical video
        draw_filter = (
            f"drawtext=text='{escaped_text}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:"
            f"fontsize={FONT_SIZE}:fontcolor={FONT_COLOR}:"
            f"x=(w-text_w)/2:y=h*0.7:enable='between(t,{start_time},{start_time + duration_per_snippet})':"
            f"box=1:boxcolor=#{int(THEME_COLOR.lstrip('#'), 16) & 0xFF000000 | 0x40}:boxborderw=5"
        )
        filters.append(draw_filter)
        start_time += duration_per_snippet
    
    return ','.join(filters) if filters else ""

def create_shorts_video(audio_file: str, snippets: List[str], episode_date: str,
                       background_video: Optional[str] = None) -> str:
    """
    Create the final YouTube Shorts video using FFmpeg.
    
    Combines:
    - Background video (stock footage or gradient)
    - Podcast audio
    - Animated text captions
    
    Returns path to final video file.
    """
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    
    audio_duration = get_audio_duration(audio_file)
    
    # YouTube Shorts max is 60 seconds, cap background generation
    max_shorts_duration = 60
    background_duration = min(int(audio_duration) + 2, max_shorts_duration)
    
    # Generate background if not provided
    if not background_video:
        background_video = generate_gradient_background(1080, 1920, background_duration)
    
    output_video = OUTPUT_DIR / f"hackwire-shorts-{episode_date}.mp4"
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Build FFmpeg command
    cmd = ['ffmpeg', '-i', background_video, '-i', audio_file]
    
    # Add video/audio processing
    duration_per_snippet = (audio_duration / len(snippets)) if snippets else 5
    
    # Apply text overlay filter
    text_filter = generate_subtitle_overlay(snippets, min(duration_per_snippet, 5))
    
    # Final filter chain
    filter_complex = f"[0:v]{text_filter}[v];[v][1:a]concat=n=1:v=1:a=1[out]"
    
    cmd.extend([
        '-filter_complex', filter_complex,
        '-map', '[out]',
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-b:v', '5000k',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-pix_fmt', 'yuv420p',
        '-y',
        str(output_video)
    ])
    
    try:
        logger.info(f"Creating shorts video: {output_video}")
        logger.debug(f"FFmpeg command: {' '.join(cmd)}")
        subprocess.run(cmd, check=True, timeout=300)
        logger.info(f"Video created successfully: {output_video}")
        return str(output_video)
    except subprocess.TimeoutExpired:
        logger.error("FFmpeg video creation timed out")
        raise
    except Exception as e:
        logger.error(f"FFmpeg video creation failed: {e}")
        raise

# ============================================================================
# YOUTUBE UPLOAD
# ============================================================================

def authenticate_youtube() -> Optional[object]:
    """Authenticate with YouTube using OAuth with persistent token"""
    try:
        import os
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow import InstalledAppFlow
        from google.auth.transport.requests import Request
        
        SCOPES = ['https://www.googleapis.com/auth/youtube.upload']
        TOKEN_FILE = '/home/aarevalo/clawd/hackwire/youtube-shorts/oauth_token.json'
        CREDS_FILE = '/home/aarevalo/clawd/hackwire/youtube-shorts/oauth_credentials.json'
        
        creds = None
        
        # Load saved token if it exists
        if os.path.exists(TOKEN_FILE):
            creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
        
        # If no token or invalid, refresh it
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                logger.info("Refreshing OAuth token...")
                creds.refresh(Request())
                # Save refreshed token
                with open(TOKEN_FILE, 'w') as token:
                    token.write(creds.to_json())
            else:
                logger.error("No valid token found and cannot refresh")
                return None
        
        youtube = build('youtube', 'v3', credentials=creds)
        logger.info("YouTube authentication successful (OAuth)")
        return youtube
        
    except Exception as e:
        logger.error(f"YouTube authentication failed: {e}")
        return None


def upload_to_youtube(youtube, video_file: str, episode_date: str, 
                     episode_title: str, dry_run: bool = False) -> Optional[str]:
    """
    Upload video to YouTube.
    
    Args:
        youtube: Authenticated YouTube service
        video_file: Path to the video file
        episode_date: Date in YYYY-MM-DD format
        episode_title: Original episode title
        dry_run: If True, don't actually upload
    
    Returns:
        Video ID on success, None on failure
    """
    try:
        if not Path(video_file).exists():
            logger.error(f"Video file not found: {video_file}")
            return None
        
        # Extract main topic from episode title
        topic = extract_topic(episode_title)
        
        # Format title and description
        video_title = f"[{episode_date}] HackWire Daily - {topic}"
        video_description = (
            f"Your daily cybersecurity threat briefing. "
            f"Subscribe and visit {PODCAST_URL} for the full stories.\n\n"
            f"🔒 Daily coverage of data breaches, vulnerabilities, ransomware, and security news.\n"
            f"📰 Original Episode: {episode_title}\n"
            f"🔗 Full Podcast: {PODCAST_URL}"
        )
        
        logger.info(f"Preparing upload: {video_title}")
        logger.debug(f"Description:\n{video_description}")
        
        if dry_run:
            logger.info("[DRY RUN] Skipping actual upload")
            return "DRY_RUN_ID"
        
        # Build request body
        body = {
            'snippet': {
                'title': video_title,
                'description': video_description,
                'tags': ['cybersecurity', 'hackwire', 'news', 'shorts', 'threats'],
                'categoryId': '25'  # News & Politics
            },
            'status': {
                'privacyStatus': 'public',
                'madeForKids': False
            }
        }
        
        # Upload with media
        media = MediaFileUpload(video_file, mimetype='video/mp4', resumable=True)
        
        logger.info("Uploading to YouTube...")
        request = youtube.videos().insert(
            part='snippet,status',
            body=body,
            media_body=media
        )
        
        response = request.execute()
        video_id = response['id']
        
        logger.info(f"✓ Upload successful! Video ID: {video_id}")
        logger.info(f"View at: https://youtu.be/{video_id}")
        
        return video_id
    
    except HttpError as e:
        logger.error(f"YouTube API error: {e}")
        return None
    except Exception as e:
        logger.error(f"Upload failed: {e}", exc_info=True)
        return None

def extract_topic(title: str) -> str:
    """Extract main topic from episode title."""
    import re
    # Remove date patterns and generic prefixes
    topic = re.sub(r'HackWire Daily\s*', '', title, flags=re.IGNORECASE)
    topic = re.sub(r'(Morning Brief|Evening Wrap|—|–)', '', topic)
    topic = re.sub(r'\b(March|February|January|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b', '', topic)
    return topic.strip()[:50] or "Security Brief"

# ============================================================================
# CLEANUP
# ============================================================================

def cleanup_temp_files():
    """Clean up temporary files after successful upload."""
    try:
        import shutil
        if TEMP_DIR.exists():
            logger.info("Cleaning up temporary files...")
            shutil.rmtree(TEMP_DIR)
            logger.info("Cleanup complete")
    except Exception as e:
        logger.warning(f"Error during cleanup: {e}")

# ============================================================================
# MAIN PIPELINE
# ============================================================================

def main():
    """Main pipeline function."""
    parser = argparse.ArgumentParser(description='HackWire Daily YouTube Shorts Pipeline')
    parser.add_argument('--episode-date', help='Episode date (YYYY-MM-DD), defaults to latest')
    parser.add_argument('--dry-run', action='store_true', help='Prepare video but don\'t upload')
    parser.add_argument('--skip-upload', action='store_true', help='Generate video but don\'t upload')
    parser.add_argument('--keep-temp', action='store_true', help='Keep temporary files')
    
    args = parser.parse_args()
    
    logger.info("=" * 70)
    logger.info("HackWire Daily YouTube Shorts Pipeline Started")
    logger.info("=" * 70)
    
    try:
        # Check dependencies
        if not check_ffmpeg():
            logger.error("FFmpeg is not installed or not accessible")
            return 1
        
        # Fetch latest episode
        logger.info("Step 1: Fetching latest episode metadata...")
        episode = get_latest_episode()
        if not episode:
            logger.error("Failed to fetch episode metadata")
            return 1
        
        episode_date = args.episode_date or episode['date']
        logger.info(f"Using episode date: {episode_date}")
        
        # Extract story snippets
        logger.info("Step 2: Extracting story snippets from transcript...")
        transcript = read_transcript(episode['transcript_file'])
        snippets = extract_story_snippets(transcript, max_snippets=5)
        logger.info(f"Extracted {len(snippets)} snippets")
        for i, snippet in enumerate(snippets, 1):
            logger.debug(f"  Snippet {i}: {snippet[:80]}...")
        
        # Download stock footage (optional)
        logger.info("Step 3: Preparing background video...")
        background_video = download_stock_footage(query="technology", duration_seconds=15)
        
        # Create shorts video
        logger.info("Step 4: Creating shorts video with FFmpeg...")
        video_file = create_shorts_video(
            episode['audio_file'],
            snippets,
            episode_date,
            background_video
        )
        
        # Upload to YouTube (unless skipped)
        if args.skip_upload:
            logger.info("Step 5: Skipping upload (--skip-upload flag set)")
            logger.info(f"Video ready: {video_file}")
        else:
            logger.info("Step 5: Uploading to YouTube...")
            youtube = authenticate_youtube()
            if not youtube:
                logger.error("YouTube authentication failed, aborting upload")
                return 1
            
            video_id = upload_to_youtube(
                youtube,
                video_file,
                episode_date,
                episode['title'],
                dry_run=args.dry_run
            )
            
            if not video_id:
                logger.error("Upload failed")
                return 1
        
        # Cleanup
        if not args.keep_temp:
            cleanup_temp_files()
        
        logger.info("=" * 70)
        logger.info("✓ Pipeline completed successfully")
        logger.info("=" * 70)
        return 0
    
    except KeyboardInterrupt:
        logger.warning("Pipeline interrupted by user")
        return 130
    except Exception as e:
        logger.error(f"Pipeline failed: {e}", exc_info=True)
        return 1

if __name__ == '__main__':
    sys.exit(main())
