#!/usr/bin/env python3
"""
HackWire Pixel Art Hacker Video Generator
16-bit NYC skyline with terminal, neon sign, hacking vibes
"""

import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import random
import os
from pathlib import Path

# Configuration
FRAME_WIDTH = 1080
FRAME_HEIGHT = 1920
FPS = 25
LOOP_DURATION = 30  # seconds
TOTAL_DURATION = 600  # 10 minutes
TOTAL_FRAMES = LOOP_DURATION * FPS * (TOTAL_DURATION // LOOP_DURATION)

OUTPUT_DIR = Path('/home/aarevalo/clawd/hackwire/youtube-shorts/pixel_art_output')
OUTPUT_DIR.mkdir(exist_ok=True)
FRAMES_DIR = OUTPUT_DIR / 'frames'
FRAMES_DIR.mkdir(exist_ok=True)

PODCAST_AUDIO = Path('/home/aarevalo/clawd/hackwire/podcast/episodes/hackwire-daily-2026-03-13-morning.mp3')
OUTPUT_VIDEO = OUTPUT_DIR / 'hackwire-pixel-usa.mp4'

print("🎨 HackWire Pixel Art Video Generator")
print(f"📐 Resolution: {FRAME_WIDTH}x{FRAME_HEIGHT}")
print(f"⏱️  Duration: {TOTAL_DURATION}s ({TOTAL_DURATION//60}min)")
print(f"📹 Total frames: {TOTAL_FRAMES}")

# Step 1: Generate NYC Skyline (16-bit pixel art)
def generate_pixel_skyline(width, height, seed=42):
    """Generate a pixelated NYC skyline"""
    random.seed(seed)
    
    # Create base gradient sky
    sky_img = Image.new('RGB', (width // 2, height // 2), color=(10, 10, 20))  # Dark blue-black
    pixels = sky_img.load()
    
    # Add stars
    for _ in range(50):
        x = random.randint(0, width // 2)
        y = random.randint(0, height // 4)
        pixels[x, y] = (255, 255, 200)
    
    # Generate buildings (pixelated)
    building_colors = [(20, 40, 80), (30, 50, 100), (40, 60, 120)]
    buildings = []
    x = 0
    while x < width // 2:
        building_width = random.randint(40, 100)
        building_height = random.randint(100, 200)
        buildings.append({
            'x': x,
            'y': (height // 2) - building_height,
            'width': building_width,
            'height': building_height,
            'color': random.choice(building_colors)
        })
        x += building_width + random.randint(5, 15)
    
    # Draw buildings
    draw = ImageDraw.Draw(sky_img)
    for b in buildings:
        draw.rectangle(
            [(b['x'], b['y']), (b['x'] + b['width'], b['y'] + b['height'])],
            fill=b['color'],
            outline=(50, 70, 150)
        )
        
        # Add pixelated windows
        window_size = 5
        for wy in range(b['y'], b['y'] + b['height'], window_size * 3):
            for wx in range(b['x'], b['x'] + b['width'], window_size * 3):
                if random.random() > 0.3:
                    draw.rectangle(
                        [(wx, wy), (wx + window_size, wy + window_size)],
                        fill=(200, 200, 100)
                    )
    
    # Upscale to full resolution
    skyline = sky_img.resize((width, height // 2), Image.Resampling.NEAREST)
    return skyline

# Step 2: Create terminal frame
def create_terminal_frame(width, height, frame_num):
    """Create terminal with hacking text"""
    img = Image.new('RGB', (width, height), color=(0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Terminal background (top half - window view)
    skyline = generate_pixel_skyline(width, height)
    img.paste(skyline, (0, 0))
    
    # Terminal window (bottom half)
    terminal_height = height // 2
    draw.rectangle(
        [(0, height - terminal_height), (width, height)],
        fill=(10, 20, 10),
        outline=(0, 200, 0)
    )
    
    # Terminal text (flashing ACCESS DENIED / GRANTED)
    cycle = (frame_num % (FPS * 2)) // FPS  # Toggle every second
    text = "ACCESS GRANTED ✓" if cycle == 0 else "ACCESS DENIED ✗"
    text_color = (0, 255, 0) if cycle == 0 else (255, 50, 50)
    
    # Draw text with limited font
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 40)
    except:
        font = ImageFont.load_default()
    
    # Terminal prompt
    prompt = "USER@HACKWIRE:~$ "
    draw.text((50, height - terminal_height + 50), prompt, fill=(0, 255, 0), font=font)
    
    # Flashing text
    if frame_num % 10 < 5:  # Blink every 10 frames
        draw.text((50, height - terminal_height + 120), text, fill=text_color, font=font)
    
    # Neon sign (right side, blinking)
    neon_blink = (frame_num % (FPS * 2)) > FPS  # Blink pattern
    if neon_blink:
        sign_text = "HACKING IN PROGRESS"
        neon_color = (255, 0, 150)  # Hot pink neon
        draw.text((width - 400, height // 4), sign_text, fill=neon_color, font=font)
        # Add glow effect
        for offset in range(1, 4):
            glow_color = tuple(max(0, c - 50 * offset) for c in neon_color)
            draw.text((width - 400 - offset, height // 4 - offset), sign_text, fill=glow_color, font=font)
    
    # USA flag (corner)
    flag_text = "🇺🇸 USA"
    try:
        draw.text((width - 150, 30), flag_text, fill=(255, 255, 255), font=font)
    except:
        pass
    
    return img

# Step 3: Generate all frames
print("\n🎬 Generating frames...")
for i in range(TOTAL_FRAMES):
    if i % 100 == 0:
        print(f"  Frame {i}/{TOTAL_FRAMES}")
    
    frame = create_terminal_frame(FRAME_WIDTH, FRAME_HEIGHT, i % (LOOP_DURATION * FPS))
    frame.save(FRAMES_DIR / f'frame_{i:06d}.png')

print(f"✅ Generated {TOTAL_FRAMES} frames")

# Step 4: Create video from frames with FFmpeg
print("\n🎥 Encoding video...")
cmd = [
    'ffmpeg',
    '-framerate', str(FPS),
    '-i', str(FRAMES_DIR / 'frame_%06d.png'),
    '-i', str(PODCAST_AUDIO),
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-b:v', '5000k',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-shortest',
    '-y',
    str(OUTPUT_VIDEO)
]

result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
if result.returncode != 0:
    print(f"❌ FFmpeg error: {result.stderr}")
    exit(1)

print(f"✅ Video created: {OUTPUT_VIDEO}")
print(f"📊 File size: {OUTPUT_VIDEO.stat().st_size / 1024 / 1024:.1f} MB")

# Step 5: Upload to YouTube
print("\n📤 Uploading to YouTube...")
upload_cmd = [
    'python3',
    '/home/aarevalo/clawd/hackwire/youtube-shorts/main_simple.py'
]

# Instead, just move the video to output location
import shutil
final_output = Path('/home/aarevalo/clawd/hackwire/youtube-shorts/output/hackwire-shorts-pixel-usa.mp4')
final_output.parent.mkdir(exist_ok=True)
shutil.copy(OUTPUT_VIDEO, final_output)

print(f"✅ Video ready: {final_output}")
print("\n🎉 Done! Ready to upload to YouTube")

