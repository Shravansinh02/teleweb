# KSP Cricket - Live Score Website

🏏 Live Cricket Scores with Telegram Bot Integration

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Cloudflare    │     │    Railway      │     │   MongoDB       │
│   Pages         │────▶│    Backend      │────▶│   Atlas         │
│   (Frontend)    │     │    (FastAPI)    │     │   (Free Tier)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Deployment Guide

### Step 1: MongoDB Atlas (Free)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free cluster (M0 - Free Forever)
3. Create database user
4. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/ksp_cricket`

### Step 2: Railway (Backend)

1. Go to [Railway](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repo
4. Add Environment Variables:
   ```
   MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/ksp_cricket
   DB_NAME=ksp_cricket
   CRICKET_API_KEY=your_cricket_api_key
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   CORS_ORIGINS=*
   ```
5. Set Root Directory: `backend`
6. Railway will auto-detect Python and deploy

7. Copy your Railway URL (e.g., `https://ksp-cricket-backend.up.railway.app`)

### Step 3: Cloudflare Pages (Frontend)

1. Go to [Cloudflare Pages](https://pages.cloudflare.com)
2. Click "Create a project" → "Connect to Git"
3. Select your repo
4. Configure build:
   - **Build command:** `cd frontend && yarn install && yarn build`
   - **Build output directory:** `frontend/build`
   - **Root directory:** `/`
5. Add Environment Variable:
   ```
   REACT_APP_BACKEND_URL=https://your-railway-url.up.railway.app
   ```
6. Deploy!

### Step 4: Telegram Webhook

After deployment, set webhook:
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-railway-url.up.railway.app/api/telegram/webhook"
```

## Local Development

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

### Frontend
```bash
cd frontend
yarn install
yarn start
```

## Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=ksp_cricket
CRICKET_API_KEY=your_key
TELEGRAM_BOT_TOKEN=your_token
CORS_ORIGINS=*
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

## Tech Stack

- **Frontend:** React, Tailwind CSS, Framer Motion
- **Backend:** FastAPI, Motor (MongoDB async)
- **Database:** MongoDB
- **APIs:** CricketData.org, Telegram Bot API

## Features

- ✅ Live cricket scores
- ✅ Auto-refresh (45 sec cache)
- ✅ Telegram bot alerts
- ✅ Beautiful dark theme
- ✅ Mobile responsive

## Telegram Bot Commands

- `/start` - Welcome message
- `/score` - Get live scores
- `/live` - Auto-updating scores
- `/matches` - All matches list
- `/subscribe` - Subscribe for alerts
- `/unsubscribe` - Stop alerts

## License

MIT License
