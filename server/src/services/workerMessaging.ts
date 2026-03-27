import Redis from 'ioredis';
import { redis } from '../config/redis';
import { ServerMessage } from '../types';
import { logger } from '../utils/logger';

type WorkerEnvelope = {
  userId: string;
  message: ServerMessage;
};

export class WorkerMessagingService {
  private readonly workerId: string;
  private readonly pubClient: Redis;
  private readonly subClient: Redis;
  private readonly sendLocal: (userId: string, message: ServerMessage) => Promise<boolean>;

  constructor(sendLocal: (userId: string, message: ServerMessage) => Promise<boolean>) {
    this.sendLocal = sendLocal;
    this.workerId = process.env.NODE_APP_INSTANCE || process.pid.toString();
    this.pubClient = redis.duplicate();
    this.subClient = redis.duplicate();
  }

  getWorkerId(): string {
    return this.workerId;
  }

  async start(): Promise<void> {
    await this.subClient.subscribe(`worker:${this.workerId}`);
    this.subClient.on('message', async (_channel, payload) => {
      try {
        const envelope = JSON.parse(payload) as WorkerEnvelope;
        await this.sendLocal(envelope.userId, envelope.message);
      } catch (error) {
        logger.error('Failed to process worker message:', error);
      }
    });
    logger.info(`Worker messaging subscribed on worker:${this.workerId}`);
  }

  async stop(): Promise<void> {
    await this.subClient.unsubscribe(`worker:${this.workerId}`);
    this.subClient.disconnect();
    this.pubClient.disconnect();
  }

  async setSocketOwner(userId: string): Promise<void> {
    await redis.set(`usersocket:${userId}`, this.workerId);
  }

  async removeSocketOwner(userId: string): Promise<void> {
    const owner = await redis.get(`usersocket:${userId}`);
    if (owner === this.workerId) {
      await redis.del(`usersocket:${userId}`);
    }
  }

  async routeSend(userId: string, message: ServerMessage): Promise<boolean> {
    const ownerWorkerId = await redis.get(`usersocket:${userId}`);
    if (!ownerWorkerId) return false;

    if (ownerWorkerId === this.workerId) {
      return this.sendLocal(userId, message);
    }

    const envelope: WorkerEnvelope = { userId, message };
    await this.pubClient.publish(`worker:${ownerWorkerId}`, JSON.stringify(envelope));
    return true;
  }
}

