import cors from 'cors';
import express from 'express';
import { randomUUID } from 'crypto';
import { createServer } from 'http';
import os from 'os';
import { WebSocketServer } from 'ws';
import { env } from './config/env';
import { redis } from './config/redis';
import { verifyToken } from './config/jwt';
import authRoutes from './routes/auth';
import { MatchmakingService } from './services/matchmaking';
import { StateManager } from './services/stateManager';
import { SocketRegistry } from './socket/SocketRegistry';
import { generateTurnCredentials } from './services/turnCredentials';
import { WorkerMessagingService } from './services/workerMessaging';
import { ClientMessage, ServerMessage } from './types';
import { logger } from './utils/logger';

const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.get('/api/turn-credentials', (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({ error: 'Missing token' });
      return;
    }
    const payload = verifyToken(token);
    res.json(generateTurnCredentials(payload.userId));
  } catch (error) {
    logger.error('Failed to generate TURN credentials:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
const instanceId = process.env.INSTANCE_ID ?? `${os.hostname()}-${process.pid}`;

app.get('/health', async (_req, res) => {
  try {
    const redisConnections = await socketRegistry.totalConnected();
    res.json({
      status: 'ok',
      localConnections: wss.clients.size,
      redisConnections,
      instanceId,
    });
  } catch (error) {
    logger.error('Failed to build /health payload:', error);
    res.status(500).json({
      status: 'error',
      localConnections: wss.clients.size,
      redisConnections: -1,
      instanceId,
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🏗️ SYSTEM INITIALIZATION - Following Omegle Architecture
// ═══════════════════════════════════════════════════════════════

const stateManager = new StateManager();
const matchmaking = new MatchmakingService(stateManager);
const socketRegistry = new SocketRegistry(redis, instanceId);
const workerMessaging = new WorkerMessagingService(async (userId, message) => {
  const socket = await socketRegistry.getUserSocket(userId);
  if (!socket || socket.readyState !== socket.OPEN) {
    return false;
  }
  try {
    socket.send(JSON.stringify(message));
    return true;
  } catch (error) {
    logger.error(`Failed local send to ${userId}:`, error);
    return false;
  }
});

const HEARTBEAT_INTERVAL = 15000; // 15 seconds
const MAINTENANCE_INTERVAL = 30000; // 30 seconds
const disconnectingUsers = new Set<string>();

// ═══════════════════════════════════════════════════════════════
// 📡 MESSAGING UTILITIES
// ═══════════════════════════════════════════════════════════════

async function send(userId: string, message: ServerMessage): Promise<boolean> {
  return workerMessaging.routeSend(userId, message);
}

// ═══════════════════════════════════════════════════════════════
// 🎯 CORE MATCHMAKING FLOW
// ═══════════════════════════════════════════════════════════════

async function attemptMatch(): Promise<void> {
  // Try to match as many pairs as possible in each mode
  // The while loop ensures we consume the queue until < 2 users remain
  
  // 1. Video Queue
  let videoMatched = true;
  while (videoMatched) {
    const sessionId = await matchmaking.findMatch('video');
    if (sessionId) {
      const session = await stateManager.getSession(sessionId);
      if (session) {
        await handleMatchSuccess(session.userA, session.userB, sessionId, 'video');
      }
    } else {
      videoMatched = false;
    }
  }

  // 2. Audio Queue
  let audioMatched = true;
  while (audioMatched) {
    const sessionId = await matchmaking.findMatch('audio');
    if (sessionId) {
      const session = await stateManager.getSession(sessionId);
      if (session) {
        await handleMatchSuccess(session.userA, session.userB, sessionId, 'audio');
      }
    } else {
      audioMatched = false;
    }
  }

  // 3. Text Queue
  let textMatched = true;
  while (textMatched) {
    const sessionId = await matchmaking.findMatch('text');
    if (sessionId) {
      const session = await stateManager.getSession(sessionId);
      if (session) {
        await handleMatchSuccess(session.userA, session.userB, sessionId, 'text');
      }
    } else {
      textMatched = false;
    }
  }
}

async function handleMatchSuccess(userA: string, userB: string, sessionId: string, mode: 'video' | 'audio' | 'text'): Promise<void> {
  // Determine initiator (first user is initiator)
  const userARecord = await stateManager.getUser(userA);
  const userBRecord = await stateManager.getUser(userB);
  
  if (!userARecord || !userBRecord) {
    await stateManager.endSession(sessionId);
    return;
  }

  const initiator = (userARecord.enqueuedAt || 0) <= (userBRecord.enqueuedAt || 0) ? userA : userB;
  const turnA = generateTurnCredentials(userA);
  const turnB = generateTurnCredentials(userB);

  // Send match notifications
  const sentA = await send(userA, {
    type: 'matched', 
    partnerId: userB, 
    initiator: initiator === userA,
    sessionId,
    turnCredentials: turnA,
  });
  
  const sentB = await send(userB, {
    type: 'matched', 
    partnerId: userA, 
    initiator: initiator === userB,
    sessionId,
    turnCredentials: turnB,
  });

  if (!sentA || !sentB) {
    logger.warn(`❌ Match notification failed for session ${sessionId} (A: ${sentA}, B: ${sentB}) - rolling back`);
    await stateManager.endSession(sessionId);
    
    // Requeue the user who successfully received the message (if any)
    if (sentA) {
      await matchmaking.enqueueUser(userA);
      await send(userA, { type: 'error', message: 'Partner connection failed, searching again...' });
    }
    if (sentB) {
      await matchmaking.enqueueUser(userB);
      await send(userB, { type: 'error', message: 'Partner connection failed, searching again...' });
    }
    return;
  }

  await socketRegistry.assignUserToRoom(userA, sessionId);
  await socketRegistry.assignUserToRoom(userB, sessionId);
  logger.info(`🎯 ${mode} Match sent: ${userA} <-> ${userB} (session: ${sessionId})`);
}

// ═══════════════════════════════════════════════════════════════
// 🧹 CLEANUP & DISCONNECTION HANDLING
// ═══════════════════════════════════════════════════════════════

async function handleUserDisconnect(userId: string): Promise<void> {
  if (disconnectingUsers.has(userId)) return;
  disconnectingUsers.add(userId);
  try {
  const user = await stateManager.getUser(userId);
  if (!user) return;

  // If user is in a session, notify partner
  const partner = await stateManager.getSessionPartner(userId);
  if (partner) {
    await send(partner, { type: 'partner-left' });
    
    // End session and requeue partner
    if (user.sessionId) {
      await socketRegistry.unassignUserFromRoom(userId, user.sessionId);
      await socketRegistry.unassignUserFromRoom(partner, user.sessionId);
      await stateManager.endSession(user.sessionId, userId);
    }
    
    // Auto-requeue partner at END of queue (FIFO rule)
    const partnerUser = await stateManager.getUser(partner);
    if (partnerUser) {
      const enqueueResult = await matchmaking.enqueueUser(partner);
      if (enqueueResult.success) {
        await send(partner, { type: 'queue', position: enqueueResult.queuePosition || 1 });
        logger.info(`🔄 Partner ${partner} requeued at END after disconnect (FIFO)`);
        await attemptMatch();
      }
    }
  }

  // Remove user completely
  await stateManager.removeUser(userId);
  logger.info(`👋 User disconnected: ${userId}`);
  } finally {
    disconnectingUsers.delete(userId);
  }
}

// ═══════════════════════════════════════════════════════════════
// 🔌 WEBSOCKET CONNECTION HANDLING - Omegle Rules Implementation
// ═══════════════════════════════════════════════════════════════

wss.on('connection', async (ws, request) => {
  let userId: string;
  const socketId = randomUUID();
  
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

    // Bind handlers immediately so early client messages are not dropped.
    const setupPromise = (async () => {
      await socketRegistry.register(socketId, userId, ws, { mode: 'video' });
      await stateManager.addUser(userId);
      await send(userId, { type: 'ready', userId });
      logger.info(`🔌 User connected: ${userId}`);
    })();

    ws.on('message', async (raw) => {
      await setupPromise;
      let message: ClientMessage;

      // ═══════════════════════════════════════════════════════════════
      // 📨 MESSAGE HANDLING - Following Omegle Protocol Rules
      // ═══════════════════════════════════════════════════════════════

      try {
        message = JSON.parse(raw.toString()) as ClientMessage;
      } catch (err) {
        await send(userId, { type: 'error', message: 'Invalid message format' });
        return;
      }

      // Update user activity
      await stateManager.updateLastPong(userId);

      switch (message.type) {
        // ───────────────────────────────────────────────────────────
        // 1️⃣ JOIN QUEUE - Enqueue Rules Implementation
        // ───────────────────────────────────────────────────────────
        case 'join': {
          const mode = message.mode || 'video';
          await stateManager.setMode(userId, mode);
          
          const result = await matchmaking.enqueueUser(userId);
          
          if (!result.success) {
            await send(userId, { type: 'error', message: result.reason || 'Cannot join queue' });
            break;
          }

          // Send queue position
          await send(userId, { type: 'queue', position: result.queuePosition || 1 });
          logger.info(`📥 ${userId} joined ${mode} queue (position: ${result.queuePosition})`);

          // Attempt matchmaking
          await attemptMatch();
          break;
        }

        // ───────────────────────────────────────────────────────────
        // 2️⃣ CANCEL SEARCH - Dequeue Rules
        // ───────────────────────────────────────────────────────────
        case 'cancel': {
          const success = await matchmaking.cancelSearch(userId);
          if (success) {
            await send(userId, { type: 'search-cancelled' });
            logger.info(`🚫 ${userId} cancelled search`);
          }
          break;
        }

        // ───────────────────────────────────────────────────────────
        // 3️⃣ SESSION ACKNOWLEDGMENT - 1-to-1 Session Rules
        // ───────────────────────────────────────────────────────────
        case 'acknowledge': {
          const sessionReady = await stateManager.acknowledgeSession(userId);
          if (sessionReady) {
            const partner = await stateManager.getSessionPartner(userId);
            if (partner) {
              // Notify both users that session is fully active
              await send(userId, { type: 'session-ready' });
              await send(partner, { type: 'session-ready' });
              logger.info(`✅ Session ready: ${userId} <-> ${partner}`);
            }
          }
          break;
        }

        // ───────────────────────────────────────────────────────────
        // 4️⃣ WEBRTC SIGNALING - Active Session Only
        // ───────────────────────────────────────────────────────────
        case 'signal': {
          const session = await stateManager.getUserSession(userId);
          if (!session) {
            await send(userId, { type: 'error', message: 'No active session for signaling' });
            break;
          }

          // Allow signaling as soon as session exists (pending or active) so first offer isn't dropped
          if (session.state !== 'pending' && session.state !== 'active') {
            await send(userId, { type: 'error', message: 'Session not ready for signaling' });
            break;
          }

          const partner = await stateManager.getSessionPartner(userId);
          if (!partner) {
            await send(userId, { type: 'error', message: 'Partner not found' });
            break;
          }

          // Forward signal to partner
          await send(partner, {
            type: 'signal',
            from: userId,
            signalType: message.signalType,
            data: message.data,
          });

          // Update session activity
          if (session) {
            session.lastActivity = Date.now();
            await redis.hmset(`session:${session.sessionId}`, { lastActivity: session.lastActivity.toString() });
          }
          break;
        }

        // ───────────────────────────────────────────────────────────
        // 5️⃣ SKIP PARTNER - Skip Rules Implementation
        // ───────────────────────────────────────────────────────────
        case 'skip': {
          const currentSession = await stateManager.getUserSession(userId);
          const skipResult = await stateManager.handleSkip(userId);
          
          if (!skipResult.success) {
            await send(userId, { type: 'error', message: skipResult.reason || 'Cannot skip' });
            break;
          }

          if (currentSession) {
            await socketRegistry.unassignUserFromRoom(userId, currentSession.sessionId);
            if (skipResult.partner) {
              await socketRegistry.unassignUserFromRoom(skipResult.partner, currentSession.sessionId);
            }
          }

          // Notify partner they were skipped
          if (skipResult.partner) {
            await send(skipResult.partner, { type: 'partner-skipped' });
            
            // Requeue skipped partner at END of queue (FIFO rule)
            // Note: Their mode remains set from previous join
            const partnerEnqueue = await matchmaking.enqueueUser(skipResult.partner);
            if (partnerEnqueue.success) {
              await send(skipResult.partner, { type: 'queue', position: partnerEnqueue.queuePosition || 1 });
            }
          }

          // Requeue skipper at END of queue (FIFO rule - no priority for skipping)
          const userEnqueue = await matchmaking.enqueueUser(userId);
          if (userEnqueue.success) {
            await send(userId, { type: 'queue', position: userEnqueue.queuePosition || 1 });
          }

          logger.info(`⏭️ ${userId} skipped partner ${skipResult.partner} (both requeued at end)`);

          // Attempt new matches
          await attemptMatch();
          break;
        }

        // ───────────────────────────────────────────────────────────
        // 6️⃣ LEAVE SYSTEM - Disconnect Rules
        // ───────────────────────────────────────────────────────────
        case 'leave': {
          await socketRegistry.unregister(socketId);
          await handleUserDisconnect(userId);
          break;
        }

        // ───────────────────────────────────────────────────────────
        // 7️⃣ HEARTBEAT - Connection Health
        // ───────────────────────────────────────────────────────────
        case 'pong': {
          await stateManager.updateLastPong(userId);
          break;
        }

        // ───────────────────────────────────────────────────────────
        // FUN REQUEST / ACCEPT / REJECT - Forward to partner
        // ───────────────────────────────────────────────────────────
        case 'fun-request': {
          const session = await stateManager.getUserSession(userId);
          const partner = session ? await stateManager.getSessionPartner(userId) : null;
          if (!partner) {
            await send(userId, { type: 'error', message: 'No active session for fun request' });
            break;
          }
          const game = (message as any).game || 'chess';
          await send(partner, { type: 'fun-request', from: userId, game });
          break;
        }
        case 'fun-accept': {
          const session = await stateManager.getUserSession(userId);
          const partner = session ? await stateManager.getSessionPartner(userId) : null;
          if (!partner) break;
          const game = (message as any).game || 'chess';
          await send(partner, { type: 'fun-accept', from: userId, game });
          break;
        }
        case 'fun-reject': {
          const session = await stateManager.getUserSession(userId);
          const partner = session ? await stateManager.getSessionPartner(userId) : null;
          if (!partner) break;
          await send(partner, { type: 'fun-reject', from: userId });
          break;
        }
        case 'fun-exit': {
          const session = await stateManager.getUserSession(userId);
          const partner = session ? await stateManager.getSessionPartner(userId) : null;
          if (!partner) break;
          await send(partner, { type: 'fun-exit', from: userId });
          break;
        }

        case 'test-join-room': {
          const payload = message as { roomId?: string };
          if (!payload.roomId) {
            await send(userId, { type: 'error', message: 'roomId is required' });
            break;
          }
          await socketRegistry.assignUserToRoom(userId, payload.roomId);
          await send(userId, { type: 'queue', position: 1 });
          break;
        }

        case 'test-broadcast': {
          const payload = message as { roomId?: string; data?: unknown };
          if (!payload.roomId) {
            await send(userId, { type: 'error', message: 'roomId is required' });
            break;
          }
          await socketRegistry.broadcast(payload.roomId, {
            type: 'test-broadcast',
            from: userId,
            data: payload.data ?? null,
          });
          break;
        }

        default: {
          await send(userId, { type: 'error', message: `Unsupported message type: ${(message as any).type}` });
        }
      }
    });
    await setupPromise;

    // ═══════════════════════════════════════════════════════════════
    // 🔌 CONNECTION LIFECYCLE EVENTS
    // ═══════════════════════════════════════════════════════════════

    ws.on('close', async (code, reason) => {
      await socketRegistry.unregister(socketId);
      await handleUserDisconnect(userId);
      logger.info(`🔌 Connection closed: ${userId} (${code}: ${reason})`);
    });

    ws.on('error', async (error) => {
      logger.error(`🔌 WebSocket error for ${userId}:`, error);
      await socketRegistry.unregister(socketId);
      await handleUserDisconnect(userId);
    });

  } catch (error) {
    logger.error('🔌 Connection setup failed:', error);
    ws.close(4002, 'Authentication failed');
  }
});

// ═══════════════════════════════════════════════════════════════
// ❤️ HEARTBEAT SYSTEM - Ghost User Prevention
// ═══════════════════════════════════════════════════════════════

const heartbeatTimer = setInterval(async () => {
  const stats = await stateManager.getStats();
  
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

const maintenanceTimer = setInterval(async () => {
  try {
    await matchmaking.performMaintenance();
    
    const stats = await matchmaking.getStats();
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

async function gracefulShutdown(signal: string) {
  logger.info(`📴 ${signal} received - shutting down gracefully`);
  
  // Clear timers
  clearInterval(heartbeatTimer);
  clearInterval(maintenanceTimer);
  
  // Notify all connected users
  const stats = await stateManager.getStats();
  logger.info(`📴 Disconnecting ${stats.totalUsers} users...`);

  // Close all WebSocket connections
  wss.clients.forEach((ws) => {
    if (ws.readyState === ws.OPEN) {
      ws.close(1001, 'Server shutting down');
    }
  });

  await socketRegistry.unregisterAllLocal();
  await socketRegistry.stop();
  await workerMessaging.stop();

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

process.on('SIGTERM', () => { void gracefulShutdown('SIGTERM'); });
process.on('SIGINT', () => { void gracefulShutdown('SIGINT'); });

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught Exception:', error);
  void gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

// ═══════════════════════════════════════════════════════════════
// 🚀 SERVER STARTUP
// ═══════════════════════════════════════════════════════════════

Promise.all([workerMessaging.start(), socketRegistry.start()]).then(() => {
  httpServer.listen(env.port, () => {
    logger.info(`🚀 UniTalks Server started`);
    logger.info(`📡 HTTP server: http://localhost:${env.port}`);
    logger.info(`🔌 WebSocket: ws://localhost:${env.port}/ws`);
    logger.info(`🎯 Environment: ${env.nodeEnv}`);
    logger.info(`❤️ Heartbeat: ${HEARTBEAT_INTERVAL}ms`);
    logger.info(`🧹 Maintenance: ${MAINTENANCE_INTERVAL}ms`);
    logger.info(`🧵 Worker: ${workerMessaging.getWorkerId()}`);
    logger.info('');
    logger.info('🎉 Ready to match users following Omegle-like rules!');
  });
}).catch((error) => {
  logger.error('Failed to start messaging services:', error);
  process.exit(1);
});
