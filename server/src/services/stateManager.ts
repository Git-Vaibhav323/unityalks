import { WebSocket } from 'ws';
import { redis } from '../config/redis';
import { UserState, Session, UserRecord } from '../types';
import { logger } from '../utils/logger';

export class StateManager {
  private sockets = new Map<string, WebSocket>();

  // Rate limiting constants - relaxed for better UX
  private readonly MAX_SKIPS_PER_MINUTE = 50; // Allow more skips for testing/normal use
  private readonly SKIP_COOLDOWN_MS = 60000;

  // ═══════════════════════════════════════════════════════════════
  // 1️⃣ USER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  async addUser(userId: string, ws: import('ws').WebSocket): Promise<void> {
    const existing = await this.getUser(userId);
    if (existing) {
      await this.removeUser(userId);
    }

    this.sockets.set(userId, ws);
    await redis.hmset(`user:${userId}`, {
      userId,
      state: UserState.IDLE,
      lastPong: Date.now().toString(),
      skipCount: '0',
      lastSkipTime: '0',
      mode: 'video',
    });
    logger.info(`User added: ${userId} (state: ${UserState.IDLE})`);
  }

  async removeUser(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    // End any active session
    if (user.sessionId) {
      await this.endSession(user.sessionId, userId);
    }

    await this.dequeueUser(userId);
    this.sockets.delete(userId);
    await redis.del(`usersession:${userId}`, `user:${userId}`);
    logger.info(`User removed: ${userId}`);
  }

  async getUser(userId: string): Promise<UserRecord | undefined> {
    const data = await redis.hgetall(`user:${userId}`);
    if (!data || !data.userId) return undefined;
    return {
      userId: data.userId,
      ws: this.sockets.get(userId),
      state: data.state as UserState,
      sessionId: data.sessionId || undefined,
      lastPong: parseInt(data.lastPong || '0', 10),
      skipCount: parseInt(data.skipCount || '0', 10),
      lastSkipTime: parseInt(data.lastSkipTime || '0', 10),
      enqueuedAt: data.enqueuedAt ? parseInt(data.enqueuedAt, 10) : undefined,
      mode: (data.mode as 'video' | 'audio' | 'text') || 'video',
    };
  }

  async updateUserState(userId: string, newState: UserState): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    const oldState = user.state;
    await redis.hmset(`user:${userId}`, { state: newState });
    
    logger.debug(`User state: ${userId} ${oldState} → ${newState}`);
    return true;
  }

  async updateLastPong(userId: string): Promise<void> {
    const exists = await redis.exists(`user:${userId}`);
    if (exists) await redis.hmset(`user:${userId}`, { lastPong: Date.now().toString() });
  }

  async setMode(userId: string, mode: 'video' | 'audio' | 'text'): Promise<void> {
    const exists = await redis.exists(`user:${userId}`);
    if (exists) await redis.hmset(`user:${userId}`, { mode });
    logger.info(`Set mode for ${userId} to ${mode}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 2️⃣ ENQUEUE RULES ENFORCEMENT  
  // ═══════════════════════════════════════════════════════════════

  async canEnqueue(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { allowed: false, reason: 'User not found' };
    }

    // Rule: User must not already be in a session
    if (user.state === UserState.CONNECTED) {
      return { allowed: false, reason: 'Already in session' };
    }

    // Rule: User must not already be searching
    if (user.state === UserState.SEARCHING) {
      return { allowed: false, reason: 'Already searching' };
    }

    // Rule: Rate limiting check
    if (await this.isRateLimited(userId)) {
      return { allowed: false, reason: 'Rate limited - too many skips' };
    }

    return { allowed: true };
  }

  async enqueueUser(userId: string): Promise<boolean> {
    const validation = await this.canEnqueue(userId);
    if (!validation.allowed) {
      logger.warn(`Enqueue blocked: ${userId} - ${validation.reason}`);
      return false;
    }

    const user = await this.getUser(userId);
    if (!user) return false;
    const enqueuedAt = Date.now();
    await redis.multi()
      .hmset(`user:${userId}`, { state: UserState.SEARCHING, enqueuedAt: enqueuedAt.toString() })
      .zadd(`queue:${user.mode}`, enqueuedAt, userId)
      .exec();

    const queuePosition = await this.getQueuePosition(userId);
    logger.info(`✅ User enqueued at END: ${userId} (mode: ${user.mode}, position: ${queuePosition}, no reconnection restrictions)`);
    return true;
  }

  async dequeueUser(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || user.state !== UserState.SEARCHING) {
      return false;
    }

    await redis.multi()
      .hmset(`user:${userId}`, { state: UserState.IDLE })
      .hdel(`user:${userId}`, 'enqueuedAt')
      .zrem(`queue:${user.mode}`, userId)
      .exec();

    logger.info(`User dequeued: ${userId}`);
    return true;
  }

  // ═══════════════════════════════════════════════════════════════
  // 3️⃣ SESSION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  async canCreateSession(userAId: string, userBId: string): Promise<{ allowed: boolean; reason?: string }> {
    const userA = await this.getUser(userAId);
    const userB = await this.getUser(userBId);

    if (!userA || !userB) {
      return { allowed: false, reason: 'One or both users not found' };
    }

    // Rule: Both users must be searching
    if (userA.state !== UserState.SEARCHING || userB.state !== UserState.SEARCHING) {
      return { allowed: false, reason: 'Users not in searching state' };
    }

    // Rule: Cannot match with self
    if (userAId === userBId) {
      return { allowed: false, reason: 'Cannot match with self' };
    }

    // Rule: Both users must be available (not in any session)
    if (userA.sessionId || userB.sessionId) {
      return { allowed: false, reason: 'One or both users already in session' };
    }
    
    // Rule: Must be same mode
    if (userA.mode !== userB.mode) {
      return { allowed: false, reason: `Mode mismatch: ${userA.mode} vs ${userB.mode}` };
    }

    // ✅ NO RESTRICTIONS on previously connected users - they can reconnect freely
    // ✅ Following Omegle rules: any user can match with any other user multiple times

    return { allowed: true };
  }

  async createSession(userAId: string, userBId: string, _initiator: string): Promise<string | null> {
    const validation = await this.canCreateSession(userAId, userBId);
    if (!validation.allowed) {
      logger.warn(`Session creation blocked: ${userAId} <-> ${userBId} - ${validation.reason}`);
      return null;
    }

    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userA = await this.getUser(userAId);
    if (!userA) return null;
    
    // Atomic session creation
    const session: Session = {
      sessionId,
      userA: userAId,
      userB: userBId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      acknowledgedBy: new Set(),
      state: 'pending',
      mode: userA.mode
    };

    // Lock both users to this session
    await redis.multi()
      .hmset(`session:${sessionId}`, {
        sessionId,
        userA: session.userA,
        userB: session.userB,
        createdAt: session.createdAt.toString(),
        lastActivity: session.lastActivity.toString(),
        acknowledgedBy: '',
        state: session.state,
        mode: session.mode,
      })
      .hmset(`user:${userAId}`, { state: UserState.CONNECTED, sessionId })
      .hmset(`user:${userBId}`, { state: UserState.CONNECTED, sessionId })
      .hdel(`user:${userAId}`, 'enqueuedAt')
      .hdel(`user:${userBId}`, 'enqueuedAt')
      .zrem(`queue:${session.mode}`, userAId, userBId)
      .set(`usersession:${userAId}`, sessionId)
      .set(`usersession:${userBId}`, sessionId)
      .exec();

    logger.info(`🔗 Session created: ${sessionId} (${userAId} <-> ${userBId}) [${session.mode}]`);
    return sessionId;
  }

  async acknowledgeSession(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user?.sessionId) return false;

    const session = await this.getSession(user.sessionId);
    if (!session) return false;

    session.acknowledgedBy.add(userId);
    session.lastActivity = Date.now();
    await redis.hmset(`session:${session.sessionId}`, {
      acknowledgedBy: Array.from(session.acknowledgedBy).join(','),
      lastActivity: session.lastActivity.toString(),
    });

    // If both users have acknowledged, activate session
    if (session.acknowledgedBy.size === 2) {
      session.state = 'active';
      await redis.hmset(`session:${session.sessionId}`, { state: 'active' });
      logger.info(`🎯 Session activated: ${session.sessionId}`);
      return true; // Signal that session is now active
    }

    return false; // Waiting for other user
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    const data = await redis.hgetall(`session:${sessionId}`);
    if (!data || !data.sessionId) return undefined;
    return {
      sessionId: data.sessionId,
      userA: data.userA,
      userB: data.userB,
      createdAt: parseInt(data.createdAt || '0', 10),
      lastActivity: parseInt(data.lastActivity || '0', 10),
      acknowledgedBy: new Set((data.acknowledgedBy || '').split(',').filter(Boolean)),
      state: data.state as 'pending' | 'active' | 'ended',
      mode: data.mode as 'video' | 'audio' | 'text',
    };
  }

  async getUserSession(userId: string): Promise<Session | undefined> {
    const sessionId = await redis.get(`usersession:${userId}`);
    if (!sessionId) return undefined;
    return this.getSession(sessionId);
  }

  async getSessionPartner(userId: string): Promise<string | undefined> {
    const session = await this.getUserSession(userId);
    if (!session) return undefined;
    
    return session.userA === userId ? session.userB : session.userA;
  }

  // ═══════════════════════════════════════════════════════════════
  // 4️⃣ SESSION TERMINATION
  // ═══════════════════════════════════════════════════════════════

  async endSession(sessionId: string, initiatedBy?: string): Promise<{ partner?: string; reason: string }> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return { reason: 'Session not found' };
    }

    const { userA, userB } = session;
    const partner = initiatedBy === userA ? userB : userA;

    // Clean up session
    await redis.multi()
      .del(`session:${sessionId}`)
      .del(`usersession:${userA}`, `usersession:${userB}`)
      .hmset(`user:${userA}`, { state: UserState.IDLE })
      .hmset(`user:${userB}`, { state: UserState.IDLE })
      .hdel(`user:${userA}`, 'sessionId')
      .hdel(`user:${userB}`, 'sessionId')
      .exec();
    
    const reason = initiatedBy ? 
      (initiatedBy === userA || initiatedBy === userB ? 'user_skip' : 'disconnect') : 
      'unknown';

    logger.info(`💔 Session ended: ${sessionId} (reason: ${reason})`);
    return { partner, reason };
  }

  // ═══════════════════════════════════════════════════════════════
  // 5️⃣ SKIP HANDLING
  // ═══════════════════════════════════════════════════════════════

  async handleSkip(userId: string): Promise<{ success: boolean; partner?: string; reason?: string }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { success: false, reason: 'User not found' };
    }

    if (user.state !== UserState.CONNECTED || !user.sessionId) {
      return { success: false, reason: 'Not in active session' };
    }

    // Rate limiting check
    if (await this.isRateLimited(userId)) {
      return { success: false, reason: 'Rate limited - too many skips' };
    }

    // Record skip for rate limiting
    await redis.hmset(`user:${userId}`, {
      skipCount: (user.skipCount + 1).toString(),
      lastSkipTime: Date.now().toString(),
    });

    // End the session
    const result = await this.endSession(user.sessionId, userId);
    
    logger.info(`⏭️ Skip processed: ${userId} -> both users will be added to END of queue (FIFO)`);
    
    return { 
      success: true, 
      partner: result.partner, 
      reason: 'skipped' 
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 6️⃣ QUEUE OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  async getSearchingUsers(mode: 'video' | 'audio' | 'text' = 'video'): Promise<UserRecord[]> {
    const userIds = await redis.zrange(`queue:${mode}`, 0, -1);
    const users = await Promise.all(userIds.map((id) => this.getUser(id)));
    return users.filter((u): u is UserRecord => {
      return u !== undefined && u.state === UserState.SEARCHING;
    });
  }

  async getQueuePosition(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) return -1;
    const rank = await redis.zrank(`queue:${user.mode}`, userId);
    if (rank === null) return -1;
    return rank + 1;
  }

  // ═══════════════════════════════════════════════════════════════
  // 7️⃣ UTILITIES & VALIDATION
  // ═══════════════════════════════════════════════════════════════

  private async isRateLimited(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    const timeSinceLastSkip = Date.now() - user.lastSkipTime;
    if (timeSinceLastSkip < this.SKIP_COOLDOWN_MS && user.skipCount >= this.MAX_SKIPS_PER_MINUTE) {
      return true;
    }

    // Reset skip count after cooldown
    if (timeSinceLastSkip >= this.SKIP_COOLDOWN_MS) {
      await redis.hmset(`user:${userId}`, { skipCount: '0' });
    }

    return false;
  }

  // State validation for debugging
  async validateState(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];
    const keys = await redis.keys('usersession:*');
    for (const key of keys) {
      const userId = key.replace('usersession:', '');
      const sessionId = await redis.get(key);
      if (!sessionId) continue;
      const exists = await redis.exists(`session:${sessionId}`);
      if (!exists) {
        issues.push(`User ${userId} references non-existent session ${sessionId}`);
        await redis.multi().del(key).hdel(`user:${userId}`, 'sessionId').hmset(`user:${userId}`, { state: UserState.IDLE }).exec();
      }
    }

    return { valid: issues.length === 0, issues };
  }

  // Stats for monitoring
  async getStats() {
    const userKeys = await redis.keys('user:*');
    const users = await Promise.all(userKeys.map((key) => this.getUser(key.replace('user:', ''))));
    const liveUsers = users.filter((u): u is UserRecord => Boolean(u));
    const states = liveUsers.reduce((acc, user) => {
      acc[user.state] = (acc[user.state] || 0) + 1;
      return acc;
    }, {} as Record<UserState, number>);

    const video = await redis.zcard('queue:video');
    const audio = await redis.zcard('queue:audio');
    const text = await redis.zcard('queue:text');
    const sessionKeys = await redis.keys('session:*');

    return {
      totalUsers: liveUsers.length,
      activeSessions: sessionKeys.length,
      states,
      searchingVideo: video,
      searchingAudio: audio,
      searchingText: text,
      searchingUsers: video + audio + text,
    };
  }

  getSocket(userId: string): WebSocket | undefined {
    return this.sockets.get(userId);
  }
}
