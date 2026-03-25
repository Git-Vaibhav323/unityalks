import { StateManager } from './stateManager';
import { UserRecord } from '../types';
import { logger } from '../utils/logger';

export class MatchmakingService {
  private stateManager: StateManager;
  private readonly QUEUE_TIMEOUT_MS = 30000;

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔍 CORE MATCHMAKING LOGIC
  // ═══════════════════════════════════════════════════════════════

  /**
   * Attempt to find and create a match following FIFO rules
   * Returns the created session ID or null if no match possible
   */
  findMatch(mode: 'video' | 'audio' | 'text'): string | null {
    const searchingUsers = this.stateManager.getSearchingUsers(mode);
    
    // Prune stale entries
    this.pruneStaleUsers(searchingUsers);
    
    // Need at least 2 users to match
    if (searchingUsers.length < 2) {
      // Only log if not empty (to reduce noise)
      if (searchingUsers.length > 0) {
        logger.debug(`No ${mode} match possible: only ${searchingUsers.length} users searching`);
      }
      return null;
    }

    // Get first two users (STRICT FIFO order - earliest enqueuedAt first)
    const userA = searchingUsers[0]; // First in queue
    const userB = searchingUsers[1]; // Second in queue

    logger.info(`🔍 FIFO ${mode} Match attempt: ${userA.userId}(${new Date(userA.enqueuedAt || 0).toISOString()}) <-> ${userB.userId}(${new Date(userB.enqueuedAt || 0).toISOString()})`);

    // Determine initiator (first enqueued becomes initiator)
    const initiator = (userA.enqueuedAt || 0) <= (userB.enqueuedAt || 0) ? userA.userId : userB.userId;

    // Attempt atomic session creation
    const sessionId = this.stateManager.createSession(userA.userId, userB.userId, initiator);
    
    if (sessionId) {
      logger.info(`🎯 ✅ ${mode} Match created: ${userA.userId} <-> ${userB.userId} (session: ${sessionId}, queue now: ${this.getQueueLength(mode)})`);
    } else {
      logger.warn(`❌ ${mode} Match failed: ${userA.userId} <-> ${userB.userId} - will retry`);
      // Failed matches should retry - both users remain in queue
    }

    return sessionId;
  }

  /**
   * Add user to matchmaking queue following Omegle rules
   */
  enqueueUser(userId: string): { success: boolean; queuePosition?: number; reason?: string } {
    // Rule enforcement happens in StateManager
    const success = this.stateManager.enqueueUser(userId);
    
    if (!success) {
      const canEnqueue = this.stateManager.canEnqueue(userId);
      return { success: false, reason: canEnqueue.reason };
    }

    const queuePosition = this.stateManager.getQueuePosition(userId);
    
    logger.info(`📥 User enqueued: ${userId} (position: ${queuePosition})`);
    return { success: true, queuePosition };
  }

  /**
   * Remove user from queue
   */
  dequeueUser(userId: string): boolean {
    const success = this.stateManager.dequeueUser(userId);
    if (success) {
      logger.info(`📤 User dequeued: ${userId}`);
    }
    return success;
  }

  /**
   * Cancel user's search (user-initiated)
   */
  cancelSearch(userId: string): boolean {
    return this.dequeueUser(userId);
  }

  /**
   * Get current queue length
   */
  getQueueLength(mode: 'video' | 'audio' | 'text' = 'video'): number {
    return this.stateManager.getSearchingUsers(mode).length;
  }

  /**
   * Get user's position in queue
   */
  getUserQueuePosition(userId: string): number {
    return this.stateManager.getQueuePosition(userId);
  }

  // ═══════════════════════════════════════════════════════════════
  // 🧹 MAINTENANCE & CLEANUP
  // ═══════════════════════════════════════════════════════════════

  /**
   * Remove users who have been waiting too long
   */
  private pruneStaleUsers(searchingUsers: UserRecord[]): void {
    const cutoff = Date.now() - this.QUEUE_TIMEOUT_MS;
    
    for (const user of searchingUsers) {
      if ((user.enqueuedAt || 0) < cutoff) {
        this.stateManager.dequeueUser(user.userId);
        logger.info(`⏰ Pruned stale user: ${user.userId}`);
      }
    }
  }

  /**
   * Periodic cleanup task
   */
  performMaintenance(): void {
    // Check all queues
    const videoUsers = this.stateManager.getSearchingUsers('video');
    const audioUsers = this.stateManager.getSearchingUsers('audio');
    const textUsers = this.stateManager.getSearchingUsers('text');
    
    this.pruneStaleUsers(videoUsers);
    this.pruneStaleUsers(audioUsers);
    this.pruneStaleUsers(textUsers);
    
    // Validate system state
    const validation = this.stateManager.validateState();
    if (!validation.valid) {
      logger.warn('State validation issues:', validation.issues);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 📊 MONITORING & STATS
  // ═══════════════════════════════════════════════════════════════

  getStats() {
    return {
      ...this.stateManager.getStats(),
    };
  }
}
