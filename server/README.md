# Anonymous Video Chat Backend (Phase 1)

Production-ready TypeScript backend for anonymous video chat signaling over native WebSockets. Media never traverses the backend; only SDP/ICE and control messages are relayed.

## Features
- Anonymous JWT (24h expiry) issued via REST
- WebSocket signaling at `/ws` with JWT verification
- FIFO matchmaking queue, one-to-one
- Skip / next with auto requeue
- Heartbeat ping/pong and disconnect cleanup
- Auto-requeue on partner drop
- Docker + Cloud Run compatible

## API
### POST `/api/auth/token`
Returns an anonymous JWT and expiry (seconds).

### GET `/health`
Simple liveness probe.

### WebSocket `/ws`
Connect with `wss://host/ws?token=JWT` or `Authorization: Bearer JWT`.

#### Client → Server messages
- `{ "type": "join" }`
- `{ "type": "signal", "signalType": "offer" | "answer" | "ice", "data": any }`
- `{ "type": "skip" }`
- `{ "type": "leave" }`
- `{ "type": "pong" }` (respond to server pings)

#### Server → Client messages
- `{ "type": "ready", "userId": "<uuid>" }`
- `{ "type": "queue", "position": <number> }`
- `{ "type": "matched", "partnerId": "<uuid>", "initiator": true|false }`
- `{ "type": "signal", "from": "<uuid>", "signalType": "offer" | "answer" | "ice", "data": any }`
- `{ "type": "partner-left" }`
- `{ "type": "partner-skipped" }`
- `{ "type": "ping" }`
- `{ "type": "error", "message": "..." }`

## Local Development
```bash
cd server
npm install
echo "JWT_SECRET=change-me" > .env
npm run dev
# REST: http://localhost:8080/api/auth/token
# WS:   ws://localhost:8080/ws?token=<jwt>
```

## Production Build
```bash
npm run build
npm start
```

## Docker (local)
```bash
docker build -t video-backend .
docker run -p 8080:8080 -e JWT_SECRET=change-me video-backend
```

## Deploy to Cloud Run (minimal)
```bash
gcloud builds submit --tag gcr.io/$PROJECT_ID/video-backend ./server
gcloud run deploy video-backend \
  --image gcr.io/$PROJECT_ID/video-backend \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars JWT_SECRET=change-me,PORT=8080
```

## Environment
- `JWT_SECRET` (required)
- `PORT` (default 8080)
- `NODE_ENV` (production/development)

## Notes
- In-memory queue/session: scale-to-zero friendly but not multi-instance safe. For horizontal scaling, back with Redis/pubsub in a future phase.
