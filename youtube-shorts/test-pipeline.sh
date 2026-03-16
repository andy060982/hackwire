#!/bin/bash
# Quick test script for the YouTube Shorts pipeline

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_CMD="${PYTHON_CMD:-/usr/bin/python3}"

echo "=================================================="
echo "HackWire Daily YouTube Shorts - Pipeline Test"
echo "=================================================="
echo ""

# Test 1: Check Python
echo "[1/6] Checking Python..."
if ! command -v "$PYTHON_CMD" &> /dev/null; then
    echo "  ✗ Python not found"
    exit 1
fi
echo "  ✓ Python: $($PYTHON_CMD --version)"

# Test 2: Check FFmpeg
echo "[2/6] Checking FFmpeg..."
if ! command -v ffmpeg &> /dev/null; then
    echo "  ✗ FFmpeg not installed"
    exit 1
fi
echo "  ✓ FFmpeg: $(ffmpeg -version 2>&1 | head -1)"

# Test 3: Check FFprobe
echo "[3/6] Checking FFprobe..."
if ! command -v ffprobe &> /dev/null; then
    echo "  ✗ FFprobe not found"
    exit 1
fi
echo "  ✓ FFprobe found"

# Test 4: Check dependencies
echo "[4/6] Checking Python dependencies..."
if ! "$PYTHON_CMD" -c "import google.auth; from googleapiclient.discovery import build; import requests" 2>/dev/null; then
    echo "  ✗ Missing dependencies, install with: pip install -r requirements.txt"
    exit 1
fi
echo "  ✓ All dependencies installed"

# Test 5: Check configuration files
echo "[5/6] Checking configuration files..."
ERRORS=0

if [ ! -f "/home/aarevalo/clawd/hackwire/podcast/feed.xml" ]; then
    echo "  ✗ feed.xml not found"
    ERRORS=$((ERRORS+1))
else
    echo "  ✓ feed.xml found"
fi

if [ ! -d "/home/aarevalo/clawd/hackwire/podcast/episodes" ]; then
    echo "  ✗ episodes directory not found"
    ERRORS=$((ERRORS+1))
else
    EP_COUNT=$(ls /home/aarevalo/clawd/hackwire/podcast/episodes/*.mp3 2>/dev/null | wc -l || echo 0)
    echo "  ✓ episodes directory found ($EP_COUNT episodes)"
fi

if [ ! -f "/home/aarevalo/.openclaw/agents/hermes/agent/google-service-account.json" ]; then
    echo "  ⚠ Google service account not found (upload will fail)"
else
    echo "  ✓ Google service account found"
fi

# Test 6: Dry run test
echo "[6/6] Running dry-run test..."
if "$PYTHON_CMD" "$SCRIPT_DIR/main.py" --dry-run --skip-upload 2>&1 | tee /tmp/test-pipeline.log; then
    echo "  ✓ Pipeline test successful"
else
    LAST_LINES=$(tail -20 /tmp/test-pipeline.log)
    echo "  ✗ Pipeline test failed"
    echo ""
    echo "Last error output:"
    echo "$LAST_LINES"
    exit 1
fi

echo ""
echo "=================================================="
echo "✓ All Tests Passed!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Setup cron: ./setup-cron.sh"
echo "2. Run a test upload: python3 main.py --dry-run"
echo "3. Monitor logs: tail -f upload.log"
echo ""
