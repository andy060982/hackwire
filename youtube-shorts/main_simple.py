#!/usr/bin/env python3
"""HackWire Daily YouTube Shorts Pipeline - Simplified (no text overlays)"""

import logging
import subprocess
import json
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, List
import requests
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from googleapiclient.errors import HttpError

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s: %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
logger = logging.getLogger(__name__)

OUTPUT_DIR = Path('/home/aarevalo/clawd/hackwire/youtube-shorts/output')
TEMP_DIR = Path('/home/aarevalo/clawd/hackwire/youtube-shorts/temp')

def authenticate_youtube() -> Optional[object]:
    """Authenticate with YouTube using OAuth"""
    try:
        import os
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request
        
        TOKEN_FILE = '/home/aarevalo/clawd/hackwire/youtube-shorts/oauth_token.json'
        SCOPES = ['https://www.googleapis.com/auth/youtube.upload']
        
        if not os.path.exists(TOKEN_FILE):
            logger.error("No OAuth token found")
            return None
        
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
        
        if creds.expired and creds.refresh_token:
            logger.info("Refreshing OAuth token...")
            creds.refresh(Request())
            with open(TOKEN_FILE, 'w') as f:
                f.write(creds.to_json())
        
        youtube = build('youtube', 'v3', credentials=creds)
        logger.info("YouTube authentication successful")
        return youtube
    except Exception as e:
        logger.error(f"YouTube authentication failed: {e}")
        return None

def get_audio_duration(audio_file: str) -> float:
    """Get duration of audio file"""
    try:
        result = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1:nokey=1', audio_file], capture_output=True, text=True, timeout=10)
        return float(result.stdout.strip())
    except:
        return 60.0

def create_shorts_video(episode_title: str, audio_file: str, episode_date: str) -> str:
    """Create simple shorts video without text overlays"""
    logger.info("Step 4: Creating shorts video...")
    
    output_video = OUTPUT_DIR / f"hackwire-shorts-{episode_date}.mp4"
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    
    # Use the master background video
    master_bg = Path('/home/aarevalo/clawd/hackwire/youtube-shorts/master_bg.mp4')
    if not master_bg.exists():
        logger.warning("Master background not found! Generating gradient fallback...")
        bg_video = TEMP_DIR / f"bg_{int(__import__('time').time())}.mp4"
        subprocess.run(['ffmpeg', '-f', 'lavfi', '-i', 'color=c=#0a0a0a:s=1080x1920:d=60', '-vf', 'format=yuv420p', '-y', str(bg_video)], capture_output=True, timeout=120)
    else:
        bg_video = master_bg
        logger.info("Using master hacker animation background")
    
    # Loop the background video to match the audio length
    logger.info(f"Creating shorts video: {output_video}")
    cmd = [
        'ffmpeg', '-stream_loop', '-1', '-i', str(bg_video), '-i', audio_file,
        '-filter_complex', '[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2[v];[v][1:a]concat=n=1:v=1:a=1[out]',
        '-map', '[out]', '-c:v', 'libx264', '-preset', 'medium', '-b:v', '5000k',
        '-c:a', 'aac', '-b:a', '128k', '-pix_fmt', 'yuv420p', '-shortest', '-y', str(output_video)
    ]
    subprocess.run(cmd, check=True, timeout=300)
    logger.info(f"Video created successfully: {output_video}")
    return str(output_video)

def upload_to_youtube(youtube, video_file: str, episode_date: str) -> bool:
    """Upload video to YouTube"""
    try:
        title = f"[{episode_date}] HackWire Daily - Security Brief"
        description = "Your AI-powered cybersecurity threat briefing\n\nhttps://hackwire.news/podcast/"
        
        logger.info(f"Uploading: {title}")
        
        request = youtube.videos().insert(
            part='snippet,status',
            body={
                'snippet': {'title': title, 'description': description, 'categoryId': '25'},
                'status': {'privacyStatus': 'public', 'madeForKids': False}
            },
            media_body=MediaFileUpload(video_file, mimetype='video/mp4', chunksize=-1, resumable=True)
        )
        
        response = request.execute()
        video_id = response['id']
        logger.info(f"✅ Uploaded successfully! Video ID: {video_id}")
        return True
    except HttpError as e:
        logger.error(f"Upload failed: {e}")
        return False

def main():
    logger.info("=" * 70)
    logger.info("HackWire Daily YouTube Shorts Pipeline")
    logger.info("=" * 70)
    
    # Find latest episode
    episodes_dir = Path('/home/aarevalo/clawd/hackwire/podcast/episodes')
    episodes = sorted(episodes_dir.glob('hackwire-daily-*.mp3'), reverse=True)
    
    if not episodes:
        logger.error("No episodes found")
        return
    
    audio_file = str(episodes[0])
    episode_date = episodes[0].stem.split('-')[-2]
    title = f"HackWire Daily — {episode_date}"
    
    logger.info(f"Latest episode: {title}")
    
    # Create video
    video_file = create_shorts_video(title, audio_file, episode_date)
    
    # Upload
    logger.info("Step 5: Uploading to YouTube...")
    youtube = authenticate_youtube()
    if youtube:
        upload_to_youtube(youtube, video_file, episode_date)
    else:
        logger.error("YouTube authentication failed, aborting upload")
    
    logger.info("=" * 70)
    logger.info("Step 6: Deploying website to Vercel...")
    logger.info("=" * 70)
    
    # Deploy updated podcast to live website
    try:
        import subprocess
        
        # Then deploy to Vercel
        logger.info("Triggering Vercel deployment...")
        result = subprocess.run(
            ["npx", "vercel", "--token", "vcp_2AYVOKHp0aqAffkH7SBS1GKmGXXi16Opflatek8cbPgVMangm10zHKRC", "--yes", "--prod"],
            cwd="/home/aarevalo/clawd/hackwire",
            capture_output=True,
            text=True,
            timeout=180
        )
        if result.returncode == 0:
            logger.info("✅ Website deployed to Vercel successfully")
        else:
            logger.warning(f"⚠️ Vercel deploy warning: {result.stderr[-200:]}")
    except Exception as e:
        logger.warning(f"⚠️ Could not deploy to Vercel: {e}")
    
    logger.info("=" * 70)
    logger.info("Pipeline complete - video uploaded + website updated")
    logger.info("=" * 70)

if __name__ == '__main__':
    main()
