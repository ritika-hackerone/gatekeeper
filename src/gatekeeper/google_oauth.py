"""
Google Sign-In via plain OAuth2 Authorization Code flow (no extra SDK).

Setup (see README "Google OAuth setup"):
  1. Create OAuth client credentials in Google Cloud Console.
  2. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI in .env.
  3. Add GOOGLE_REDIRECT_URI as an authorized redirect URI in the console.
"""
from __future__ import annotations

import os
from urllib.parse import urlencode

import httpx

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.environ.get("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo"


def build_google_login_url() -> str:
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    }
    return f"{AUTH_ENDPOINT}?{urlencode(params)}"


def exchange_code_for_userinfo(code: str) -> dict:
    """Exchanges an auth code for tokens, then fetches basic profile info."""
    token_resp = httpx.post(
        TOKEN_ENDPOINT,
        data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        },
        timeout=10.0,
    )
    token_resp.raise_for_status()
    access_token = token_resp.json()["access_token"]

    userinfo_resp = httpx.get(
        USERINFO_ENDPOINT, headers={"Authorization": f"Bearer {access_token}"}, timeout=10.0
    )
    userinfo_resp.raise_for_status()
    return userinfo_resp.json()  # {sub, email, name, picture, ...}
