#!/usr/bin/env python3
"""
Standalone OAuth Authorization for HackWire YouTube Shorts
Run this on your personal computer (Mac/Windows/Linux)
"""

import json
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ['https://www.googleapis.com/auth/youtube.upload']

credentials_config = {
    "installed": {
        "client_id": "434646680948-0dq6bmcg8r0u52iuo3226m65i2h3kr4d.apps.googleusercontent.com",
        "client_secret": "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",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": ["http://localhost:5000/"]
    }
}

# Write config to file
with open('oauth_credentials.json', 'w') as f:
    json.dump(credentials_config, f)

print("=" * 60)
print("HackWire YouTube Shorts - OAuth Authorization")
print("=" * 60)
print("\nYour browser will open in a moment...")
print("Click 'Authorize' when prompted.\n")

# Run OAuth flow
flow = InstalledAppFlow.from_client_secrets_file(
    'oauth_credentials.json',
    SCOPES
)

creds = flow.run_local_server(port=5000)

# Save token
with open('oauth_token.json', 'w') as token_file:
    token_file.write(creds.to_json())

print("\n" + "=" * 60)
print("✅ SUCCESS!")
print("=" * 60)
print("\nFile created: oauth_token.json")
print("\nNEXT STEP:")
print("Copy oauth_token.json to the server:")
print("  scp oauth_token.json aarevalo@lndocker:/home/aarevalo/clawd/hackwire/youtube-shorts/")
print("\nThen YouTube Shorts will upload automatically!")
print("=" * 60)
