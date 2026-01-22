# KSP Cricket - Product Requirements Document

## Original Problem Statement
Build a Cricket Live Score website for KSP Cricket brand that connects with Telegram bot for real-time score alerts.

## User Personas
1. **Cricket Fans** - Want to check live scores on website
2. **Mobile Users** - Want to receive score updates via Telegram
3. **Casual Followers** - Want to see match results and upcoming fixtures

## Core Requirements (Static)
- Live cricket scores display
- Multiple matches view
- Telegram bot integration for alerts
- User subscription management
- Blue/Dark stadium theme

## What's Been Implemented (January 2025)

### Backend (FastAPI)
- `/api/` - Root endpoint
- `/api/matches/current` - Current/live matches from Cricket API
- `/api/matches/all` - All matches
- `/api/matches/{match_id}` - Match details
- `/api/series` - Series list
- `/api/subscribers` - Subscriber management
- `/api/telegram/webhook` - Telegram bot webhook
- `/api/telegram/bot-info` - Bot information
- `/api/telegram/notify` - Send notifications

### Frontend (React)
- **Home Page** - Live matches grid, refresh functionality, Telegram widget
- **Match Details Page** - Detailed scorecard, venue info, share option
- **Subscribe Page** - Telegram bot features, bot commands guide
- **Components**: Navbar, Footer, ScoreCard, TelegramWidget

### Telegram Bot Commands
- `/start` - Welcome message
- `/score` - Get live scores
- `/subscribe` - Subscribe for alerts
- `/unsubscribe` - Stop alerts
- `/matches` - List current matches

### Integrations
- Cricket API: Ultimate Cricket Data (cricketdata.org)
- Telegram Bot API (Webhook configured)

## Tech Stack
- Frontend: React, Tailwind CSS, Framer Motion
- Backend: FastAPI, Motor (MongoDB)
- Database: MongoDB
- External APIs: cricketdata.org, Telegram Bot API

## Prioritized Backlog

### P0 (Critical)
- ✅ Live score display
- ✅ Telegram bot integration
- ✅ User subscription

### P1 (Important)
- [ ] Ball-by-ball commentary
- [ ] Push notifications for key events (wicket, boundary)
- [ ] Match history page

### P2 (Nice to Have)
- [ ] Player statistics
- [ ] Series standings
- [ ] Multiple language support

## Next Tasks
1. Add ball-by-ball commentary (requires paid API)
2. Implement automatic notifications for subscribers on score changes
3. Add match history page
