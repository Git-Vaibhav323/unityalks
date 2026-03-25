class SocketService {
  constructor() {
    this.ws = null;
    this.token = null;
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    this.handlers = new Map();
  }

  async getAuthToken() {
    if (this.token) {
      return this.token;
    }

    try {
      const response = await fetch(`${this.baseURL}/api/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get auth token');
      }

      const data = await response.json();
      this.token = data.token;
      return this.token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      throw error;
    }
  }

  async connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return this.ws;
    }

    const token = await this.getAuthToken();
    return new Promise((resolve, reject) => {
      const wsUrl = `${this.baseURL.replace(/^http/, 'ws')}/ws?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      ws.onopen = () => {
        resolve(ws);
      };

      ws.onerror = (err) => {
        console.error('Socket connect_error:', err?.message || err);
        reject(err);
      };

      ws.onclose = () => {
        this.ws = null;
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'ping') {
            this.send({ type: 'pong' });
            return;
          }
          const cbs = this.handlers.get(msg.type);
          if (cbs) cbs.forEach((cb) => cb(msg));
        } catch (e) {
          console.error('WS message parse error', e);
        }
      };
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  getSocket() {
    return this.ws;
  }

  on(type, callback) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type).add(callback);
  }

  off(type, callback) {
    const set = this.handlers.get(type);
    if (set) set.delete(callback);
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      console.log('[ws] sent:', message.type);
    }
  }
}

export const socketService = new SocketService();
