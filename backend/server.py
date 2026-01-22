from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import httpx
import asyncio
from telegram import Bot, Update, InlineKeyboardButton, InlineKeyboardMarkup
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

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ CACHE SYSTEM ============
class MatchCache:
    def __init__(self, ttl_seconds=30):
        self.data: List[Dict] = []
        self.last_fetch: datetime = None
        self.ttl = ttl_seconds
        self.lock = asyncio.Lock()
    
    def is_valid(self) -> bool:
        if not self.last_fetch:
            return False
        age = (datetime.now(timezone.utc) - self.last_fetch).total_seconds()
        return age < self.ttl
    
    async def get_matches(self) -> List[Dict]:
        async with self.lock:
            if self.is_valid():
                return self.data
            
            # Fetch fresh data
            try:
                async with httpx.AsyncClient(timeout=30.0) as http_client:
                    response = await http_client.get(
                        f"{CRICKET_API_BASE}/currentMatches",
                        params={"apikey": CRICKET_API_KEY, "offset": 0}
                    )
                    data = response.json()
                    if data.get("status") == "success":
                        self.data = data.get("data", [])
                        self.last_fetch = datetime.now(timezone.utc)
                        logger.info(f"Cache refreshed: {len(self.data)} matches")
            except Exception as e:
                logger.error(f"Cache fetch error: {e}")
            
            return self.data

# Global cache instance - 30 second TTL
match_cache = MatchCache(ttl_seconds=30)

# ============ Models ============
class Subscriber(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    chat_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    subscribed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True
    live_message_id: Optional[int] = None  # For auto-update message

class SubscriberCreate(BaseModel):
    chat_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None

# ============ Score Formatting (Beautiful) ============
def format_single_match(match: dict, index: int = 0) -> str:
    """Format a single match beautifully"""
    teams = match.get("teams", [])
    scores = match.get("score", [])
    status = match.get("status", "")
    name = match.get("name", "Match")
    match_type = match.get("matchType", "").upper()
    
    # Check if live
    is_live = "live" in status.lower() or "innings" in status.lower() or (scores and "won" not in status.lower())
    
    lines = []
    lines.append(f"{'🔴 LIVE' if is_live else '📋'} *{match_type}*")
    lines.append(f"┏━━━━━━━━━━━━━━━━━━━━━━")
    lines.append(f"┃ 🏏 *{name[:40]}*")
    lines.append(f"┣━━━━━━━━━━━━━━━━━━━━━━")
    
    for i, team in enumerate(teams[:2]):
        team_score = None
        for s in scores:
            if team.lower().split()[0] in s.get("inning", "").lower():
                team_score = s
                break
        if not team_score and i < len(scores):
            team_score = scores[i]
        
        team_short = team[:20]
        if team_score:
            runs = team_score.get("r", 0)
            wickets = team_score.get("w", 0)
            overs = team_score.get("o", 0)
            lines.append(f"┃ {team_short}")
            lines.append(f"┃ ⚡ *{runs}/{wickets}* ({overs} ov)")
        else:
            lines.append(f"┃ {team_short}")
            lines.append(f"┃ 🏃 Yet to bat")
        
        if i == 0:
            lines.append(f"┃ ─────────────────────")
    
    lines.append(f"┣━━━━━━━━━━━━━━━━━━━━━━")
    lines.append(f"┃ 📊 {status[:50]}")
    lines.append(f"┗━━━━━━━━━━━━━━━━━━━━━━")
    
    return "\n".join(lines)

def format_all_matches_compact(matches: List[dict]) -> str:
    """Format all matches in compact view"""
    if not matches:
        return "❌ कोई live match नहीं है अभी।\n\nबाद में check करें!"
    
    lines = []
    lines.append("🏏 *KSP CRICKET LIVE SCORES*")
    lines.append(f"⏰ Updated: {datetime.now().strftime('%H:%M:%S')}")
    lines.append("━" * 28)
    lines.append("")
    
    live_matches = [m for m in matches if is_match_live(m)]
    other_matches = [m for m in matches if not is_match_live(m)]
    
    # Show live matches first (max 5)
    if live_matches:
        lines.append("🔴 *LIVE MATCHES*")
        lines.append("")
        for match in live_matches[:5]:
            lines.append(format_match_mini(match))
            lines.append("")
    
    # Show recent/upcoming (max 3)
    if other_matches:
        lines.append("📋 *RECENT/UPCOMING*")
        lines.append("")
        for match in other_matches[:3]:
            lines.append(format_match_mini(match))
            lines.append("")
    
    lines.append("━" * 28)
    lines.append("🔄 Auto-refresh: 30 sec")
    lines.append("📱 /subscribe for alerts")
    
    return "\n".join(lines)

def format_match_mini(match: dict) -> str:
    """Mini format for list view"""
    teams = match.get("teams", [])
    scores = match.get("score", [])
    status = match.get("status", "")
    is_live = is_match_live(match)
    
    team1 = teams[0][:15] if teams else "TBA"
    team2 = teams[1][:15] if len(teams) > 1 else "TBA"
    
    score1 = "—"
    score2 = "—"
    
    if scores:
        for s in scores:
            inning = s.get("inning", "").lower()
            if team1.lower().split()[0] in inning:
                score1 = f"{s.get('r', 0)}/{s.get('w', 0)}"
            elif team2.lower().split()[0] in inning:
                score2 = f"{s.get('r', 0)}/{s.get('w', 0)}"
        
        # Fallback to index
        if score1 == "—" and len(scores) > 0:
            score1 = f"{scores[0].get('r', 0)}/{scores[0].get('w', 0)}"
        if score2 == "—" and len(scores) > 1:
            score2 = f"{scores[1].get('r', 0)}/{scores[1].get('w', 0)}"
    
    emoji = "🔴" if is_live else "⚪"
    
    lines = [
        f"{emoji} *{team1}* vs *{team2}*",
        f"   {score1}  |  {score2}",
        f"   _{status[:35]}_"
    ]
    return "\n".join(lines)

def is_match_live(match: dict) -> bool:
    """Check if match is live"""
    status = match.get("status", "").lower()
    scores = match.get("score", [])
    return ("live" in status or "innings" in status or 
            (scores and "won" not in status and "match not started" not in status))

# ============ Telegram Bot Functions ============
async def send_or_edit_message(chat_id: int, text: str, message_id: int = None):
    """Send new message or edit existing one"""
    if not bot:
        return None
    
    try:
        if message_id:
            try:
                await bot.edit_message_text(
                    chat_id=chat_id,
                    message_id=message_id,
                    text=text,
                    parse_mode=ParseMode.MARKDOWN
                )
                return message_id
            except Exception as e:
                logger.warning(f"Edit failed, sending new: {e}")
        
        # Send new message
        msg = await bot.send_message(
            chat_id=chat_id,
            text=text,
            parse_mode=ParseMode.MARKDOWN
        )
        return msg.message_id
    except Exception as e:
        logger.error(f"Telegram error: {e}")
        return None

async def handle_telegram_command(chat_id: int, text: str, username: str = None, first_name: str = None, message_id: int = None):
    """Handle incoming Telegram bot commands"""
    
    if text == "/start":
        welcome = f"""🏏 *KSP CRICKET में आपका स्वागत है!*

नमस्ते {first_name or 'Cricket Fan'}! 👋

मैं आपको Live Cricket Scores दूंगा।

*📋 Commands:*
┣ /score - Live scores देखें
┣ /live - Auto-update score (edit होता रहेगा)
┣ /matches - सभी matches की list
┣ /subscribe - Alerts के लिए subscribe
┗ /unsubscribe - Alerts बंद करें

*🔥 Try करो:* /live command से auto-updating score!

━━━━━━━━━━━━━━━━━━━━
🌐 Website: Check live scores online too!"""
        await send_or_edit_message(chat_id, welcome)
    
    elif text == "/score":
        matches = await match_cache.get_matches()
        if matches:
            # Show top 3 live matches in detail
            live = [m for m in matches if is_match_live(m)][:3]
            if live:
                for match in live:
                    msg = format_single_match(match)
                    await send_or_edit_message(chat_id, msg)
            else:
                # Show compact all matches
                msg = format_all_matches_compact(matches)
                await send_or_edit_message(chat_id, msg)
        else:
            await send_or_edit_message(chat_id, "❌ कोई match data नहीं मिला। बाद में try करें!")
    
    elif text == "/live":
        # Send live updating message
        matches = await match_cache.get_matches()
        msg = format_all_matches_compact(matches)
        sent_msg_id = await send_or_edit_message(chat_id, msg)
        
        # Save message ID for auto-update
        if sent_msg_id:
            await db.subscribers.update_one(
                {"chat_id": chat_id},
                {"$set": {"live_message_id": sent_msg_id}},
                upsert=True
            )
            
            # Start auto-update for this user (5 updates, 30 sec apart)
            asyncio.create_task(auto_update_score(chat_id, sent_msg_id, 5))
    
    elif text == "/matches":
        matches = await match_cache.get_matches()
        msg = format_all_matches_compact(matches)
        await send_or_edit_message(chat_id, msg)
    
    elif text == "/subscribe":
        existing = await db.subscribers.find_one({"chat_id": chat_id}, {"_id": 0})
        if existing and existing.get("is_active"):
            await send_or_edit_message(chat_id, "✅ आप पहले से subscribed हैं!\n\n/live से auto-update score देखें!")
        else:
            doc = {
                "id": str(uuid.uuid4()),
                "chat_id": chat_id,
                "username": username,
                "first_name": first_name,
                "subscribed_at": datetime.now(timezone.utc).isoformat(),
                "is_active": True
            }
            await db.subscribers.update_one(
                {"chat_id": chat_id},
                {"$set": doc},
                upsert=True
            )
            await send_or_edit_message(chat_id, "🎉 *Subscribed!*\n\nअब आपको match alerts मिलेंगे!\n\n/live से live scores देखें!")
    
    elif text == "/unsubscribe":
        await db.subscribers.update_one(
            {"chat_id": chat_id},
            {"$set": {"is_active": False}}
        )
        await send_or_edit_message(chat_id, "😢 Unsubscribed.\n\nफिर से subscribe करने के लिए /subscribe भेजें।")
    
    else:
        await send_or_edit_message(chat_id, "❓ Unknown command.\n\n/start से help देखें।")

async def auto_update_score(chat_id: int, message_id: int, count: int = 5):
    """Auto-update score message every 30 seconds"""
    for i in range(count):
        await asyncio.sleep(30)  # Wait 30 seconds
        
        try:
            matches = await match_cache.get_matches()
            msg = format_all_matches_compact(matches)
            await bot.edit_message_text(
                chat_id=chat_id,
                message_id=message_id,
                text=msg,
                parse_mode=ParseMode.MARKDOWN
            )
            logger.info(f"Auto-update {i+1}/{count} for chat {chat_id}")
        except Exception as e:
            logger.error(f"Auto-update failed: {e}")
            break

# ============ Background Task for All Subscribers ============
async def broadcast_score_update():
    """Send score update to all active subscribers"""
    subscribers = await db.subscribers.find({"is_active": True}, {"_id": 0}).to_list(1000)
    matches = await match_cache.get_matches()
    msg = format_all_matches_compact(matches)
    
    for sub in subscribers:
        chat_id = sub.get("chat_id")
        msg_id = sub.get("live_message_id")
        if chat_id:
            await send_or_edit_message(chat_id, msg, msg_id)
            await asyncio.sleep(0.1)  # Rate limiting

# ============ API Routes ============
@api_router.get("/")
async def root():
    return {"message": "KSP Cricket API", "status": "running"}

@api_router.get("/matches/current")
async def get_current_matches():
    """Get current/live matches (from cache)"""
    matches = await match_cache.get_matches()
    return {"status": "success", "data": matches, "count": len(matches), "cached": match_cache.is_valid()}

@api_router.get("/matches/{match_id}")
async def get_match_details(match_id: str):
    """Get detailed match info"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as http_client:
            response = await http_client.get(
                f"{CRICKET_API_BASE}/match_info",
                params={"apikey": CRICKET_API_KEY, "id": match_id}
            )
            data = response.json()
            if data.get("status") == "success":
                return {"status": "success", "data": data.get("data", {})}
    except Exception as e:
        logger.error(f"Match fetch error: {e}")
    raise HTTPException(status_code=404, detail="Match not found")

@api_router.get("/subscribers")
async def get_subscribers():
    """Get all subscribers count"""
    count = await db.subscribers.count_documents({"is_active": True})
    return {"status": "success", "active_subscribers": count}

@api_router.post("/subscribers")
async def add_subscriber(subscriber: SubscriberCreate):
    """Add a new subscriber"""
    doc = {
        "id": str(uuid.uuid4()),
        "chat_id": subscriber.chat_id,
        "username": subscriber.username,
        "first_name": subscriber.first_name,
        "subscribed_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True
    }
    await db.subscribers.update_one(
        {"chat_id": subscriber.chat_id},
        {"$set": doc},
        upsert=True
    )
    return {"status": "success", "message": "Subscribed"}

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
            msg_id = message.get("message_id")
            
            if chat_id and text:
                background_tasks.add_task(
                    handle_telegram_command, 
                    chat_id, 
                    text, 
                    username, 
                    first_name,
                    msg_id
                )
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

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

@api_router.post("/broadcast")
async def broadcast_to_all(background_tasks: BackgroundTasks):
    """Broadcast current scores to all subscribers"""
    background_tasks.add_task(broadcast_score_update)
    return {"status": "success", "message": "Broadcast queued"}

# Include router
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
