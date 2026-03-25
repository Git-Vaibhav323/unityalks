import { UserState, Session, UserRecord } from '../types';
import { logger } from '../utils/logger';

export class StateManager {
  private users = new Map<string, UserRecord>();
  private sessions = new Map<string, Session>();
  private userSessions = new Map<string, string>(); // userId -> sessionId

  // Rate limiting constants - relaxed for better UX
  private readonly MAX_SKIPS_PER_MINUTE = 50; // Allow more skips for testing/normal use
  private readonly SKIP_COOLDOWN_MS = 60000;

  // ═══════════════════════════════════════════════════════════════
  // 1️⃣ USER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  addUser(userId: string, ws: import('ws').WebSocket): void {
    const existing = this.users.get(userId);
    if (existing) {
      // Clean up old connection
      this.removeUser(userId);
    }

    const user: UserRecord = {
      userId,
      ws,
      state: UserState.IDLE,
      lastPong: Date.now(),
      skipCount: 0,
      lastSkipTime: 0,
      mode: 'video' // Default
    };

    this.users.set(userId, user);
    logger.info(`User added: ${userId} (state: ${user.state})`);
  }

  removeUser(userId: string): void {
    const user = this.users.get(userId);
    if (!user) return;

    // End any active session
    if (user.sessionId) {
      this.endSession(user.sessionId, userId);
    }

    this.users.delete(userId);
    logger.info(`User removed: ${userId}`);
  }

  getUser(userId: string): UserRecord | undefined {
    return this.users.get(userId);
  }

  updateUserState(userId: string, newState: UserState): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    const oldState = user.state;
    user.state = newState;
    
    logger.debug(`User state: ${userId} ${oldState} → ${newState}`);
    return true;
  }

  updateLastPong(userId: string): void {
    const user = this.users.get(userId);
    if (user) {
      user.lastPong = Date.now();
    }
  }

  setMode(userId: string, mode: 'video' | 'audio' | 'text'): void {
    const user = this.users.get(userId);
    if (user) {
      user.mode = mode;
      logger.info(`Set mode for ${userId} to ${mode}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 2️⃣ ENQUEUE RULES ENFORCEMENT  
  // ═══════════════════════════════════════════════════════════════

  canEnqueue(userId: string): { allowed: boolean; reason?: string } {
    const user = this.users.get(userId);
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
    if (this.isRateLimited(userId)) {
      return { allowed: false, reason: 'Rate limited - too many skips' };
    }

    return { allowed: true };
  }

  enqueueUser(userId: string): boolean {
    const validation = this.canEnqueue(userId);
    if (!validation.allowed) {
      logger.warn(`Enqueue blocked: ${userId} - ${validation.reason}`);
      return false;
    }

    const user = this.users.get(userId)!;
    user.state = UserState.SEARCHING;
    user.enqueuedAt = Date.now(); // Always add to END of queue (FIFO)

    const queuePosition = this.getQueuePosition(userId);
    logger.info(`✅ User enqueued at END: ${userId} (mode: ${user.mode}, position: ${queuePosition}, no reconnection restrictions)`);
    return true;
  }

  dequeueUser(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user || user.state !== UserState.SEARCHING) {
      return false;
    }

    user.state = UserState.IDLE;
    user.enqueuedAt = undefined;

    logger.info(`User dequeued: ${userId}`);
    return true;
  }

  // ═══════════════════════════════════════════════════════════════
  // 3️⃣ SESSION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  canCreateSession(userAId: string, userBId: string): { allowed: boolean; reason?: string } {
    const userA = this.users.get(userAId);
    const userB = this.users.get(userBId);

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

  createSession(userAId: string, userBId: string, _initiator: string): string | null {
    const validation = this.canCreateSession(userAId, userBId);
    if (!validation.allowed) {
      logger.warn(`Session creation blocked: ${userAId} <-> ${userBId} - ${validation.reason}`);
      return null;
    }

    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userA = this.users.get(userAId)!;
    
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
    const userB = this.users.get(userBId)!;

    userA.state = UserState.CONNECTED;
    userA.sessionId = sessionId;
    userA.enqueuedAt = undefined;

    userB.state = UserState.CONNECTED;
    userB.sessionId = sessionId;
    userB.enqueuedAt = undefined;

    this.sessions.set(sessionId, session);
    this.userSessions.set(userAId, sessionId);
    this.userSessions.set(userBId, sessionId);

    logger.info(`🔗 Session created: ${sessionId} (${userAId} <-> ${userBId}) [${session.mode}]`);
    return sessionId;
  }

  acknowledgeSession(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user?.sessionId) return false;

    const session = this.sessions.get(user.sessionId);
    if (!session) return false;

    session.acknowledgedBy.add(userId);
    session.lastActivity = Date.now();

    // If both users have acknowledged, activate session
    if (session.acknowledgedBy.size === 2) {
      session.state = 'active';
      logger.info(`🎯 Session activated: ${session.sessionId}`);
      return true; // Signal that session is now active
    }

    return false; // Waiting for other user
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  getUserSession(userId: string): Session | undefined {
    const sessionId = this.userSessions.get(userId);
    if (!sessionId) return undefined;
    return this.sessions.get(sessionId);
  }

  getSessionPartner(userId: string): string | undefined {
    const session = this.getUserSession(userId);
    if (!session) return undefined;
    
    return session.userA === userId ? session.userB : session.userA;
  }

  // ═══════════════════════════════════════════════════════════════
  // 4️⃣ SESSION TERMINATION
  // ═══════════════════════════════════════════════════════════════

  endSession(sessionId: string, initiatedBy?: string): { partner?: string; reason: string } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { reason: 'Session not found' };
    }

    const { userA, userB } = session;
    const partner = initiatedBy === userA ? userB : userA;

    // Clean up session
    this.sessions.delete(sessionId);
    this.userSessions.delete(userA);
    this.userSessions.delete(userB);

    // Update user states
    const userARecord = this.users.get(userA);
    const userBRecord = this.users.get(userB);

    if (userARecord) {
      userARecord.state = UserState.IDLE;
      userARecord.sessionId = undefined;
    }

    if (userBRecord) {
      userBRecord.state = UserState.IDLE;
      userBRecord.sessionId = undefined;
    }

    session.state = 'ended';
    
    const reason = initiatedBy ? 
      (initiatedBy === userA || initiatedBy === userB ? 'user_skip' : 'disconnect') : 
      'unknown';

    logger.info(`💔 Session ended: ${sessionId} (reason: ${reason})`);
    return { partner, reason };
  }

  // ═══════════════════════════════════════════════════════════════
  // 5️⃣ SKIP HANDLING
  // ═══════════════════════════════════════════════════════════════

  handleSkip(userId: string): { success: boolean; partner?: string; reason?: string } {
    const user = this.users.get(userId);
    if (!user) {
      return { success: false, reason: 'User not found' };
    }

    if (user.state !== UserState.CONNECTED || !user.sessionId) {
      return { success: false, reason: 'Not in active session' };
    }

    // Rate limiting check
    if (this.isRateLimited(userId)) {
      return { success: false, reason: 'Rate limited - too many skips' };
    }

    // Record skip for rate limiting
    user.skipCount++;
    user.lastSkipTime = Date.now();

    // End the session
    const result = this.endSession(user.sessionId, userId);
    
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

  getSearchingUsers(mode: 'video' | 'audio' | 'text' = 'video'): UserRecord[] {
    return Array.from(this.users.values())
      .filter(user => user.state === UserState.SEARCHING && user.mode === mode)
      .sort((a, b) => (a.enqueuedAt || 0) - (b.enqueuedAt || 0)); // FIFO
  }

  getQueuePosition(userId: string): number {
    const user = this.users.get(userId);
    if (!user) return -1;
    const searchingUsers = this.getSearchingUsers(user.mode);
    const index = searchingUsers.findIndex(u => u.userId === userId);
    return index === -1 ? -1 : index + 1;
  }

  // ═══════════════════════════════════════════════════════════════
  // 7️⃣ UTILITIES & VALIDATION
  // ═══════════════════════════════════════════════════════════════

  private isRateLimited(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    const timeSinceLastSkip = Date.now() - user.lastSkipTime;
    if (timeSinceLastSkip < this.SKIP_COOLDOWN_MS && user.skipCount >= this.MAX_SKIPS_PER_MINUTE) {
      return true;
    }

    // Reset skip count after cooldown
    if (timeSinceLastSkip >= this.SKIP_COOLDOWN_MS) {
      user.skipCount = 0;
    }

    return false;
  }

  // State validation for debugging
  validateState(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check for orphaned sessions
    this.sessions.forEach((session, sessionId) => {
      const userA = this.users.get(session.userA);
      const userB = this.users.get(session.userB);
      
      if (!userA || !userB) {
        issues.push(`Orphaned session: ${sessionId}`);
        this.sessions.delete(sessionId);
      }
    });

    // Check for invalid user states
    this.users.forEach((user) => {
      if (user.sessionId && !this.sessions.has(user.sessionId)) {
        issues.push(`User ${user.userId} references non-existent session ${user.sessionId}`);
        user.sessionId = undefined;
        user.state = UserState.IDLE;
      }
    });

    return { valid: issues.length === 0, issues };
  }

  // Stats for monitoring
  getStats() {
    const states = Array.from(this.users.values()).reduce((acc, user) => {
      acc[user.state] = (acc[user.state] || 0) + 1;
      return acc;
    }, {} as Record<UserState, number>);

    const video = this.getSearchingUsers('video').length;
    const audio = this.getSearchingUsers('audio').length;
    const text = this.getSearchingUsers('text').length;

    return {
      totalUsers: this.users.size,
      activeSessions: this.sessions.size,
      states,
      searchingVideo: video,
      searchingAudio: audio,
      searchingText: text,
      searchingUsers: video + audio + text
    };
  }
}
