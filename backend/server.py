from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import httpx
from telegram import Bot, Update
from telegram.constants import ParseMode

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Cricket API config
CRICKET_API_KEY = os.environ.get('CRICKET_API_KEY', '')
CRICKET_API_BASE = "https://api.cricapi.com/v1"

# Telegram Bot config
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '')
bot = Bot(token=TELEGRAM_BOT_TOKEN) if TELEGRAM_BOT_TOKEN else None

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ Models ============

class Subscriber(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    chat_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    subscribed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class SubscriberCreate(BaseModel):
    chat_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None

class MatchScore(BaseModel):
    r: int = 0  # runs
    w: int = 0  # wickets
    o: float = 0.0  # overs
    inning: str = ""

class Match(BaseModel):
    id: str
    name: str
    matchType: str = ""
    status: str = ""
    venue: str = ""
    date: str = ""
    dateTimeGMT: str = ""
    teams: List[str] = []
    score: List[MatchScore] = []
    series_id: str = ""
    fantasyEnabled: bool = False

class TelegramWebhookPayload(BaseModel):
    update_id: int
    message: Optional[dict] = None

# ============ Cricket API Functions ============

async def fetch_current_matches():
    """Fetch current/live matches from Cricket API"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{CRICKET_API_BASE}/currentMatches",
                params={"apikey": CRICKET_API_KEY, "offset": 0}
            )
            data = response.json()
            if data.get("status") == "success":
                return data.get("data", [])
            return []
    except Exception as e:
        logger.error(f"Error fetching current matches: {e}")
        return []

async def fetch_match_info(match_id: str):
    """Fetch detailed match info from Cricket API"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{CRICKET_API_BASE}/match_info",
                params={"apikey": CRICKET_API_KEY, "id": match_id}
            )
            data = response.json()
            if data.get("status") == "success":
                return data.get("data", {})
            return {}
    except Exception as e:
        logger.error(f"Error fetching match info: {e}")
        return {}

async def fetch_all_matches():
    """Fetch all matches from Cricket API"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{CRICKET_API_BASE}/matches",
                params={"apikey": CRICKET_API_KEY, "offset": 0}
            )
            data = response.json()
            if data.get("status") == "success":
                return data.get("data", [])
            return []
    except Exception as e:
        logger.error(f"Error fetching all matches: {e}")
        return []

async def fetch_series_list():
    """Fetch series list from Cricket API"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{CRICKET_API_BASE}/series",
                params={"apikey": CRICKET_API_KEY, "offset": 0}
            )
            data = response.json()
            if data.get("status") == "success":
                return data.get("data", [])
            return []
    except Exception as e:
        logger.error(f"Error fetching series: {e}")
        return []

# ============ Telegram Bot Functions ============

def format_match_score(match: dict) -> str:
    """Format match score for Telegram message"""
    teams = match.get("teams", [])
    scores = match.get("score", [])
    status = match.get("status", "")
    name = match.get("name", "")
    venue = match.get("venue", "")
    
    message = f"🏏 *{name}*\n"
    message += f"📍 {venue}\n\n"
    
    if scores:
        for score in scores:
            inning = score.get("inning", "")
            runs = score.get("r", 0)
            wickets = score.get("w", 0)
            overs = score.get("o", 0)
            message += f"*{inning}*\n"
            message += f"⚡ {runs}/{wickets} ({overs} ov)\n\n"
    
    message += f"📊 *Status:* {status}"
    return message

async def send_telegram_message(chat_id: int, text: str):
    """Send message to Telegram user"""
    if bot:
        try:
            await bot.send_message(
                chat_id=chat_id,
                text=text,
                parse_mode=ParseMode.MARKDOWN
            )
        except Exception as e:
            logger.error(f"Error sending Telegram message: {e}")

async def handle_telegram_command(chat_id: int, text: str, username: str = None, first_name: str = None):
    """Handle incoming Telegram bot commands"""
    if text == "/start":
        welcome_msg = f"""🏏 *Welcome to KSP Cricket!*
        
नमस्ते {first_name or 'Cricket Fan'}! 

मैं आपको Live Cricket Scores भेजूंगा।

*Commands:*
/score - Get current live scores
/subscribe - Subscribe for match alerts
/unsubscribe - Stop receiving alerts
/matches - List all current matches

Subscribe करें और हर match update पाएं! 🎯"""
        await send_telegram_message(chat_id, welcome_msg)
    
    elif text == "/score":
        matches = await fetch_current_matches()
        if matches:
            for match in matches[:3]:  # Send top 3 matches
                msg = format_match_score(match)
                await send_telegram_message(chat_id, msg)
        else:
            await send_telegram_message(chat_id, "❌ No live matches right now. Check back later!")
    
    elif text == "/subscribe":
        # Check if already subscribed
        existing = await db.subscribers.find_one({"chat_id": chat_id}, {"_id": 0})
        if existing and existing.get("is_active"):
            await send_telegram_message(chat_id, "✅ आप पहले से subscribed हैं!")
        else:
            subscriber = SubscriberCreate(
                chat_id=chat_id,
                username=username,
                first_name=first_name
            )
            subscriber_obj = Subscriber(**subscriber.model_dump())
            doc = subscriber_obj.model_dump()
            doc['subscribed_at'] = doc['subscribed_at'].isoformat()
            
            await db.subscribers.update_one(
                {"chat_id": chat_id},
                {"$set": doc},
                upsert=True
            )
            await send_telegram_message(chat_id, "🎉 Subscribed! अब आपको match alerts मिलेंगे!")
    
    elif text == "/unsubscribe":
        await db.subscribers.update_one(
            {"chat_id": chat_id},
            {"$set": {"is_active": False}}
        )
        await send_telegram_message(chat_id, "😢 Unsubscribed. आप फिर से /subscribe कर सकते हैं।")
    
    elif text == "/matches":
        matches = await fetch_current_matches()
        if matches:
            msg = "🏏 *Current Matches:*\n\n"
            for i, match in enumerate(matches[:10], 1):
                name = match.get("name", "")
                status = match.get("status", "")
                msg += f"{i}. {name}\n   _{status}_\n\n"
            await send_telegram_message(chat_id, msg)
        else:
            await send_telegram_message(chat_id, "❌ No matches found right now.")
    
    else:
        await send_telegram_message(chat_id, "❓ Unknown command. Use /start for help.")

async def notify_subscribers(match_update: dict):
    """Send match update to all active subscribers"""
    subscribers = await db.subscribers.find({"is_active": True}, {"_id": 0}).to_list(1000)
    msg = format_match_score(match_update)
    
    for sub in subscribers:
        await send_telegram_message(sub["chat_id"], msg)

# ============ API Routes ============

@api_router.get("/")
async def root():
    return {"message": "KSP Cricket API", "status": "running"}

@api_router.get("/matches/current")
async def get_current_matches():
    """Get current/live matches"""
    matches = await fetch_current_matches()
    return {"status": "success", "data": matches, "count": len(matches)}

@api_router.get("/matches/all")
async def get_all_matches():
    """Get all matches"""
    matches = await fetch_all_matches()
    return {"status": "success", "data": matches, "count": len(matches)}

@api_router.get("/matches/{match_id}")
async def get_match_details(match_id: str):
    """Get detailed match info"""
    match = await fetch_match_info(match_id)
    if match:
        return {"status": "success", "data": match}
    raise HTTPException(status_code=404, detail="Match not found")

@api_router.get("/series")
async def get_series():
    """Get series list"""
    series = await fetch_series_list()
    return {"status": "success", "data": series, "count": len(series)}

@api_router.get("/subscribers")
async def get_subscribers():
    """Get all subscribers count"""
    count = await db.subscribers.count_documents({"is_active": True})
    return {"status": "success", "active_subscribers": count}

@api_router.post("/subscribers")
async def add_subscriber(subscriber: SubscriberCreate):
    """Add a new subscriber"""
    existing = await db.subscribers.find_one({"chat_id": subscriber.chat_id}, {"_id": 0})
    if existing:
        await db.subscribers.update_one(
            {"chat_id": subscriber.chat_id},
            {"$set": {"is_active": True}}
        )
        return {"status": "success", "message": "Resubscribed"}
    
    subscriber_obj = Subscriber(**subscriber.model_dump())
    doc = subscriber_obj.model_dump()
    doc['subscribed_at'] = doc['subscribed_at'].isoformat()
    await db.subscribers.insert_one(doc)
    return {"status": "success", "message": "Subscribed", "id": subscriber_obj.id}

@api_router.delete("/subscribers/{chat_id}")
async def remove_subscriber(chat_id: int):
    """Unsubscribe a user"""
    result = await db.subscribers.update_one(
        {"chat_id": chat_id},
        {"$set": {"is_active": False}}
    )
    if result.modified_count:
        return {"status": "success", "message": "Unsubscribed"}
    raise HTTPException(status_code=404, detail="Subscriber not found")

@api_router.post("/telegram/webhook")
async def telegram_webhook(payload: dict, background_tasks: BackgroundTasks):
    """Handle Telegram webhook updates"""
    try:
        if "message" in payload:
            message = payload["message"]
            chat = message.get("chat", {})
            chat_id = chat.get("id")
            text = message.get("text", "")
            username = chat.get("username")
            first_name = chat.get("first_name")
            
            if chat_id and text:
                background_tasks.add_task(
                    handle_telegram_command, 
                    chat_id, 
                    text, 
                    username, 
                    first_name
                )
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

@api_router.post("/telegram/notify")
async def notify_all_subscribers(match_data: dict, background_tasks: BackgroundTasks):
    """Send notification to all subscribers"""
    background_tasks.add_task(notify_subscribers, match_data)
    return {"status": "success", "message": "Notifications queued"}

@api_router.get("/telegram/bot-info")
async def get_bot_info():
    """Get Telegram bot info"""
    if bot:
        try:
            bot_info = await bot.get_me()
            return {
                "status": "success",
                "bot_username": bot_info.username,
                "bot_name": bot_info.first_name
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}
    return {"status": "error", "message": "Bot not configured"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
