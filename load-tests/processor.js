const WebSocket = require('ws');

const DEFAULT_HTTP_TARGET = 'http://localhost:8080';
const DEFAULT_WS_TARGET = 'ws://localhost:8080';

function normalizeWsUrl(httpTarget) {
  if (!httpTarget) return DEFAULT_WS_TARGET;
  if (httpTarget.startsWith('ws://') || httpTarget.startsWith('wss://')) return httpTarget;
  if (httpTarget.startsWith('https://')) return httpTarget.replace(/^https/, 'wss');
  return httpTarget.replace(/^http/, 'ws');
}

module.exports = {
  wsLifecycle(userContext, events, done) {
    const baseTarget =
      process.env.ARTILLERY_HTTP_TARGET ||
      process.env.HTTP_TARGET ||
      userContext.config.target ||
      DEFAULT_HTTP_TARGET;
    const wsBase =
      process.env.ARTILLERY_WS_URL ||
      process.env.WS_URL ||
      normalizeWsUrl(baseTarget);

    const tokenEndpoint = `${baseTarget.replace(/\/$/, '')}/api/auth/token`;
    const startedAt = Date.now();

    fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => {
        if (!response.ok) {
          events.emit('counter', 'auth.http_error', 1);
          throw new Error(`Token request failed: HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (!data || !data.token) {
          events.emit('counter', 'auth.missing_token', 1);
          throw new Error('Token response missing token');
        }

        const wsUrl = `${wsBase.replace(/\/$/, '')}/ws?token=${encodeURIComponent(data.token)}`;
        const ws = new WebSocket(wsUrl);
        const timeout = setTimeout(() => {
          events.emit('counter', 'ws.timeout', 1);
          ws.terminate();
          done(new Error('WebSocket response timeout'));
        }, 5000);

        let finished = false;
        const complete = (err) => {
          if (finished) return;
          finished = true;
          clearTimeout(timeout);
          done(err);
        };

        ws.on('open', () => {
          events.emit('counter', 'ws.connected', 1);
          ws.send(JSON.stringify({ type: 'join', mode: 'text' }));
        });

        ws.on('message', (raw) => {
          try {
            const msg = JSON.parse(raw.toString());

            // Server heartbeat packets should not fail a VU.
            if (msg.type === 'ping') {
              ws.send(JSON.stringify({ type: 'pong' }));
              return;
            }

            if (msg.type === 'ready' || msg.type === 'queue' || msg.type === 'matched') {
              events.emit('histogram', 'ws.app_latency_ms', Date.now() - startedAt);
              ws.send(JSON.stringify({ type: 'leave' }));
              ws.close();
              return complete();
            }

            events.emit('counter', 'ws.unexpected_reply_type', 1);
            ws.close();
            return complete(new Error(`Unexpected WS message type: ${msg.type}`));
          } catch (err) {
            events.emit('counter', 'ws.invalid_json', 1);
            ws.close();
            return complete(err);
          }
        });

        ws.on('error', (err) => {
          events.emit('counter', 'ws.connection_error', 1);
          complete(err);
        });

        ws.on('close', () => {
          if (!finished) {
            events.emit('counter', 'ws.closed_before_response', 1);
            complete(new Error('Socket closed before a valid response'));
          }
        });
      })
      .catch((err) => {
        events.emit('counter', 'auth.request_failed', 1);
        done(err);
      });
  },
};
