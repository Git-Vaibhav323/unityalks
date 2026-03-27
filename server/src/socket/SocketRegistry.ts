import type Redis from 'ioredis';
import type { WebSocket } from 'ws';
import { logger } from '../utils/logger';

type RegistryMetadata = {
  mode?: 'video' | 'audio' | 'text';
  [key: string]: string | number | boolean | undefined;
};

type BroadcastEnvelope = {
  roomId: string;
  message: unknown;
  fromInstance: string;
  sentAt: number;
};

type RegistryRecord = {
  socketId: string;
  userId: string;
  instanceId: string;
  metadata: string;
};

const SOCKET_KEY_PREFIX = 'socket';
const USER_SOCKET_PREFIX = 'usersocket';
const ROOM_SOCKETS_PREFIX = 'room';
const GLOBAL_SOCKETS_SET = 'sockets:all';
const INSTANCE_SOCKETS_PREFIX = 'instance';
const ROOM_CHANNEL_PREFIX = 'room';
const DEFAULT_TTL_SECONDS = 60 * 60 * 24;

export class SocketRegistry {
  private readonly instanceId: string;
  private readonly ttlSeconds: number;
  private readonly redis: Redis;
  private readonly pubClient: Redis;
  private readonly subClient: Redis;
  private readonly localSockets = new Map<string, WebSocket>();
  private readonly localUsers = new Map<string, string>();
  private readonly localSocketRooms = new Map<string, Set<string>>();

  constructor(redisClient: Redis, instanceId: string, ttlSeconds = DEFAULT_TTL_SECONDS) {
    this.redis = redisClient;
    this.instanceId = instanceId;
    this.ttlSeconds = ttlSeconds;
    this.pubClient = redisClient.duplicate();
    this.subClient = redisClient.duplicate();
  }

  async start(): Promise<void> {
    await this.subClient.psubscribe(`${ROOM_CHANNEL_PREFIX}:*`);
    this.subClient.on('pmessage', async (_pattern, channel, payload) => {
      if (!channel.startsWith(`${ROOM_CHANNEL_PREFIX}:`)) return;
      const roomId = channel.slice(ROOM_CHANNEL_PREFIX.length + 1);
      try {
        const envelope = JSON.parse(payload) as BroadcastEnvelope;
        await this.fanoutRoom(roomId, envelope.message);
      } catch (error) {
        logger.error('SocketRegistry failed to fanout room message:', error);
      }
    });
  }

  async stop(): Promise<void> {
    await this.subClient.punsubscribe(`${ROOM_CHANNEL_PREFIX}:*`);
    this.subClient.removeAllListeners('pmessage');
    this.subClient.disconnect();
    this.pubClient.disconnect();
  }

  async register(socketId: string, userId: string, socket: WebSocket, metadata: RegistryMetadata = {}): Promise<void> {
    this.localSockets.set(socketId, socket);
    this.localUsers.set(userId, socketId);
    this.localSocketRooms.set(socketId, new Set());

    const socketKey = this.socketKey(socketId);
    const userSocketKey = this.userSocketKey(userId);
    const instanceSocketsKey = this.instanceSocketsKey();
    const record: RegistryRecord = {
      socketId,
      userId,
      instanceId: this.instanceId,
      metadata: JSON.stringify(metadata),
    };

    await this.redis
      .multi()
      .hmset(socketKey, record as unknown as Record<string, string>)
      .set(userSocketKey, socketId)
      .sadd(GLOBAL_SOCKETS_SET, socketId)
      .sadd(instanceSocketsKey, socketId)
      .expire(socketKey, this.ttlSeconds)
      .expire(userSocketKey, this.ttlSeconds)
      .expire(instanceSocketsKey, this.ttlSeconds)
      .exec();
  }

  async unregister(socketId: string): Promise<void> {
    const socketKey = this.socketKey(socketId);
    const record = await this.redis.hgetall(socketKey);
    const userId = record.userId || this.findUserIdBySocketId(socketId);

    if (userId) {
      this.localUsers.delete(userId);
      const currentSocketId = await this.redis.get(this.userSocketKey(userId));
      if (currentSocketId === socketId) {
        await this.redis.del(this.userSocketKey(userId));
      }
    }

    const roomIds = await this.redis.smembers(this.socketRoomsKey(socketId));
    if (roomIds.length > 0) {
      const multi = this.redis.multi();
      for (const roomId of roomIds) {
        multi.srem(this.roomSocketsKey(roomId), socketId);
      }
      await multi.exec();
    }

    await this.redis
      .multi()
      .del(socketKey)
      .del(this.socketRoomsKey(socketId))
      .srem(GLOBAL_SOCKETS_SET, socketId)
      .srem(this.instanceSocketsKey(), socketId)
      .exec();

    this.localSockets.delete(socketId);
    this.localSocketRooms.delete(socketId);
  }

  getSocket(socketId: string): WebSocket | undefined {
    return this.localSockets.get(socketId);
  }

  async getUserSocket(userId: string): Promise<WebSocket | undefined> {
    const socketId = await this.redis.get(this.userSocketKey(userId));
    if (!socketId) return undefined;
    return this.localSockets.get(socketId);
  }

  async getUserSocketId(userId: string): Promise<string | null> {
    const local = this.localUsers.get(userId);
    if (local) return local;
    return this.redis.get(this.userSocketKey(userId));
  }

  async assignSocketToRoom(socketId: string, roomId: string): Promise<void> {
    const rooms = this.localSocketRooms.get(socketId);
    if (rooms) {
      rooms.add(roomId);
    }

    await this.redis
      .multi()
      .sadd(this.roomSocketsKey(roomId), socketId)
      .sadd(this.socketRoomsKey(socketId), roomId)
      .expire(this.roomSocketsKey(roomId), this.ttlSeconds)
      .expire(this.socketRoomsKey(socketId), this.ttlSeconds)
      .exec();
  }

  async assignUserToRoom(userId: string, roomId: string): Promise<void> {
    const socketId = await this.getUserSocketId(userId);
    if (!socketId) return;
    await this.assignSocketToRoom(socketId, roomId);
  }

  async unassignUserFromRoom(userId: string, roomId: string): Promise<void> {
    const socketId = await this.getUserSocketId(userId);
    if (!socketId) return;
    await this.unassignSocketFromRoom(socketId, roomId);
  }

  async unassignSocketFromRoom(socketId: string, roomId: string): Promise<void> {
    const rooms = this.localSocketRooms.get(socketId);
    rooms?.delete(roomId);

    await this.redis
      .multi()
      .srem(this.roomSocketsKey(roomId), socketId)
      .srem(this.socketRoomsKey(socketId), roomId)
      .exec();
  }

  async broadcast(roomId: string, message: unknown): Promise<void> {
    const envelope: BroadcastEnvelope = {
      roomId,
      message,
      fromInstance: this.instanceId,
      sentAt: Date.now(),
    };
    await this.pubClient.publish(this.roomChannel(roomId), JSON.stringify(envelope));
  }

  async totalConnected(): Promise<number> {
    return this.redis.scard(GLOBAL_SOCKETS_SET);
  }

  getLocalConnectionCount(): number {
    return this.localSockets.size;
  }

  getLocalSocketIds(): string[] {
    return Array.from(this.localSockets.keys());
  }

  async unregisterAllLocal(): Promise<void> {
    const socketIds = this.getLocalSocketIds();
    for (const socketId of socketIds) {
      await this.unregister(socketId);
    }
  }

  private async fanoutRoom(roomId: string, message: unknown): Promise<void> {
    const socketIds = await this.redis.smembers(this.roomSocketsKey(roomId));
    const payload = JSON.stringify(message);

    for (const socketId of socketIds) {
      const socket = this.localSockets.get(socketId);
      if (!socket || socket.readyState !== socket.OPEN) {
        continue;
      }
      try {
        socket.send(payload);
      } catch (error) {
        logger.error(`SocketRegistry failed local room send (${roomId}, ${socketId}):`, error);
      }
    }
  }

  private findUserIdBySocketId(socketId: string): string | undefined {
    for (const [userId, candidateSocketId] of this.localUsers.entries()) {
      if (candidateSocketId === socketId) return userId;
    }
    return undefined;
  }

  private socketKey(socketId: string): string {
    return `${SOCKET_KEY_PREFIX}:${socketId}`;
  }

  private userSocketKey(userId: string): string {
    return `${USER_SOCKET_PREFIX}:${userId}`;
  }

  private roomSocketsKey(roomId: string): string {
    return `${ROOM_SOCKETS_PREFIX}:${roomId}:sockets`;
  }

  private socketRoomsKey(socketId: string): string {
    return `${SOCKET_KEY_PREFIX}:${socketId}:rooms`;
  }

  private instanceSocketsKey(): string {
    return `${INSTANCE_SOCKETS_PREFIX}:${this.instanceId}:sockets`;
  }

  private roomChannel(roomId: string): string {
    return `${ROOM_CHANNEL_PREFIX}:${roomId}`;
  }
}
