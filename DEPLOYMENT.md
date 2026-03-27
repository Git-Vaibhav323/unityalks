# UniTalks Deployment Checklist

## Pre-Deploy Checklist

- [ ] OS limits set (`nofile` soft/hard = `65536`)
- [ ] `scripts/sysctl-production.conf` copied to host and applied
- [ ] `scripts/set-system-limits.sh` executed successfully
- [ ] NGINX loaded with `nginx/websocket.conf` (or equivalent values)
- [ ] NGINX syntax check passes: `nginx -t`
- [ ] WebSocket proxy headers enabled (`Upgrade` + `Connection upgrade`)
- [ ] TLS certificates present and valid (Let's Encrypt paths updated)
- [ ] Backend env vars configured (see Environment Variables section)
- [ ] Redis reachable from all app instances
- [ ] PM2 cluster mode running and saved (`pm2 save`)

## Run Load Tests Before Go-Live

1. Deploy candidate build to staging.
2. Run:
   - `cd load-tests`
   - `ARTILLERY_HTTP_TARGET=https://staging.yourdomain.com ARTILLERY_WS_URL=wss://staging.yourdomain.com npm exec --yes --package=artillery artillery run staging.yml`
3. Confirm CI gate:
   - `p99 <= 1000ms`
   - `error rate <= 1%`
4. Repeat at least 3 runs and compare p95/p99 for stability.

## Horizontal Scaling Plan

- **Single-host scale-up first**
  - Keep PM2 cluster mode (`instances: max`) to use all CPU cores.
- **Multi-host scale-out next**
  - Add more app nodes to NGINX `upstream websocket_backend`.
  - Ensure shared state via Redis (already in use for queue/session metadata).
  - Keep sticky-free routing because session state is externalized.

## Production Monitoring

Track these metrics continuously:

- WebSocket connection count (`/health` `connections`)
- `ws.app_latency_ms` p50/p95/p99
- Connection error rate (`ws.connection_error`, timeout rate)
- Token issuance failures (`auth.request_failed`)
- CPU and memory per PM2 worker
- NGINX active connections and upstream 5xx
- Redis latency + command timeout rate
- CoTURN allocations and relay bandwidth

Alert thresholds (starting point):

- p99 > 1000ms for 5m
- WS error rate > 1% for 5m
- CPU > 85% for 10m
- Memory > 80% for 10m
- Redis latency > 20ms p95

## Rollback Procedure

1. Stop traffic shift / remove new nodes from upstream.
2. `pm2 reload` previous known-good release.
3. Revert NGINX config if changed: restore previous file + `nginx -s reload`.
4. Validate:
   - `/health` returns status `ok`
   - WS connect/join/leave smoke test passes
5. Keep failed version artifacts for postmortem.

## Environment Variables

- `PORT`: HTTP/WebSocket listen port (default `8080`)
- `NODE_ENV`: `development` or `production`
- `JWT_SECRET`: JWT signing key for auth tokens
- `TURN_SECRET`: HMAC secret for dynamic TURN credentials
- `CORS_ORIGIN`: allowed browser origin(s)
- `REDIS_URL`: Redis DSN used for queues/sessions
