import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { env } from './config/env';
import { verifyToken } from './config/jwt';
import authRoutes from './routes/auth';
import { MatchmakingService } from './services/matchmaking';
import { StateManager } from './services/stateManager';
import { ClientMessage, ServerMessage } from './types';
import { logger } from './utils/logger';

const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

// ═══════════════════════════════════════════════════════════════
// 🏗️ SYSTEM INITIALIZATION - Following Omegle Architecture
// ═══════════════════════════════════════════════════════════════

const stateManager = new StateManager();
const matchmaking = new MatchmakingService(stateManager);

const HEARTBEAT_INTERVAL = 15000; // 15 seconds
const MAINTENANCE_INTERVAL = 30000; // 30 seconds

// ═══════════════════════════════════════════════════════════════
// 📡 MESSAGING UTILITIES
// ═══════════════════════════════════════════════════════════════

function send(userId: string, message: ServerMessage): boolean {
  const user = stateManager.getUser(userId);
  if (!user || user.ws.readyState !== user.ws.OPEN) {
    return false;
  }
  
  try {
    user.ws.send(JSON.stringify(message));
    return true;
  } catch (error) {
    logger.error(`Failed to send message to ${userId}:`, error);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// 🎯 CORE MATCHMAKING FLOW
// ═══════════════════════════════════════════════════════════════

function attemptMatch(): void {
  // Try to match as many pairs as possible in each mode
  // The while loop ensures we consume the queue until < 2 users remain
  
  // 1. Video Queue
  let videoMatched = true;
  while (videoMatched) {
    const sessionId = matchmaking.findMatch('video');
    if (sessionId) {
      const session = stateManager.getSession(sessionId);
      if (session) {
        handleMatchSuccess(session.userA, session.userB, sessionId, 'video');
      }
    } else {
      videoMatched = false;
    }
  }

  // 2. Audio Queue
  let audioMatched = true;
  while (audioMatched) {
    const sessionId = matchmaking.findMatch('audio');
    if (sessionId) {
      const session = stateManager.getSession(sessionId);
      if (session) {
        handleMatchSuccess(session.userA, session.userB, sessionId, 'audio');
      }
    } else {
      audioMatched = false;
    }
  }

  // 3. Text Queue
  let textMatched = true;
  while (textMatched) {
    const sessionId = matchmaking.findMatch('text');
    if (sessionId) {
      const session = stateManager.getSession(sessionId);
      if (session) {
        handleMatchSuccess(session.userA, session.userB, sessionId, 'text');
      }
    } else {
      textMatched = false;
    }
  }
}

function handleMatchSuccess(userA: string, userB: string, sessionId: string, mode: 'video' | 'audio' | 'text'): void {
  // Determine initiator (first user is initiator)
  const userARecord = stateManager.getUser(userA);
  const userBRecord = stateManager.getUser(userB);
  
  if (!userARecord || !userBRecord) {
    stateManager.endSession(sessionId);
    return;
  }

  const initiator = (userARecord.enqueuedAt || 0) <= (userBRecord.enqueuedAt || 0) ? userA : userB;

  // Send match notifications
  const sentA = send(userA, { 
    type: 'matched', 
    partnerId: userB, 
    initiator: initiator === userA,
    sessionId 
  });
  
  const sentB = send(userB, { 
    type: 'matched', 
    partnerId: userA, 
    initiator: initiator === userB,
    sessionId 
  });

  if (!sentA || !sentB) {
    logger.warn(`❌ Match notification failed for session ${sessionId} (A: ${sentA}, B: ${sentB}) - rolling back`);
    stateManager.endSession(sessionId);
    
    // Requeue the user who successfully received the message (if any)
    if (sentA) {
      matchmaking.enqueueUser(userA);
      send(userA, { type: 'error', message: 'Partner connection failed, searching again...' });
    }
    if (sentB) {
      matchmaking.enqueueUser(userB);
      send(userB, { type: 'error', message: 'Partner connection failed, searching again...' });
    }
    return;
  }

  logger.info(`🎯 ${mode} Match sent: ${userA} <-> ${userB} (session: ${sessionId})`);
}

// ═══════════════════════════════════════════════════════════════
// 🧹 CLEANUP & DISCONNECTION HANDLING
// ═══════════════════════════════════════════════════════════════

function handleUserDisconnect(userId: string): void {
  const user = stateManager.getUser(userId);
  if (!user) return;

  // If user is in a session, notify partner
  const partner = stateManager.getSessionPartner(userId);
  if (partner) {
    send(partner, { type: 'partner-left' });
    
    // End session and requeue partner
    if (user.sessionId) {
      stateManager.endSession(user.sessionId, userId);
    }
    
    // Auto-requeue partner at END of queue (FIFO rule)
    const partnerUser = stateManager.getUser(partner);
    if (partnerUser) {
      const enqueueResult = matchmaking.enqueueUser(partner);
      if (enqueueResult.success) {
        send(partner, { type: 'queue', position: enqueueResult.queuePosition || 1 });
        logger.info(`🔄 Partner ${partner} requeued at END after disconnect (FIFO)`);
        attemptMatch();
      }
    }
  }

  // Remove user completely
  stateManager.removeUser(userId);
  logger.info(`👋 User disconnected: ${userId}`);
}

// ═══════════════════════════════════════════════════════════════
// 🔌 WEBSOCKET CONNECTION HANDLING - Omegle Rules Implementation
// ═══════════════════════════════════════════════════════════════

wss.on('connection', (ws, request) => {
  let userId: string;
  
  try {
    // Authentication
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const token = url.searchParams.get('token') || (request.headers.authorization?.replace('Bearer ', '') ?? '');
    if (!token) {
      ws.close(4001, 'Missing token');
      return;
    }
    
    const payload = verifyToken(token);
    userId = payload.userId;

    // Add user to state manager
    stateManager.addUser(userId, ws);
    send(userId, { type: 'ready', userId });
    
    logger.info(`🔌 User connected: ${userId}`);

    // ═══════════════════════════════════════════════════════════════
    // 📨 MESSAGE HANDLING - Following Omegle Protocol Rules
    // ═══════════════════════════════════════════════════════════════

    ws.on('message', (raw) => {
      let message: ClientMessage;
      
      try {
        message = JSON.parse(raw.toString()) as ClientMessage;
      } catch (err) {
        send(userId, { type: 'error', message: 'Invalid message format' });
        return;
      }

      // Update user activity
      stateManager.updateLastPong(userId);

      switch (message.type) {
        // ───────────────────────────────────────────────────────────
        // 1️⃣ JOIN QUEUE - Enqueue Rules Implementation
        // ───────────────────────────────────────────────────────────
        case 'join': {
          const mode = message.mode || 'video';
          stateManager.setMode(userId, mode);
          
          const result = matchmaking.enqueueUser(userId);
          
          if (!result.success) {
            send(userId, { type: 'error', message: result.reason || 'Cannot join queue' });
            break;
          }

          // Send queue position
          send(userId, { type: 'queue', position: result.queuePosition || 1 });
          logger.info(`📥 ${userId} joined ${mode} queue (position: ${result.queuePosition})`);

          // Attempt matchmaking
          attemptMatch();
          break;
        }

        // ───────────────────────────────────────────────────────────
        // 2️⃣ CANCEL SEARCH - Dequeue Rules
        // ───────────────────────────────────────────────────────────
        case 'cancel': {
          const success = matchmaking.cancelSearch(userId);
          if (success) {
            send(userId, { type: 'search-cancelled' });
            logger.info(`🚫 ${userId} cancelled search`);
          }
          break;
        }

        // ───────────────────────────────────────────────────────────
        // 3️⃣ SESSION ACKNOWLEDGMENT - 1-to-1 Session Rules
        // ───────────────────────────────────────────────────────────
        case 'acknowledge': {
          const sessionReady = stateManager.acknowledgeSession(userId);
          if (sessionReady) {
            const partner = stateManager.getSessionPartner(userId);
            if (partner) {
              // Notify both users that session is fully active
              send(userId, { type: 'session-ready' });
              send(partner, { type: 'session-ready' });
              logger.info(`✅ Session ready: ${userId} <-> ${partner}`);
            }
          }
          break;
        }

        // ───────────────────────────────────────────────────────────
        // 4️⃣ WEBRTC SIGNALING - Active Session Only
        // ───────────────────────────────────────────────────────────
        case 'signal': {
          const session = stateManager.getUserSession(userId);
          if (!session) {
            send(userId, { type: 'error', message: 'No active session for signaling' });
            break;
          }

          // Allow signaling as soon as session exists (pending or active) so first offer isn't dropped
          if (session.state !== 'pending' && session.state !== 'active') {
            send(userId, { type: 'error', message: 'Session not ready for signaling' });
            break;
          }

          const partner = stateManager.getSessionPartner(userId);
          if (!partner) {
            send(userId, { type: 'error', message: 'Partner not found' });
            break;
          }

          // Forward signal to partner
          send(partner, {
            type: 'signal',
            from: userId,
            signalType: message.signalType,
            data: message.data,
          });

          // Update session activity
          if (session) {
            session.lastActivity = Date.now();
          }
          break;
        }

        // ───────────────────────────────────────────────────────────
        // 5️⃣ SKIP PARTNER - Skip Rules Implementation
        // ───────────────────────────────────────────────────────────
        case 'skip': {
          const skipResult = stateManager.handleSkip(userId);
          
          if (!skipResult.success) {
            send(userId, { type: 'error', message: skipResult.reason || 'Cannot skip' });
            break;
          }

          // Notify partner they were skipped
          if (skipResult.partner) {
            send(skipResult.partner, { type: 'partner-skipped' });
            
            // Requeue skipped partner at END of queue (FIFO rule)
            // Note: Their mode remains set from previous join
            const partnerEnqueue = matchmaking.enqueueUser(skipResult.partner);
            if (partnerEnqueue.success) {
              send(skipResult.partner, { type: 'queue', position: partnerEnqueue.queuePosition || 1 });
            }
          }

          // Requeue skipper at END of queue (FIFO rule - no priority for skipping)
          const userEnqueue = matchmaking.enqueueUser(userId);
          if (userEnqueue.success) {
            send(userId, { type: 'queue', position: userEnqueue.queuePosition || 1 });
          }

          logger.info(`⏭️ ${userId} skipped partner ${skipResult.partner} (both requeued at end)`);

          // Attempt new matches
          attemptMatch();
          break;
        }

        // ───────────────────────────────────────────────────────────
        // 6️⃣ LEAVE SYSTEM - Disconnect Rules
        // ───────────────────────────────────────────────────────────
        case 'leave': {
          handleUserDisconnect(userId);
          break;
        }

        // ───────────────────────────────────────────────────────────
        // 7️⃣ HEARTBEAT - Connection Health
        // ───────────────────────────────────────────────────────────
        case 'pong': {
          stateManager.updateLastPong(userId);
          break;
        }

        // ───────────────────────────────────────────────────────────
        // FUN REQUEST / ACCEPT / REJECT - Forward to partner
        // ───────────────────────────────────────────────────────────
        case 'fun-request': {
          const session = stateManager.getUserSession(userId);
          const partner = session ? stateManager.getSessionPartner(userId) : null;
          if (!partner) {
            send(userId, { type: 'error', message: 'No active session for fun request' });
            break;
          }
          const game = (message as any).game || 'chess';
          send(partner, { type: 'fun-request', from: userId, game });
          break;
        }
        case 'fun-accept': {
          const session = stateManager.getUserSession(userId);
          const partner = session ? stateManager.getSessionPartner(userId) : null;
          if (!partner) break;
          const game = (message as any).game || 'chess';
          send(partner, { type: 'fun-accept', from: userId, game });
          break;
        }
        case 'fun-reject': {
          const session = stateManager.getUserSession(userId);
          const partner = session ? stateManager.getSessionPartner(userId) : null;
          if (!partner) break;
          send(partner, { type: 'fun-reject', from: userId });
          break;
        }
        case 'fun-exit': {
          const session = stateManager.getUserSession(userId);
          const partner = session ? stateManager.getSessionPartner(userId) : null;
          if (!partner) break;
          send(partner, { type: 'fun-exit', from: userId });
          break;
        }

        default: {
          send(userId, { type: 'error', message: `Unsupported message type: ${(message as any).type}` });
        }
      }
    });

    // ═══════════════════════════════════════════════════════════════
    // 🔌 CONNECTION LIFECYCLE EVENTS
    // ═══════════════════════════════════════════════════════════════

    ws.on('close', (code, reason) => {
      handleUserDisconnect(userId);
      logger.info(`🔌 Connection closed: ${userId} (${code}: ${reason})`);
    });

    ws.on('error', (error) => {
      logger.error(`🔌 WebSocket error for ${userId}:`, error);
      handleUserDisconnect(userId);
    });

  } catch (error) {
    logger.error('🔌 Connection setup failed:', error);
    ws.close(4002, 'Authentication failed');
  }
});

// ═══════════════════════════════════════════════════════════════
// ❤️ HEARTBEAT SYSTEM - Ghost User Prevention
// ═══════════════════════════════════════════════════════════════

const heartbeatTimer = setInterval(() => {
  const stats = stateManager.getStats();
  
  logger.info(`💓 Heartbeat: ${stats.totalUsers} users, ${stats.activeSessions} sessions, V:${stats.searchingVideo}/A:${stats.searchingAudio}/T:${stats.searchingText} searching`);

  wss.clients.forEach((ws) => {
    if (ws.readyState === ws.OPEN) {
      try {
        ws.send(JSON.stringify({ type: 'ping' }));
      } catch (error) {
        // silent
      }
    }
  });
}, HEARTBEAT_INTERVAL);

// ═══════════════════════════════════════════════════════════════
// 🧹 MAINTENANCE SYSTEM - System Health & Cleanup
// ═══════════════════════════════════════════════════════════════

const maintenanceTimer = setInterval(() => {
  try {
    matchmaking.performMaintenance();
    
    const stats = matchmaking.getStats();
    logger.debug(`📊 System stats:`, stats);

    // Log warnings if queue is getting large
    if (stats.searchingUsers > 50) {
      logger.warn(`⚠️ Large queue detected: ${stats.searchingUsers} users waiting`);
    }

  } catch (error) {
    logger.error('🧹 Maintenance error:', error);
  }
}, MAINTENANCE_INTERVAL);

// ═══════════════════════════════════════════════════════════════
// 🔄 GRACEFUL SHUTDOWN - Cleanup All Resources
// ═══════════════════════════════════════════════════════════════

function gracefulShutdown(signal: string) {
  logger.info(`📴 ${signal} received - shutting down gracefully`);
  
  // Clear timers
  clearInterval(heartbeatTimer);
  clearInterval(maintenanceTimer);
  
  // Notify all connected users
  const stats = stateManager.getStats();
  logger.info(`📴 Disconnecting ${stats.totalUsers} users...`);

  // Close all WebSocket connections
  wss.clients.forEach((ws) => {
    if (ws.readyState === ws.OPEN) {
      ws.close(1001, 'Server shutting down');
    }
  });

  // Close HTTP server
  httpServer.close(() => {
    logger.info('📴 Server shutdown complete');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('📴 Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

// ═══════════════════════════════════════════════════════════════
// 🚀 SERVER STARTUP
// ═══════════════════════════════════════════════════════════════

httpServer.listen(env.port, () => {
  logger.info(`🚀 UniTalks Server started`);
  logger.info(`📡 HTTP server: http://localhost:${env.port}`);
  logger.info(`🔌 WebSocket: ws://localhost:${env.port}/ws`);
  logger.info(`🎯 Environment: ${env.nodeEnv}`);
  logger.info(`❤️ Heartbeat: ${HEARTBEAT_INTERVAL}ms`);
  logger.info(`🧹 Maintenance: ${MAINTENANCE_INTERVAL}ms`);
  logger.info('');
  logger.info('🎉 Ready to match users following Omegle-like rules!');
});
