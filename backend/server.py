import os
import requests
from fastapi import FastAPI, Request
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime, timezone
from cachetools import TTLCache

# Load environment variables (local use only; Railway uses Variables)
load_dotenv()

# ------------------ CONFIG ------------------
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "cricketbot")
CRICKET_API_KEY = os.environ.get("CRICKET_API_KEY")
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")

if not TELEGRAM_BOT_TOKEN:
    raise RuntimeError("TELEGRAM_BOT_TOKEN missing")

# ------------------ APP ------------------
app = FastAPI()

# ------------------ DATABASE ------------------
mongo_client = None
db = None

if MONGO_URL:
    try:
        mongo_client = MongoClient(MONGO_URL)
        db = mongo_client[DB_NAME]
    except Exception as e:
        print("MongoDB connection failed:", e)

# ------------------ CACHE ------------------
score_cache = TTLCache(maxsize=100, ttl=60)  # 1 minute cache

# ------------------ HELPERS ------------------
def send_telegram_message(chat_id: int, text: str):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }
    try:
        requests.post(url, json=payload, timeout=10)
    except Exception as e:
        print("Telegram send error:", e)


def get_live_score():
    if "score" in score_cache:
        return score_cache["score"]

    if not CRICKET_API_KEY:
        return "❌ CRICKET_API_KEY missing"

    try:
        url = "https://api.cricapi.com/v1/currentMatches"
        params = {
            "apikey": CRICKET_API_KEY,
            "offset": 0
        }
        res = requests.get(url, params=params, timeout=10)
        data = res.json()

        if "data" not in data or not data["data"]:
            return "No live matches right now."

        match = data["data"][0]
        team1 = match.get("teamInfo", [{}])[0].get("shortname", "Team A")
        team2 = match.get("teamInfo", [{}])[1].get("shortname", "Team B")
        status = match.get("status", "Status not available")

        score_text = f"🏏 <b>{team1} vs {team2}</b>\n{status}"
        score_cache["score"] = score_text
        return score_text

    except Exception as e:
        print("Cricket API error:", e)
        return "❌ Unable to fetch score"


# ------------------ ROUTES ------------------
@app.get("/")
def root():
    return {
        "status": "ok",
        "time": datetime.now(timezone.utc)
    }


@app.post("/api/telegram/webhook")
async def telegram_webhook(request: Request):
    data = await request.json()

    if "message" not in data:
        return {"ok": True}

    message = data["message"]
    chat_id = message["chat"]["id"]
    text = message.get("text", "")

    if text.lower().startswith("/start"):
        send_telegram_message(
            chat_id,
            "👋 Bot is live!\n\nCommands:\n/score - Live cricket score"
        )

    elif text.lower().startswith("/score"):
        score = get_live_score()
        send_telegram_message(chat_id, score)

    else:
        send_telegram_message(
            chat_id,
            "❓ Unknown command\nUse /score"
        )

    return {"ok": True}
