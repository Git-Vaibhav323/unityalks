# UniTalks

UniTalks is an anonymous chat platform with text, audio, and video modes.
This repository contains:

- React frontend (root `src/`)
- Node.js + TypeScript backend (`server/`) using raw `ws` WebSockets
- Redis-backed state management for multi-worker scaling
- Infra templates for PM2, NGINX, and coturn

## Architecture

- **Frontend:** React app served in dev with `react-scripts`
- **Backend:** Express + `ws` signaling server on `PORT` (default `8080`)
- **Auth:** JWT token from `/api/auth/token`, then WS connection with `?token=...`
- **State:** Redis hashes/sorted-sets/keys for users, sessions, queues, socket ownership
- **Worker routing:** Redis pub/sub (`worker:{workerId}`) for cross-worker message delivery
- **TURN credentials:** time-limited HMAC-SHA1 credentials (`TURN_SECRET`)

## Repository Structure

```text
.
├── public/
├── src/                      # React frontend
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts
│   │   │   ├── jwt.ts
│   │   │   └── redis.ts
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── matchmaking.ts
│   │   │   ├── stateManager.ts
│   │   │   ├── turnCredentials.ts
│   │   │   └── workerMessaging.ts
│   │   ├── types/
│   │   └── index.ts
│   └── .env.example
├── nginx/
│   └── unitalks.conf
├── scripts/
│   ├── setup.sh
│   └── coturn.conf
└── pm2.config.js
```

## Local Development

### 1) Backend

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Backend endpoints:

- Health: `http://localhost:8080/health`
- Auth token: `POST http://localhost:8080/api/auth/token`
- TURN credentials: `GET http://localhost:8080/api/turn-credentials` (Bearer token)
- WebSocket: `ws://localhost:8080/ws?token=<jwt>`

### 2) Frontend

```bash
cd ..
npm install
npm start
```

Frontend runs on `http://localhost:3000` (or next free port).

## Environment Variables

### Frontend (`.env` at repo root)

- `REACT_APP_API_URL` (optional, defaults to `http://localhost:8080`)
- `REACT_APP_WEB3FORMS_KEY` (for contact/report forms)

### Backend (`server/.env`)

- `NODE_ENV=development`
- `PORT=8080`
- `JWT_SECRET=...` (required)
- `TURN_SECRET=...` (required)
- `REDIS_URL=redis://127.0.0.1:6379`
- `CORS_ORIGIN=*` (set to your frontend origin in production)

## Recent Backend Scaling Work Included

- Migrated in-memory user/session/queue state to Redis
  - `user:{userId}` hash
  - `session:{sessionId}` hash
  - `queue:{mode}` sorted set
  - `usersession:{userId}` mapping
  - `usersocket:{userId}` worker ownership
- Kept in-process live socket map for actual WS sends
- Added worker-to-worker message routing with Redis pub/sub
- Added TURN credential generation and API route
- Extended `matched` message with optional `turnCredentials`
- Added PM2 cluster config (`pm2.config.js`)
- Added NGINX config template (`nginx/unitalks.conf`)
- Added coturn config template (`scripts/coturn.conf`)
- Added Ubuntu setup automation (`scripts/setup.sh`)
- Added backend env template (`server/.env.example`)
- Fixed Redis command compatibility (`hmset` usage for older Redis setups)
- Fixed WS connection race so early `join` messages are not dropped

## Production Notes

- Build backend: `cd server && npm run build`
- Start with PM2: `pm2 start ../pm2.config.js`
- Ensure Redis is running and reachable from `REDIS_URL`
- Configure NGINX and coturn using the templates in this repo
- `TURN_SECRET` must match coturn `static-auth-secret`

## License

All rights reserved to UniTalks.

