# KSP Cricket Backend

FastAPI backend for live cricket scores with Telegram bot integration.

## Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

### Environment Variables Required:
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name (default: ksp_cricket)
- `CRICKET_API_KEY` - CricketData.org API key
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `CORS_ORIGINS` - Allowed origins (use * for all)

## Local Development

```bash
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

## API Endpoints

- `GET /api/` - Health check
- `GET /api/matches/current` - Current matches (cached)
- `GET /api/matches/all` - All matches
- `GET /api/matches/{id}` - Match details
- `GET /api/series` - Series list
- `POST /api/telegram/webhook` - Telegram webhook
- `GET /api/subscribers` - Subscriber count
