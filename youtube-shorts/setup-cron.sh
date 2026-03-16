#!/bin/bash
# Setup script for HackWire Daily YouTube Shorts cron jobs

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_CMD="${PYTHON_CMD:-/usr/bin/python3}"

echo "=================================================="
echo "HackWire Daily YouTube Shorts - Cron Setup"
echo "=================================================="
echo ""

# Check Python
if ! command -v "$PYTHON_CMD" &> /dev/null; then
    echo "ERROR: Python3 not found at $PYTHON_CMD"
    exit 1
fi

echo "✓ Python found: $($PYTHON_CMD --version)"

# Check FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "ERROR: FFmpeg not installed. Install with:"
    echo "  Ubuntu/Debian: sudo apt-get install ffmpeg"
    echo "  macOS: brew install ffmpeg"
    exit 1
fi

echo "✓ FFmpeg found: $(ffmpeg -version | head -1)"

# Check dependencies
echo ""
echo "Checking Python dependencies..."
if ! "$PYTHON_CMD" -c "import google.auth" 2>/dev/null; then
    echo "Installing dependencies..."
    "$PYTHON_CMD" -m pip install -q -r "$SCRIPT_DIR/requirements.txt"
    echo "✓ Dependencies installed"
else
    echo "✓ Dependencies already installed"
fi

# Check service account
echo ""
if [ -f "/home/aarevalo/.openclaw/agents/hermes/agent/google-service-account.json" ]; then
    echo "✓ Service account file found"
else
    echo "⚠ Service account file not found at:"
    echo "  /home/aarevalo/.openclaw/agents/hermes/agent/google-service-account.json"
    echo "  Upload to YouTube will fail until this is configured."
fi

# Check episode directory
echo ""
if [ -d "/home/aarevalo/clawd/hackwire/podcast/episodes" ]; then
    EPISODE_COUNT=$(ls /home/aarevalo/clawd/hackwire/podcast/episodes/*.mp3 2>/dev/null | wc -l)
    echo "✓ Podcast episodes directory found ($EPISODE_COUNT episodes)"
else
    echo "⚠ Podcast episodes directory not found"
fi

# Show cron options
echo ""
echo "=================================================="
echo "Cron Setup Options"
echo "=================================================="
echo ""
echo "1. Morning Brief (8:15 AM daily)"
echo "2. Evening Wrap (5:45 PM daily)"
echo "3. Both (morning and evening)"
echo "4. Skip (no cron setup)"
echo ""
read -p "Select option (1-4): " CRON_CHOICE

CRON_ENTRY=""

case $CRON_CHOICE in
    1)
        CRON_ENTRY="15 8 * * * cd $SCRIPT_DIR && $PYTHON_CMD main.py >> upload.log 2>&1"
        echo "Morning brief cron job:"
        ;;
    2)
        CRON_ENTRY="45 17 * * * cd $SCRIPT_DIR && $PYTHON_CMD main.py >> upload.log 2>&1"
        echo "Evening wrap cron job:"
        ;;
    3)
        CRON_ENTRY1="15 8 * * * cd $SCRIPT_DIR && $PYTHON_CMD main.py >> upload.log 2>&1"
        CRON_ENTRY2="45 17 * * * cd $SCRIPT_DIR && $PYTHON_CMD main.py >> upload.log 2>&1"
        echo "Both morning and evening cron jobs:"
        ;;
    4)
        echo "Skipping cron setup"
        exit 0
        ;;
    *)
        echo "Invalid selection"
        exit 1
        ;;
esac

# Install cron entries
if [ -n "$CRON_ENTRY" ] || [ -n "$CRON_ENTRY1" ]; then
    echo ""
    
    # Get existing crontab
    CURRENT_CRON=$(crontab -l 2>/dev/null || echo "")
    
    # Check if already exists
    if echo "$CURRENT_CRON" | grep -q "$SCRIPT_DIR"; then
        echo "⚠ HackWire cron jobs already installed"
        read -p "Replace? (y/n): " REPLACE
        if [ "$REPLACE" != "y" ]; then
            echo "Keeping existing cron jobs"
            exit 0
        fi
        # Remove old entries
        CURRENT_CRON=$(echo "$CURRENT_CRON" | grep -v "$SCRIPT_DIR" || echo "")
    fi
    
    # Add new entries
    if [ -n "$CRON_ENTRY1" ]; then
        NEW_CRON="$CURRENT_CRON"$'\n'"$CRON_ENTRY1"$'\n'"$CRON_ENTRY2"
    else
        NEW_CRON="$CURRENT_CRON"$'\n'"$CRON_ENTRY"
    fi
    
    # Remove leading/trailing whitespace
    NEW_CRON=$(echo "$NEW_CRON" | sed '/^[[:space:]]*$/d')
    
    # Install
    echo "$NEW_CRON" | crontab -
    
    echo "✓ Cron jobs installed successfully"
    echo ""
    echo "View scheduled jobs:"
    echo "  crontab -l"
    echo ""
    echo "View logs:"
    echo "  tail -f $SCRIPT_DIR/upload.log"
fi

echo ""
echo "=================================================="
echo "✓ Setup Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Test the pipeline: cd $SCRIPT_DIR && $PYTHON_CMD main.py --dry-run"
echo "2. Monitor logs: tail -f $SCRIPT_DIR/upload.log"
echo "3. View scheduled jobs: crontab -l"
echo ""
